import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { loginSchema } from '@/lib/validations/auth'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email first', userId: user.id },
        { status: 403 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(tokenPayload)
    const refreshToken = signRefreshToken(tokenPayload)

    await db.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    logger.auth('User logged in', { userId: user.id, email: user.email, role: user.role })

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    })

    return response
  } catch (err) {
    logger.error('[AUTH_LOGIN]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
