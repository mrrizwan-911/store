# DAY 14 — QA + Performance

## Overview

**Goal:** Full quality assurance pass — integration tests for the complete checkout flow, Lighthouse performance audit targeting 90+ scores, image optimization audit, query performance review, E2E test setup with Playwright for critical paths, and Sentry error tracking setup.

**Deliverables:**
- Integration test: full checkout flow (browse → add to cart → checkout → payment)
- Integration test: auth flow (register → OTP → login → refresh → logout)
- Integration test: loyalty flow (order → points → redeem → checkout)
- E2E test scaffolding with Playwright
- Lighthouse audit results documented
- Sentry error tracking initialized
- Performance fixes: image optimization, query index review
- Bulk CSV import for products (admin)
- Google Analytics 4 + Meta Pixel integration

**Success Criteria:**
- All integration tests pass with real database
- Lighthouse scores: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
- All pages load primary content in < 2 seconds
- No N+1 queries in any API route (verified via Prisma query log)
- Sentry captures errors in both client and server
- CSV import handles 100 products without timeout

---

## Prerequisites

- All Days 1-13 complete
- `SENTRY_DSN` available (free Sentry account)
- `NEXT_PUBLIC_GA4_ID` available (Google Analytics property)
- Test environment: copy of production database or separate test Supabase project

---

## Setup & Script Tasks

```bash
# Playwright for E2E tests
npm install -D @playwright/test
npx playwright install chromium

# Sentry
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs --saas

# CSV parsing
npm install papaparse
npm install -D @types/papaparse

# Verify Lighthouse CLI (for CI)
npm install -g lighthouse

# Create test directories
mkdir -p tests/e2e
mkdir -p tests/integration

# Run all unit tests first
npx vitest run

# Run Lighthouse on localhost (after starting dev server)
# lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `tests/integration/auth.test.ts` | CREATE | Register → verify → login → refresh → logout |
| `tests/integration/checkout.test.ts` | CREATE | Full order creation + price validation |
| `tests/integration/loyalty.test.ts` | UPDATE | Already created Day 11 — extend |
| `tests/e2e/homepage.spec.ts` | CREATE | Playwright: homepage loads, navbar works |
| `tests/e2e/cart.spec.ts` | CREATE | Playwright: add to cart, view cart |
| `tests/e2e/auth.spec.ts` | CREATE | Playwright: register form, login form |
| `playwright.config.ts` | CREATE | Playwright configuration |
| `sentry.client.config.ts` | CREATE | Client-side Sentry |
| `sentry.server.config.ts` | CREATE | Server-side Sentry |
| `sentry.edge.config.ts` | CREATE | Edge runtime Sentry |
| `src/app/api/admin/products/import/route.ts` | CREATE | CSV bulk import |
| `src/components/admin/CsvImporter.tsx` | CREATE | CSV upload UI |
| `vitest.config.ts` | MODIFY | Add integration test config |
| `src/app/sitemap.ts` | CREATE | Dynamic sitemap for SEO |
| `src/app/robots.ts` | CREATE | robots.txt for SEO |

---

## Specifications

### Complete Integration Test: Checkout Flow

**File: `tests/integration/checkout.test.ts`**

This test exercises the full flow against a real database. Uses a test Supabase project (or same DB with cleanup).

**Test sequence:**
1. Create test user + verify OTP
2. Login → get access token
3. Add product to cart (via API)
4. Apply coupon code
5. Create order with COD payment
6. Verify order created with correct validated prices
7. Verify flash sale price applied (if active sale exists for product)
8. Update order to DELIVERED (triggers loyalty)
9. Verify loyalty points awarded
10. Cleanup all test data

**Flash sale price test (important):**
```typescript
it('applies flash sale discount server-side', async () => {
  // Create a flash sale for the test product
  await db.flashSale.create({
    data: {
      name: 'Test Sale',
      discountPct: 20,
      startTime: new Date(Date.now() - 1000),  // started 1 second ago
      endTime: new Date(Date.now() + 60 * 60 * 1000),  // ends in 1 hour
      isActive: true,
      productIds: [testProductId],
    },
  })

  // Create order — server should apply 20% discount
  const validatedPrice = await getValidatedPrice(testProductId)
  const expectedPrice = 4500 * 0.8  // 20% off

  expect(validatedPrice).toBeCloseTo(expectedPrice, 1)
})
```

---

### Playwright E2E Tests

**`playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**`tests/e2e/homepage.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test'

test('homepage loads and navbar is visible', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Store/)
  await expect(page.locator('header')).toBeVisible()
  await expect(page.locator('text=STORE')).toBeVisible()
})

test('hovering nav item shows dropdown', async ({ page }) => {
  await page.goto('/')
  await page.hover('text=Clothes')
  await expect(page.locator('text=Tops')).toBeVisible()
  await expect(page.locator('text=Bottoms')).toBeVisible()
})

test('cart icon shows count after adding item', async ({ page }) => {
  await page.goto('/')
  // Navigate to a product page (assumes seed data has a product)
  await page.goto('/products')
  // Click first product
  const firstProduct = page.locator('[data-testid="product-card"]').first()
  await firstProduct.click()
  // Click Add to Cart
  await page.click('button:has-text("Add to Cart")')
  // Check cart count badge
  await expect(page.locator('[aria-label*="Cart with 1"]')).toBeVisible()
})
```

