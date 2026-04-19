import { NextRequest, NextResponse } from 'next/server'
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authHeader = req.headers.get('authorization')
  let token = authHeader?.replace('Bearer ', '')

  if (!token) {
    token = req.cookies.get('refreshToken')?.value
  }

  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    try {
      // Simple base64 decode for Edge runtime since jsonwebtoken is Node-only
      // Full verification happens in API routes
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    try {
      // Optimistic check in Proxy
      atob(token.split('.')[1])
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*'],
}
