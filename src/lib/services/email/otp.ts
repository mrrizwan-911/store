import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { otpEmailTemplate } from './templates/otp'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendOtpEmail(email: string, name: string, code: string): Promise<void> {
  if (!resend) {
    logger.warn('RESEND_API_KEY is missing. Skipping email send in development.', { email, code })
    // In dev/test without API key, we still want the flow to continue
    return
  }

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
