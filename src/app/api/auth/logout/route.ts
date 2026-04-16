import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value

  if (refreshToken) {
    // Silently delete — already expired tokens won't be found, that's fine
    await db.refreshToken.deleteMany({ where: { token: refreshToken } })
    logger.auth('User logged out, refresh token deleted')
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' })
  return response
}
