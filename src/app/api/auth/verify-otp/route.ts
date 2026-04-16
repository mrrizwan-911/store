import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { otpSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = otpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { userId, code } = parsed.data

    const otp = await db.otpToken.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp || otp.code !== code) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Mark OTP used and user verified in a transaction
    await db.$transaction([
      db.otpToken.update({ where: { id: otp.id }, data: { used: true } }),
      db.user.update({ where: { id: userId }, data: { isVerified: true } }),
    ])

    logger.auth('Email verified', { userId })

    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully' },
    })
  } catch (err) {
    logger.error('[AUTH_VERIFY_OTP]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
