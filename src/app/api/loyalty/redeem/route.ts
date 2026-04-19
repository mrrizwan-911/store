import { NextRequest, NextResponse } from 'next/server'
import { redeemPoints } from '@/lib/services/loyalty/redeem'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '')
    const cookieToken = req.cookies.get('refreshToken')?.value
    const token = authHeader || cookieToken

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = authHeader ? verifyAccessToken(token) : verifyRefreshToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { points, orderId } = await req.json()

    if (typeof points !== 'number' || !orderId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const result = await redeemPoints(payload.userId as string, points, orderId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, discountAmount: result.discountAmount })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
