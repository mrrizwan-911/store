# DAY 13 — Security Hardening

## Overview

**Goal:** Harden the application against OWASP Top 10 vulnerabilities — rate limiting on all sensitive endpoints, security headers (CSP, HSTS, X-Frame-Options), brute force protection, input sanitization, CSRF awareness, and a pre-production security audit checklist.

**Deliverables:**
- Upstash rate limiting on auth, checkout, AI, and public API endpoints
- `next.config.js` with full security headers
- Account lockout after 5 failed login attempts
- Input sanitization for HTML content (review bodies, gift messages)
- `src/lib/utils/rateLimit.ts` — Upstash-backed rate limiters
- Security audit checklist (manual review guide)
- OWASP Top 10 review notes for this project

**Success Criteria:**
- `POST /api/auth/login` rate-limited to 5 attempts per 15 minutes per IP
- `POST /api/checkout/create-order` rate-limited to 10 per minute per user
- Security headers score A+ on securityheaders.com
- Review body with `<script>` tags is sanitized before storage
- Brute force: account locked after 5 consecutive failed logins
- No raw SQL string interpolation anywhere in codebase

---

## Prerequisites

- Day 1: `@upstash/ratelimit @upstash/redis` installed
- All API routes from Days 1-12 in place
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`

---

## Setup & Script Tasks

```bash
# Verify Upstash packages are installed
node -e "require('@upstash/ratelimit'); console.log('Upstash OK')"

# Install HTML sanitizer
npm install dompurify
npm install -D @types/dompurify

# For server-side sanitization (DOMPurify needs a DOM — use isomorphic-dompurify or sanitize-html)
npm install sanitize-html
npm install -D @types/sanitize-html

# Audit current dependencies for known vulnerabilities
npm audit

# List all packages with high/critical issues
npm audit --audit-level=high
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/lib/utils/rateLimit.ts` | CREATE | Upstash rate limiters |
| `src/lib/utils/sanitize.ts` | CREATE | HTML input sanitizer |
| `src/lib/utils/accountLock.ts` | CREATE | Track and check failed login attempts |
| `next.config.js` | MODIFY | Add security headers |
| `src/app/api/auth/login/route.ts` | MODIFY | Add rate limiting + account lockout |
| `src/app/api/auth/register/route.ts` | MODIFY | Add rate limiting |
| `src/app/api/checkout/create-order/route.ts` | MODIFY | Add rate limiting |
| `src/app/api/ai/chat/route.ts` | MODIFY | Add strict AI rate limiting |
| `src/app/api/products/[slug]/reviews/route.ts` | MODIFY | Sanitize review body |
| `SECURITY.md` | CREATE | Security audit checklist |

---

## Specifications

### `src/lib/utils/rateLimit.ts`

**Upstash rate limiters with different configs per endpoint type:**

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export const rateLimiters = {
  // Auth endpoints — strictest
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '15 m'),
    prefix: 'rl:auth',
    analytics: true,
  }),

  // Checkout — per user, not just IP
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, '1 m'),
    prefix: 'rl:checkout',
    analytics: true,
  }),

  // AI endpoints — expensive, limit hard
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:ai',
    analytics: true,
  }),

  // General public API — generous
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:api',
    analytics: true,
  }),

  // OTP requests — prevent OTP brute force
  otp: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '10 m'),
    prefix: 'rl:otp',
    analytics: true,
  }),
}

/**
 * Checks rate limit and returns a NextResponse if limit exceeded, null if OK.
 * Caller should: const rateLimitErr = await checkRateLimit(...)
 *               if (rateLimitErr) return rateLimitErr
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string  // IP address or userId
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}

/**
 * Gets client IP from Next.js request, with fallback.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  )
}
```

---

### Account Lockout (`src/lib/utils/accountLock.ts`)

**Strategy:** Track failed login attempts per email in Redis. Lock after 5 failures for 15 minutes.

