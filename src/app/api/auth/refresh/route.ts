import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 })
    }

    const stored = await db.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 })
    }

    const payload = verifyRefreshToken(refreshToken)

    // Rotate: delete old, create new
    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    await db.$transaction([
      db.refreshToken.delete({ where: { id: stored.id } }),
      db.refreshToken.create({
        data: {
          userId: payload.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    const accessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    logger.auth('Token refreshed', { userId: payload.userId })

    const response = NextResponse.json({ success: true, data: { accessToken } })
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    logger.error('[AUTH_REFRESH]', err)
    return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 })
  }
}
