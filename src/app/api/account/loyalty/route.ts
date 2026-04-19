import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt'
import { LoyaltyTier } from '@prisma/client'

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '')
    const cookieToken = req.cookies.get('refreshToken')?.value
    const token = authHeader || cookieToken

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = authHeader ? verifyAccessToken(token) : verifyRefreshToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = payload.userId as string

    const account = await db.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!account) {
      // Return zero-state if account doesn't exist yet
      return NextResponse.json({
        success: true,
        data: {
          points: 0,
          tier: 'BRONZE',
          totalEarned: 0,
          nextTier: 'SILVER',
          pointsToNextTier: 500,
          progressPct: 0,
          history: []
        }
      })
    }

    let nextTier = 'PLATINUM'
    let pointsToNextTier = 0
    let progressPct = 100

    if (account.tier === 'BRONZE') {
      nextTier = 'SILVER'
      pointsToNextTier = TIER_THRESHOLDS.SILVER - account.totalEarned
      progressPct = (account.totalEarned / TIER_THRESHOLDS.SILVER) * 100
    } else if (account.tier === 'SILVER') {
      nextTier = 'GOLD'
      pointsToNextTier = TIER_THRESHOLDS.GOLD - account.totalEarned
      const tierRange = TIER_THRESHOLDS.GOLD - TIER_THRESHOLDS.SILVER
      progressPct = ((account.totalEarned - TIER_THRESHOLDS.SILVER) / tierRange) * 100
    } else if (account.tier === 'GOLD') {
      nextTier = 'PLATINUM'
      pointsToNextTier = TIER_THRESHOLDS.PLATINUM - account.totalEarned
      const tierRange = TIER_THRESHOLDS.PLATINUM - TIER_THRESHOLDS.GOLD
      progressPct = ((account.totalEarned - TIER_THRESHOLDS.GOLD) / tierRange) * 100
    }

    // Clamp progress
    progressPct = Math.max(0, Math.min(100, progressPct))

    return NextResponse.json({
      success: true,
      data: {
        points: account.points,
        tier: account.tier,
        totalEarned: account.totalEarned,
        nextTier,
        pointsToNextTier: Math.max(0, pointsToNextTier),
        progressPct,
        history: account.history
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
