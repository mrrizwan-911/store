import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt'

export async function requireAdmin(req: NextRequest): Promise<string | NextResponse> {
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '')
  const cookieToken = req.cookies.get('refreshToken')?.value

  const token = authHeader || cookieToken
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const payload = authHeader ? verifyAccessToken(token) : verifyRefreshToken(token)
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return payload.userId
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
