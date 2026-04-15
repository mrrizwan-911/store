# DAY 02 — Auth System (JWT + Google OAuth + OTP)

## Overview

**Goal:** A complete, production-grade authentication system with email/password registration, JWT access/refresh token flow, 6-digit OTP email verification on signup, Google OAuth, and role-based middleware protecting admin routes.

**Deliverables:**
- JWT utility functions (sign, verify — access + refresh)
- Zod validation schemas for register/login/OTP
- POST `/api/auth/register` — create user + send OTP
- POST `/api/auth/login` — verify password + issue tokens
- POST `/api/auth/verify-otp` — verify OTP, mark user verified
- POST `/api/auth/refresh` — rotate refresh token
- POST `/api/auth/logout` — invalidate refresh token
- GET `/api/auth/google` — Google OAuth redirect
- GET `/api/auth/google/callback` — handle OAuth callback
- `src/middleware.ts` — protect `/admin`, `/account`, `/checkout` routes
- OTP email template (Resend)
- Unit tests: JWT sign/verify, validation schemas
- Integration tests: register → OTP → login flow

**Success Criteria:**
- Register endpoint creates user + OtpToken in database
- OTP email arrives in inbox within 10 seconds
- OTP verification marks `isVerified: true`
- Login returns accessToken in body + refreshToken in httpOnly cookie
- Tampered tokens are rejected with 401
- `/admin` routes redirect to `/login` without valid ADMIN token

---

## Prerequisites

- Day 1 complete: Next.js app running, Prisma schema migrated, `db` client available
- `RESEND_API_KEY` filled in `.env.local`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` filled in `.env.local` (min 32 chars each)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` filled (Google Cloud Console project needed)

---

## Setup & Script Tasks

```bash
# No new npm installs needed — all auth deps installed on Day 1
# Verify they're available:
node -e "require('bcryptjs'); require('jsonwebtoken'); console.log('Auth deps OK')"

# Create auth route directories
mkdir -p src/app/api/auth/{register,login,logout,refresh,verify-otp,google,google/callback}

# Create email service directory
mkdir -p src/lib/services/email
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/lib/auth/jwt.ts` | CREATE | Sign/verify access and refresh tokens |
| `src/lib/validations/auth.ts` | CREATE | Zod schemas for register, login, OTP |
| `src/app/api/auth/register/route.ts` | CREATE | User registration + OTP dispatch |
| `src/app/api/auth/login/route.ts` | CREATE | Password check + token issuance |
| `src/app/api/auth/verify-otp/route.ts` | CREATE | OTP validation + user verification |
| `src/app/api/auth/refresh/route.ts` | CREATE | Refresh token rotation |
| `src/app/api/auth/logout/route.ts` | CREATE | Invalidate refresh token |
| `src/app/api/auth/google/route.ts` | CREATE | Google OAuth redirect |
| `src/app/api/auth/google/callback/route.ts` | CREATE | Google OAuth callback handler |
| `src/lib/services/email/otp.ts` | CREATE | Send OTP email via Resend |
| `src/lib/services/email/templates/otp.ts` | CREATE | HTML email template for OTP |
| `src/middleware.ts` | CREATE | Route protection middleware |
| `tests/unit/jwt.test.ts` | CREATE | Unit tests for JWT utilities |
| `tests/unit/auth-validation.test.ts` | CREATE | Unit tests for Zod schemas |
| `tests/integration/auth.test.ts` | CREATE | End-to-end register → verify → login |

---

## Specifications

### `src/lib/auth/jwt.ts`

**Purpose:** Encapsulate all JWT operations behind typed functions. Never import `jsonwebtoken` directly in route handlers.

**Token Payload Shape:**
```typescript
interface TokenPayload {
  userId: string
  email: string
  role: string  // Role enum value as string
}
```

**Access Token:**
- Signs with `JWT_ACCESS_SECRET`
- Expires in `15m`
- Used in `Authorization: Bearer <token>` header

**Refresh Token:**
- Signs with `JWT_REFRESH_SECRET`
- Expires in `7d`
- Stored in database (`RefreshToken` table) and sent as httpOnly cookie
- Rotated on every use (old token deleted, new token issued)

**Functions:**
| Function | Input | Output | Throws |
|----------|-------|--------|--------|
| `signAccessToken(payload)` | TokenPayload | string | never |
| `signRefreshToken(payload)` | TokenPayload | string | never |
| `verifyAccessToken(token)` | string | TokenPayload | JsonWebTokenError |
| `verifyRefreshToken(token)` | string | TokenPayload | JsonWebTokenError |

