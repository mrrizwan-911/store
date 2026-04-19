import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'

const adjustmentSchema = z.object({
  points: z.number().int().refine((n) => n !== 0, 'Points must be non-zero'),
  reason: z.string().min(1, 'Reason is required'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authRes = await requireAdmin(req)
    if (authRes instanceof NextResponse) return authRes

    const { userId } = await params
    const body = await req.json()

    const result = adjustmentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { points, reason } = result.data

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { loyalty: true }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const updatedAccount = await db.$transaction(async (tx) => {
      // Create account if not exists
      let account = user.loyalty

      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: {
            userId,
            points: 0,
            totalEarned: 0,
            tier: 'BRONZE'
          }
        })
      }

      // Update loyalty account
      const updated = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          totalEarned: points > 0 ? { increment: points } : undefined
        }
      })

      // Record event
      await tx.loyaltyEvent.create({
        data: {
          accountId: account.id,
          points,
          reason
        }
      })

      return updated
    })

    logger.info('Loyalty points adjusted', { userId, adminId: authRes, points, reason })

    return NextResponse.json({
      success: true,
      data: updatedAccount
    })
  } catch (error: any) {
    logger.error('Failed to adjust loyalty points', {
      message: error.message,
      stack: error.stack,
      error
    })
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