```typescript
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 15 * 60  // 15 minutes

export async function recordFailedLogin(email: string): Promise<number> {
  const key = `lockout:${email}`
  const attempts = await redis.incr(key)
  if (attempts === 1) {
    // Set expiry on first failure
    await redis.expire(key, LOCKOUT_SECONDS)
  }
  return attempts
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const key = `lockout:${email}`
  const attempts = await redis.get<number>(key)
  return (attempts ?? 0) >= MAX_ATTEMPTS
}

export async function clearFailedLogins(email: string): Promise<void> {
  await redis.del(`lockout:${email}`)
}
```

**Integration in login route:**
```typescript
// Before password check:
if (await isAccountLocked(email)) {
  return NextResponse.json(
    { success: false, error: 'Account temporarily locked. Try again in 15 minutes.' },
    { status: 429 }
  )
}

// After failed password check:
const attempts = await recordFailedLogin(email)
// return 401 as usual

// After successful login:
await clearFailedLogins(email)
```

---

### `src/lib/utils/sanitize.ts`

**Purpose:** Sanitize user-provided content before storing in DB or rendering.

```typescript
import sanitizeHtml from 'sanitize-html'

// Strip all HTML — for plain text fields (review body, gift messages, notes)
export function stripHtml(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim()
}

// Allow basic formatting only — for fields that may render as HTML (none currently, but future-safe)
export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
  }).trim()
}
```

**Usage in review route:**
```typescript
// Before creating review:
const sanitizedBody = stripHtml(parsed.data.body)
const sanitizedTitle = parsed.data.title ? stripHtml(parsed.data.title) : undefined
```

---

### `next.config.js` — Security Headers

```javascript
const securityHeaders = [
  // Prevent DNS prefetch data leaking
  { key: 'X-DNS-Prefetch-Control', value: 'on' },

  // HSTS — 2 year max-age, include subdomains, preload
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

  // Prevent MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Permissions policy — disable dangerous browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },

  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co",
      "connect-src 'self' https://api.anthropic.com https://api.openai.com https://api.resend.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://sandbox.jazzcash.com.pk https://easypay.easypaisa.com.pk",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  // Disable source maps in production (prevents source code exposure)
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
```

---

### OWASP Top 10 Coverage Review

| # | Vulnerability | Mitigation in This Project |
|---|--------------|---------------------------|
| A01 | Broken Access Control | Admin middleware checks JWT + role. User can only access own cart/orders. |
| A02 | Cryptographic Failures | bcrypt 12 rounds for passwords. JWT with strong secrets (32+ chars). No sensitive data in logs. |
| A03 | Injection | Prisma ORM with parameterized queries only. Zod validates all inputs before DB. |
| A04 | Insecure Design | Price validation server-side (never trust client). Rate limiting on all sensitive endpoints. |
| A05 | Security Misconfiguration | Security headers via `next.config.js`. No debug info in production errors. |
| A06 | Vulnerable Components | `npm audit` before deploy. Keep dependencies updated. |
| A07 | Auth Failures | Short-lived access tokens (15m). Refresh token rotation. Account lockout after 5 failures. |
| A08 | Data Integrity Failures | JazzCash/EasyPaisa HMAC verification. Stripe webhook signature check. |
| A09 | Logging Failures | Never log passwords, tokens, card numbers. EmailLog + audit trails. |
| A10 | SSRF | No user-controlled URLs used in server-side fetches. Cloudinary upload is file-only. |

---

### `SECURITY.md` — Security Audit Checklist