**Error handling:** Let JWT errors bubble up — callers wrap in try/catch.

---

### `src/lib/validations/auth.ts`

**Register schema:**
- `name`: string, min 2, max 50
- `email`: valid email format
- `password`: min 8 chars, must contain uppercase, number, special char
- Password strength regex patterns with human-readable error messages

**Login schema:**
- `email`: valid email
- `password`: min 1 (don't check strength — just presence)

**OTP schema:**
- `userId`: string (cuid)
- `code`: exactly 6 characters, numeric only

**Export both schema and inferred types:**
```typescript
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OtpInput = z.infer<typeof otpSchema>
```

---

### `src/app/api/auth/register/route.ts`

**Method:** POST

**Request body:**
```json
{ "name": "Ahmed Khan", "email": "ahmed@example.com", "password": "Secret@123" }
```

**Processing steps:**
1. Validate body with `registerSchema.safeParse(body)` → 400 on failure
2. Check for existing user with same email → 409 if found
3. Hash password with `bcrypt.hash(password, 12)`
4. Create `User` with `role: 'CUSTOMER'`, `isVerified: false`
5. Generate 6-digit OTP: `Math.floor(100000 + Math.random() * 900000).toString()`
6. Create `OtpToken` with `expiresAt: now + 10 minutes`
7. Send OTP email via `sendOtpEmail(email, name, code)`
8. Return 201 with `{ success: true, data: { userId, message: 'OTP sent to email' } }`

**Error responses:**
| Condition | Status | Error message |
|-----------|--------|---------------|
| Invalid body | 400 | First Zod error message |
| Email exists | 409 | "Email already registered" |
| Server error | 500 | "Internal server error" |

**Security:** Never return the OTP in the response. Never reveal whether email exists (edge: keep generic for production — for now 409 is acceptable for UX).

---

### `src/app/api/auth/verify-otp/route.ts`

**Method:** POST

**Request body:**
```json
{ "userId": "clxxx...", "code": "482910" }
```

**Processing steps:**
1. Validate with `otpSchema`
2. Find latest unused, non-expired OTP for userId
3. If not found or expired → 400 "Invalid or expired OTP"
4. If `otp.code !== code` → 400 "Invalid or expired OTP" (same message — don't reveal which)
5. Mark OTP as `used: true`
6. Mark User as `isVerified: true`
7. Return 200 with success message

**Edge cases:**
- User submits same OTP twice → second attempt fails ("already used")
- User requests new OTP before old expires → create new OtpToken, old one still valid until expiry (race condition acceptable)

---

### `src/app/api/auth/login/route.ts`

**Method:** POST

**Request body:**
```json
{ "email": "ahmed@example.com", "password": "Secret@123" }
```

**Processing steps:**
1. Validate with `loginSchema`
2. Find user by email → 401 "Invalid credentials" if not found (don't reveal "email not found")
3. Check `user.passwordHash` exists → 401 if null (Google OAuth user trying password login)
4. Check `user.isVerified` → 403 "Please verify your email first"
5. `bcrypt.compare(password, user.passwordHash)` → 401 on mismatch
6. Generate both tokens
7. Store refresh token in `RefreshToken` table with 7-day expiry
8. Set `refreshToken` cookie: httpOnly, secure in production, sameSite: lax, path: `/`
9. Return 200 with access token + user profile (no passwordHash)

**Response shape:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "...", "name": "Ahmed Khan", "email": "...", "role": "CUSTOMER" }
  }
}
```

---

### `src/app/api/auth/refresh/route.ts`

**Method:** POST

**Processing steps:**
1. Read `refreshToken` from cookies
2. If no cookie → 401
3. Look up token in `RefreshToken` table → 401 if not found (rotated/invalidated)
4. Check `expiresAt > now` → 401 if expired
5. Verify token signature with `verifyRefreshToken`
6. Delete old token from database (rotation — prevents reuse)
7. Create new refresh token in database
8. Set new cookie
9. Return new access token

---

### `src/app/api/auth/logout/route.ts`

**Method:** POST

**Processing steps:**
1. Read `refreshToken` from cookies
2. Delete matching `RefreshToken` from database (if exists — silent fail is fine)
3. Clear the cookie: set same cookie name with maxAge: 0
4. Return 200

---

### `src/lib/services/email/otp.ts`

**Purpose:** Send OTP verification emails via Resend.

**Function:** `sendOtpEmail(email: string, name: string, code: string): Promise<void>`

**Behavior:**
- Calls Resend API with the OTP HTML template
- From: `noreply@yourdomain.com` (update to actual domain)
- Subject: `Your verification code — {code}`
- Logs email via `EmailLog` table with type `otp_verification`
- Throws on Resend API error (caller handles retry)

---

### `src/lib/services/email/templates/otp.ts`

**Function:** `otpEmailTemplate(name: string, code: string): string`

Returns HTML string. Matches the dark luxury theme from SCREENS.md:
- Black background `#0A0A0A`
- Gold accent `#E8D5B0`
- Large centered OTP code in monospace
- Expiry notice: "This code expires in 10 minutes"
- No images (email client compatibility)

