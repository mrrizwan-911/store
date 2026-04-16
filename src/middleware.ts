import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    try {
      const payload = verifyAccessToken(accessToken)
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    try {
      verifyAccessToken(accessToken)
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*'],
}
