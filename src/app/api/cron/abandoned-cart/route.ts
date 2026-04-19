import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { sendEmail } from '@/lib/services/email/sender'
import { abandonedCartTemplate } from '@/lib/services/email/templates/abandonedCart'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const sixtyMinsAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const seventyFiveMinsAgo = new Date(now.getTime() - 75 * 60 * 1000)

  // Carts abandoned 60-75 minutes ago (current cron window)
  const abandonedCarts = await db.cart.findMany({
    where: {
      lastActiveAt: { lt: sixtyMinsAgo, gt: seventyFiveMinsAgo },
      items: { some: {} },  // has at least one item
    },
    include: {
      user: { select: { email: true, name: true, id: true } },
      items: {
        include: {
          product: { select: { name: true, basePrice: true, slug: true,
                                images: { where: { isPrimary: true }, take: 1 } } },
        },
        take: 3,  // show max 3 items in email
      },
    },
  })

  let emailsSent = 0

  for (const cart of abandonedCarts) {
    if (!cart.user?.email) continue

    // Prevent duplicate emails within 24 hours
    const recentEmail = await db.emailLog.findFirst({
      where: {
        email: cart.user.email,
        type: 'abandoned_cart',
        sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    })

    if (recentEmail) continue

    const html = abandonedCartTemplate(cart.user.name, cart.items as any)

    const sent = await sendEmail({
      to: cart.user.email,
      subject: 'You left something behind 👀',
      html,
      type: 'abandoned_cart',
      userId: cart.userId,
    })

    if (sent) emailsSent++
  }

  return NextResponse.json({ success: true, emailsSent })
}