---

### `src/middleware.ts`

**Purpose:** Protect routes that require authentication or admin role.

**Protected route groups:**
| Pattern | Requirement |
|---------|-------------|
| `/admin/*` | Valid access token + role === 'ADMIN' |
| `/account/*` | Valid access token (any role) |
| `/checkout/*` | Valid access token (any role) |

**Flow:**
1. Read `Authorization` header → extract Bearer token
2. For admin routes: verify token, check role → redirect to `/login` or `/` on failure
3. For account/checkout: verify token → redirect to `/login` on failure
4. Pass through all other routes

**Important:** Middleware runs at edge — no database access. Only JWT verification (pure crypto, no I/O).

**Matcher config:**
```typescript
export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*'],
}
```

---

### Google OAuth (`/api/auth/google` + `/api/auth/google/callback`)

**Flow:**
1. `/api/auth/google` → redirect to Google OAuth consent screen
2. Google redirects to `/api/auth/google/callback?code=xxx`
3. Exchange code for Google tokens → fetch user profile (email, name, googleId)
4. `upsert` User: if email exists, update `googleId`; if new, create with `isVerified: true` (Google already verified email)
5. Issue access + refresh tokens same as login
6. Redirect to `/` with accessToken in cookie or localStorage

**Required Google scopes:** `openid email profile`

**Build Google Auth URL manually** (no next-auth dependency):
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id={GOOGLE_CLIENT_ID}
  &redirect_uri={APP_URL}/api/auth/google/callback
  &response_type=code
  &scope=openid+email+profile
  &access_type=offline
```

---

## Full Code Templates

### `src/lib/auth/jwt.ts`

```typescript
import jwt from 'jsonwebtoken'

interface TokenPayload {
  userId: string
  email: string
  role: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' })
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload
}
```

### `src/lib/validations/auth.ts`

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const otpSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OtpInput = z.infer<typeof otpSchema>
```

