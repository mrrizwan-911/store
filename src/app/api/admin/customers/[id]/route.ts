import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const user = await db.user.findUnique({
    where: { id: (await context.params).id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          payment: { select: { method: true, status: true } },
          _count: { select: { items: true } }
        }
      },
      loyalty: true
    }
  })

  if (!user) {
    return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
  }

  const ltv = user.orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.total), 0)

  return NextResponse.json({
    success: true,
    data: {
      ...user,
      ltv
    }
  })
}