---

### Performance Optimization Checklist

**Images:**
- [ ] All `<img>` tags replaced with Next.js `<Image>` component
- [ ] Cloudinary URLs use proper format transformations: `?f=auto&q=auto&w=800`
- [ ] Product card images: `sizes="(max-width: 768px) 50vw, 25vw"`
- [ ] Hero banner: `priority` prop set (LCP element)
- [ ] No images above 200KB for product cards

**Queries:**
- [ ] PLP query: includes only primary image (not all images)
- [ ] PDP query: all images included (single product — acceptable)
- [ ] Admin analytics: parallel Promise.all for all 5 KPI queries
- [ ] No `.findMany` without `take` on unbounded tables (orders, reviews)
- [ ] Search queries use indexed fields only (slug, email, name)

**API Response times:**
- [ ] PLP API: < 200ms for first page (cached or fast query)
- [ ] PDP API: < 300ms (includes reviews)
- [ ] Analytics API: < 500ms (complex aggregations)

**Enable Next.js caching:**
```typescript
// Add to products GET handler — cache for 60 seconds
export const revalidate = 60

// For product detail pages — cache for 30 minutes
export const revalidate = 1800
```

---

### Sentry Configuration

**`sentry.client.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

**`sentry.server.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
})
```

**Add to `next.config.js`:**
```javascript
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'your-org',
  project: 'clothes-store',
})
```

---

### SEO: Sitemap + Robots

**`src/app/sitemap.ts`:**
```typescript
import { MetadataRoute } from 'next'
import { db } from '@/lib/db/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourstore.com'

  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  })

  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  })

  const staticRoutes = ['/', '/products', '/lookbook', '/quotation', '/track'].map(route => ({
    url: `${appUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.8,
  }))

  const productRoutes = products.map(p => ({
    url: `${appUrl}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  const categoryRoutes = categories.map(c => ({
    url: `${appUrl}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}
```

**`src/app/robots.ts`:**
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourstore.com'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/account'] },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
```

---

### CSV Bulk Import (`/api/admin/products/import`)

**Auth:** ADMIN

**Content-Type:** `multipart/form-data` with CSV file

**CSV format:**
```
name,description,categorySlug,basePrice,salePrice,sku,tags,size,color,stock
Linen Shirt,"Full linen shirt",clothes,4500,,LNS-001,"formal,summer",M,White,10
Linen Shirt,"Full linen shirt",clothes,4500,,LNS-001,"formal,summer",L,White,8
```

- One row per variant
- Products with same SKU are grouped as variants of the same product
- Category looked up by slug
- Errors: collect all row errors, return as array (don't fail entire import on one bad row)

**Response:**
```json
{
  "success": true,
  "data": {
    "productsCreated": 15,
    "variantsCreated": 45,
    "errors": [
      { "row": 12, "error": "Category 'shoes' not found" }
    ]
  }
}
```

---

### Google Analytics 4 Integration

**`src/components/shared/Analytics.tsx`:**
```tsx
import Script from 'next/script'

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID
  if (!gaId) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  )
}
```

Add to `src/app/layout.tsx`.

---

## Full Code Templates

### `tests/integration/checkout.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db/client'
import { getValidatedPrice, getValidatedCartTotal } from '@/lib/services/payment/priceValidator'

describe('Checkout flow integration', () => {
  let userId: string
  let productId: string
  let orderId: string

  beforeAll(async () => {
    const category = await db.category.findFirst()!

    const user = await db.user.create({
      data: { email: `checkout-test-${Date.now()}@test.com`, name: 'Test', passwordHash: 'x', isVerified: true },
    })
    userId = user.id

    const product = await db.product.create({
      data: {
        name: 'Checkout Test Shirt',
        slug: `checkout-test-${Date.now()}`,
        description: 'Integration test product',
        basePrice: 2500,
        sku: `CTS-${Date.now()}`,
        categoryId: category!.id,
      },
    })
    productId = product.id
  })

  it('creates order with server-validated price', async () => {
    const order = await db.order.create({
      data: {
        userId,
        subtotal: 2500,
        shippingCost: 200,
        total: 2700,
        items: {
          create: [{ productId, quantity: 1, price: 2500 }],
        },
      },
    })
    orderId = order.id
    expect(Number(order.total)).toBe(2700)
    expect(order.status).toBe('PENDING')
  })

  it('price validator returns base price when no flash sale', async () => {
    const price = await getValidatedPrice(productId)
    expect(price).toBe(2500)
  })

  it('price validator applies flash sale discount server-side', async () => {
    await db.flashSale.create({
      data: {
        name: 'Test Flash Sale',
        discountPct: 20,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
        isActive: true,
        productIds: [productId],
      },
    })

    const price = await getValidatedPrice(productId)
    expect(price).toBeCloseTo(2000, 0)  // 2500 * 0.80 = 2000
  })

  afterAll(async () => {
    await db.flashSale.deleteMany({ where: { productIds: { has: productId } } })
    await db.orderItem.deleteMany({ where: { orderId } })
    await db.order.deleteMany({ where: { id: orderId } })
    await db.product.delete({ where: { id: productId } })
    await db.user.delete({ where: { id: userId } })
  })
})
```

---

## Acceptance Criteria

- [ ] `npx vitest run` → all unit tests pass (0 failures)
- [ ] `npx vitest run tests/integration/` → all integration tests pass
- [ ] `npx playwright test` → homepage, cart, auth E2E tests pass
- [ ] Lighthouse on `/`: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90
- [ ] Lighthouse on `/products`: Performance ≥ 80
- [ ] Product images load with WebP format from Cloudinary
- [ ] No N+1 queries visible in Prisma query log for PLP or PDP
- [ ] Sentry DSN connected — test error appears in Sentry dashboard
- [ ] `GET /sitemap.xml` returns valid XML with product and category URLs
- [ ] `GET /robots.txt` disallows `/admin` and `/api`
- [ ] CSV import: upload 10 products → all created correctly
- [ ] GA4 tag present in page source for production build

---

## Progress Tracker Updates

```
[2026-04-28] End-to-end testing (browse → cart → pay → email) — done
[2026-04-28] Lighthouse audit (target 90+ all scores) — done
[2026-04-28] Sentry error tracking setup — done
[2026-04-28] Google Analytics 4 + Meta Pixel integration — done
[2026-04-28] Bulk CSV import/export — done
[2026-04-28] Dependency vulnerability scan (npm audit / Snyk) — done
```