### `src/app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { registerSchema } from '@/lib/validations/auth'
import { sendOtpEmail } from '@/lib/services/email/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: { name, email, passwordHash, role: 'CUSTOMER' },
    })

    // 6-digit OTP, valid for 10 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.otpToken.create({
      data: { userId: user.id, code, expiresAt },
    })

    await sendOtpEmail(email, name, code)

    return NextResponse.json(
      { success: true, data: { userId: user.id, message: 'OTP sent to email' } },
      { status: 201 }
    )
  } catch (err) {
    console.error('[REGISTER]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### `src/app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
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
        { success: false, error: 'Please verify your email first' },
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

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[LOGIN]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### `src/app/api/auth/verify-otp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { otpSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = otpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
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

    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully' },
    })
  } catch (err) {
    console.error('[VERIFY_OTP]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### `src/app/api/auth/refresh/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 })
    }

    const stored = await db.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 })
    }

    const payload = verifyRefreshToken(refreshToken)

    // Rotate: delete old, create new
    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    await db.$transaction([
      db.refreshToken.delete({ where: { id: stored.id } }),
      db.refreshToken.create({
        data: {
          userId: payload.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    const accessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    const response = NextResponse.json({ success: true, data: { accessToken } })
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[REFRESH]', err)
    return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 })
  }
}
```

### `src/app/api/auth/logout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value

  if (refreshToken) {
    // Silently delete — already expired tokens won't be found, that's fine
    await db.refreshToken.deleteMany({ where: { token: refreshToken } })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' })
  return response
}
```

### `src/lib/services/email/otp.ts`

```typescript
import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import { otpEmailTemplate } from './templates/otp'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOtpEmail(email: string, name: string, code: string): Promise<void> {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: `Your verification code: ${code}`,
    html: otpEmailTemplate(name, code),
  })

  await db.emailLog.create({
    data: { email, type: 'otp_verification', status: 'sent' },
  })
}
```

### `src/lib/services/email/templates/otp.ts`

```typescript
export function otpEmailTemplate(name: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #222222;max-width:480px;width:100%;">
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#E8D5B0;font-size:24px;margin:0 0 8px;font-weight:600;">
                Verify Your Email
              </h1>
              <p style="color:#888888;font-size:14px;margin:0 0 32px;">
                Hi ${name}, enter this code to verify your account.
              </p>
              <div style="background:#0A0A0A;border:1px solid #222222;padding:24px;text-align:center;margin:0 0 24px;">
                <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#E8D5B0;font-family:monospace;">
                  ${code}
                </span>
              </div>
              <p style="color:#888888;font-size:12px;margin:0;">
                This code expires in <strong style="color:#F5F5F5;">10 minutes</strong>.<br/>
                If you didn't create an account, ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
```

### `src/middleware.ts`

```typescript
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
```

---

## Tests Required

### `tests/unit/jwt.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt'

// Set env vars for test
process.env.JWT_ACCESS_SECRET = 'test-access-secret-must-be-32-chars-long!'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-must-be-32-chars-long!'

describe('JWT utilities', () => {
  const payload = { userId: 'user_123', email: 'test@test.com', role: 'CUSTOMER' }

  it('signs and verifies access token', () => {
    const token = signAccessToken(payload)
    const decoded = verifyAccessToken(token)
    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('signs and verifies refresh token', () => {
    const token = signRefreshToken(payload)
    const decoded = verifyRefreshToken(token)
    expect(decoded.userId).toBe(payload.userId)
  })

  it('throws on tampered access token', () => {
    const token = signAccessToken(payload)
    expect(() => verifyAccessToken(token + 'tampered')).toThrow()
  })

  it('throws on tampered refresh token', () => {
    const token = signRefreshToken(payload)
    expect(() => verifyRefreshToken(token + 'x')).toThrow()
  })

  it('access token and refresh token are different', () => {
    const access = signAccessToken(payload)
    const refresh = signRefreshToken(payload)
    expect(access).not.toBe(refresh)
  })
})
```

### `tests/unit/auth-validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, otpSchema } from '@/lib/validations/auth'

describe('Register schema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      password: 'Secret@123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = registerSchema.safeParse({ name: 'A', email: 'a@b.com', password: 'Secret@123' })
    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({ name: 'Ahmed', email: 'a@b.com', password: 'secret@123' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toContain('uppercase')
  })

  it('rejects password without special char', () => {
    const result = registerSchema.safeParse({ name: 'Ahmed', email: 'a@b.com', password: 'Secret123' })
    expect(result.success).toBe(false)
  })
})

describe('OTP schema', () => {
  it('accepts valid 6-digit code', () => {
    expect(otpSchema.safeParse({ userId: 'abc', code: '123456' }).success).toBe(true)
  })

  it('rejects non-numeric OTP', () => {
    expect(otpSchema.safeParse({ userId: 'abc', code: '12345a' }).success).toBe(false)
  })

  it('rejects 5-digit OTP', () => {
    expect(otpSchema.safeParse({ userId: 'abc', code: '12345' }).success).toBe(false)
  })
})
```

### Run Tests

```bash
npx vitest run tests/unit/jwt.test.ts tests/unit/auth-validation.test.ts
```

---

## Acceptance Criteria

- [ ] `POST /api/auth/register` → 201 with userId, OTP email arrives in inbox
- [ ] `POST /api/auth/verify-otp` → 200, user.isVerified becomes true in DB
- [ ] `POST /api/auth/login` → 200 with accessToken, refreshToken cookie set
- [ ] `POST /api/auth/login` with wrong password → 401
- [ ] `POST /api/auth/login` with unverified email → 403
- [ ] `POST /api/auth/refresh` → 200 with new accessToken, new cookie set
- [ ] `POST /api/auth/logout` → 200, cookie cleared, token deleted from DB
- [ ] `GET /admin/` without token → redirects to `/login`
- [ ] `GET /admin/` with CUSTOMER token → redirects to `/`
- [ ] `GET /admin/` with ADMIN token → passes through
- [ ] All unit tests pass: `npx vitest run`
- [ ] OTP expired after 10 minutes (manual test or time manipulation)

---

## Progress Tracker Updates

Mark these items in `CLAUDE.md`:
```
[2026-04-16] JWT auth system (register, login, logout, refresh token) — done
[2026-04-16] Email OTP verification on signup — done
[2026-04-16] Role-based middleware (Admin / Customer / Guest) — done
[2026-04-16] Protected routes — done
```