```markdown
# Security Audit Checklist

## Before Launch

### Authentication
- [ ] JWT_ACCESS_SECRET is 32+ random characters (run: `openssl rand -base64 32`)
- [ ] JWT_REFRESH_SECRET is different from ACCESS_SECRET
- [ ] Admin default password changed from Admin@123
- [ ] Google OAuth redirect URIs are correct for production domain

### API Security
- [ ] All admin routes return 403 for non-admin users
- [ ] Rate limiting is active (test: send 6 login attempts, verify 429)
- [ ] Account lockout works after 5 failed logins
- [ ] Cron endpoints return 401 without CRON_SECRET header

### Payment Security
- [ ] JazzCash: callback validates pp_SecureHash
- [ ] JazzCash: callback validates pp_Amount matches order total
- [ ] Stripe: webhook validates Stripe-Signature header
- [ ] No payment credentials in client-side code
- [ ] JAZZCASH_* env vars are NOT prefixed with NEXT_PUBLIC_

### Data Security
- [ ] No passwords/tokens appear in console.log statements
- [ ] Review bodies are sanitized (test: submit <script>alert(1)</script>)
- [ ] Gift messages are sanitized
- [ ] User can only see their own orders (/account/orders)
- [ ] User cannot access another user's cart

### Infrastructure
- [ ] .env.local is in .gitignore and NOT committed
- [ ] Supabase RLS (Row Level Security) enabled as second layer
- [ ] Cloudinary upload preset is restricted to server-side only
- [ ] HTTPS enforced in production (Vercel handles this)

### Headers (verify at securityheaders.com)
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security present
- [ ] Content-Security-Policy is configured

### Dependencies
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] All packages are recent versions (no EOL packages)
```

---

## Tests Required

### `tests/unit/sanitize.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { stripHtml, sanitizeRichText } from '@/lib/utils/sanitize'

describe('HTML sanitizer', () => {
  it('strips script tags', () => {
    expect(stripHtml('<script>alert(1)</script>Looks great!')).toBe('Looks great!')
  })

  it('strips all HTML tags from plain text', () => {
    expect(stripHtml('<b>Bold</b> and <i>italic</i> text')).toBe('Bold and italic text')
  })

  it('preserves the content text', () => {
    expect(stripHtml('Amazing quality, true to size!')).toBe('Amazing quality, true to size!')
  })

  it('handles empty input', () => {
    expect(stripHtml('')).toBe('')
  })

  it('strips XSS attempts', () => {
    expect(stripHtml('<img src=x onerror=alert(1)>')).toBe('')
    expect(stripHtml('"><script>document.cookie</script>')).not.toContain('<script>')
  })
})
```

### Rate Limit Integration Test

```typescript
// tests/integration/rateLimit.test.ts
// Note: this requires a live Upstash Redis connection
// Only run in CI with real credentials — skip locally

import { describe, it, expect } from 'vitest'

describe.skip('Rate limiting (requires Upstash)', () => {
  it('blocks after 5 auth attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.168.1.1' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      })
    }
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.168.1.1' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    })
    expect(response.status).toBe(429)
  })
})
```

---

## Acceptance Criteria

- [ ] `npm audit --audit-level=high` shows 0 high/critical vulnerabilities
- [ ] Login rate limit: 6th attempt from same IP within 15 min → 429
- [ ] Account lockout: 5 wrong passwords for same email → "Account temporarily locked"
- [ ] Successful login clears lockout counter
- [ ] Review body with `<script>alert(1)</script>` → stored as `alert(1)` (tags stripped)
- [ ] `GET /api/admin/revenue` without token → 401 (not 500)
- [ ] `GET /api/admin/revenue` with customer token → 403
- [ ] Security headers visible in browser DevTools (Network → response headers)
- [ ] `X-Frame-Options: SAMEORIGIN` present in response
- [ ] CSP header is present (look for `Content-Security-Policy`)
- [ ] All unit tests pass

---

## Progress Tracker Updates

```
[2026-04-27] Rate limiting on auth, checkout, and API endpoints — done
[2026-04-27] Brute force protection (account lockout) — done
[2026-04-27] XSS protection (input sanitization, CSP headers) — done
[2026-04-27] Security headers (HSTS, X-Frame-Options, Referrer-Policy) — done
[2026-04-27] Dependency vulnerability scan (npm audit / Snyk) — done
[2026-04-27] OWASP Top 10 audit and remediation — done
```
