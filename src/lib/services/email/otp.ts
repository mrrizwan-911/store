import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { otpEmailTemplate } from './templates/otp'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOtpEmail(email: string, name: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: `Your verification code: ${code}`,
    html: otpEmailTemplate(name, code),
  })

  if (error) {
    logger.error('Failed to send OTP email', error, { email })
    throw new Error(`Resend error: ${error.message}`)
  }

  logger.auth('OTP email sent', { email, type: 'otp_verification' })

  await db.emailLog.create({
    data: { email, type: 'otp_verification', status: 'sent' },
  })
}
