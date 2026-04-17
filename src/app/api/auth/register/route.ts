import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { registerSchema } from '@/lib/validations/auth'
import { sendOtpEmail } from '@/lib/services/email/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, full_name, fullName, email, password } = parsed.data
    const finalName = name || full_name || fullName || 'User'

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: { name: finalName, email, passwordHash, role: 'CUSTOMER' },
    })

    // 6-digit OTP, valid for 10 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.otpToken.create({
      data: { userId: user.id, code, expiresAt },
    })

    await sendOtpEmail(email, finalName, code)

    logger.auth('User registered', { userId: user.id, email })

    return NextResponse.json(
      { success: true, data: { userId: user.id, message: 'OTP sent to email' } },
      { status: 201 }
    )
  } catch (err) {
    logger.error('[AUTH_REGISTER]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
