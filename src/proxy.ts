import { NextRequest, NextResponse } from 'next/server'
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    try {
      // Simple base64 decode for Edge runtime since jsonwebtoken is Node-only
      // Full verification happens in API routes
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
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
      // Optimistic check in Proxy
      atob(accessToken.split('.')[1])
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*'],
}
