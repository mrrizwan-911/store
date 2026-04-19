import { db } from '@/lib/db/client'

export async function redeemPoints(userId: string, points: number, orderId: string): Promise<{ success: boolean; discountAmount?: number; error?: string }> {
  if (points <= 0 || points % 100 !== 0) {
    return { success: false, error: 'Points must be a multiple of 100' }
  }

  if (points > 500) {
    return { success: false, error: 'Maximum 500 points can be redeemed per order' }
  }

  const account = await db.loyaltyAccount.findUnique({ where: { userId } })

  if (!account || account.points < points) {
    return { success: false, error: 'Insufficient points' }
  }

  // Deduct points
  await db.loyaltyAccount.update({
    where: { userId },
    data: { points: { decrement: points } }
  })

  // Log redemption
  await db.loyaltyEvent.create({
    data: {
      accountId: account.id,
      points: -points,
      reason: `Redeemed at checkout for order #${orderId}`,
    }
  })

  // 1 point = 1 PKR
  return { success: true, discountAmount: points }
}
