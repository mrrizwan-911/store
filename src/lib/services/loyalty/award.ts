import { db } from '@/lib/db/client'
import { LoyaltyTier } from '@prisma/client'

const POINTS_PER_PKR = 0.01  // PKR 100 = 1 point

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
}

export function computeTier(totalEarned: number): LoyaltyTier {
  if (totalEarned >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM'
  if (totalEarned >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (totalEarned >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  return 'BRONZE'
}

export async function awardOrderPoints(
  userId: string,
  orderTotal: number,
  orderId: string
): Promise<number> {
  const pointsEarned = Math.floor(orderTotal * POINTS_PER_PKR)
  if (pointsEarned === 0) return 0

  // Upsert loyalty account — creates if first time earning
  const account = await db.loyaltyAccount.upsert({
    where: { userId },
    update: {
      points: { increment: pointsEarned },
      totalEarned: { increment: pointsEarned },
    },
    create: {
      userId,
      points: pointsEarned,
      totalEarned: pointsEarned,
    },
  })

  const newTotalEarned = account.totalEarned  // already incremented by upsert
  const newTier = computeTier(newTotalEarned)

  // Update tier if it changed
  if (newTier !== account.tier) {
    await db.loyaltyAccount.update({
      where: { userId },
      data: { tier: newTier },
    })
  }

  await db.loyaltyEvent.create({
    data: {
      accountId: account.id,
      points: pointsEarned,
      reason: `Order #${orderId}`,
    },
  })

  return pointsEarned
}
