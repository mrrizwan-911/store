# DAY 10 — Flash Sale Scheduler + Admin Product Management

## Overview

**Goal:** A flash sale system with server-time-synced countdown timers (no client clock drift), a Vercel Cron cleanup job, and a full admin product management CRUD with drag-and-drop image upload and AI description generation.

**Deliverables:**
- `GET /api/time` — server UTC time for frontend sync
- Flash sale timer hook `useFlashSaleTimer`
- `FlashSaleCountdown` component
- `POST /api/admin/flash-sales` — create flash sale
- `GET /api/admin/flash-sales` — list all flash sales
- `PATCH /api/admin/flash-sales/[id]` — update sale
- `DELETE /api/admin/flash-sales/[id]` — delete sale
- `GET /api/cron/flash-sale-cleanup` — Vercel Cron endpoint
- `GET /api/admin/products` — admin product list
- `POST /api/admin/products` — create product
- `PATCH /api/admin/products/[id]` — update product
- `DELETE /api/admin/products/[id]` — delete/deactivate product
- `POST /api/admin/products/[id]/images` — upload product images
- Admin product list page + create/edit product form
- Admin flash sale page

**Success Criteria:**
- Flash sale countdown stays in sync with server time across different timezones
- Timer hits zero exactly when server-side `endTime` passes
- Price validation server-side applies flash sale discount (from Day 6)
- Vercel Cron cleanup deactivates expired sales
- Admin can create a product with variants, images, and AI description
- Product slug auto-generates from name (editable)
- Drag-and-drop image upload works with Cloudinary

---

## Prerequisites

- Day 1: FlashSale model in schema
- Day 6: `getValidatedPrice` already checks flash sale
- Day 9: Admin auth helper, admin layout

---

## Setup & Script Tasks

```bash
# Cloudinary for image upload
npm install cloudinary next-cloudinary

# Drag-and-drop
npm install react-dropzone

# Create directories
mkdir -p "src/app/api/admin/flash-sales/[id]"
mkdir -p "src/app/api/admin/products/[id]/images"
mkdir -p src/app/api/cron
mkdir -p "src/app/(admin)/admin/flash-sales"
mkdir -p "src/app/(admin)/admin/products/new"
mkdir -p "src/app/(admin)/admin/products/[id]/edit"
mkdir -p src/hooks
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/time/route.ts` | CREATE | Server UTC time endpoint |
| `src/hooks/useFlashSaleTimer.ts` | CREATE | Server-synced countdown hook |
| `src/components/store/FlashSaleCountdown.tsx` | CREATE | Countdown UI component |
| `src/app/api/admin/flash-sales/route.ts` | CREATE | GET all + POST new |
| `src/app/api/admin/flash-sales/[id]/route.ts` | CREATE | PATCH + DELETE |
| `src/app/api/cron/flash-sale-cleanup/route.ts` | CREATE | Vercel Cron cleanup |
| `src/app/api/admin/products/route.ts` | CREATE | GET list + POST create |
| `src/app/api/admin/products/[id]/route.ts` | CREATE | GET + PATCH + DELETE |
| `src/app/api/admin/products/[id]/images/route.ts` | CREATE | POST — upload image |
| `src/lib/services/storage/cloudinary.ts` | CREATE | Cloudinary upload utility |
| `src/lib/validations/admin.ts` | CREATE | Zod schemas for product + flash sale |
| `src/app/(admin)/admin/flash-sales/page.tsx` | CREATE | Flash sale scheduler page |
| `src/app/(admin)/admin/products/page.tsx` | CREATE | Admin product list |
| `src/app/(admin)/admin/products/new/page.tsx` | CREATE | Create product form |
| `src/app/(admin)/admin/products/[id]/edit/page.tsx` | CREATE | Edit product form |
| `src/components/admin/ProductForm.tsx` | CREATE | Shared create/edit form |
| `src/components/admin/ImageUploader.tsx` | CREATE | Drag-and-drop uploader |
| `src/components/admin/FlashSaleForm.tsx` | CREATE | Flash sale create/edit form |
| `vercel.json` | CREATE | Cron job schedule |

---

## Specifications

### `GET /api/time`

Minimal endpoint. Returns current server UTC time. Called by client once on page load.

```typescript
export function GET() {
  return Response.json({ serverTime: new Date().toISOString() })
}
```

**Why this matters:** Customer device clocks can be wrong by minutes or hours. The flash sale endTime is stored in UTC. If client clock is ahead, the sale appears expired before it is. If behind, the sale appears active after it ended. One-time sync eliminates this drift.

---

### `src/hooks/useFlashSaleTimer.ts`

**Strategy:**
1. On mount: fetch `/api/time`, compute offset = serverTime - Date.now()
2. Every second: compute serverNow = Date.now() + offset, then remaining = endTime - serverNow
3. When remaining ≤ 0: set expired = true

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

export function useFlashSaleTimer(saleEndTimeUTC: string) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const clockOffsetMs = useRef<number>(0)  // server - client difference

  useEffect(() => {
    fetch('/api/time')
      .then(r => r.json())
      .then(({ serverTime }: { serverTime: string }) => {
        clockOffsetMs.current = new Date(serverTime).getTime() - Date.now()
      })
      .catch(() => {
        // If sync fails, fall back to client time — acceptable degradation
        clockOffsetMs.current = 0
      })
  }, [])

  useEffect(() => {
    const tick = () => {
      const correctedNow = Date.now() + clockOffsetMs.current
      const endMs = new Date(saleEndTimeUTC).getTime()
      setTimeLeft(Math.max(0, endMs - correctedNow))
    }

    tick() // run immediately
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [saleEndTimeUTC])

  const hours = Math.floor(timeLeft / 3_600_000)
  const minutes = Math.floor((timeLeft % 3_600_000) / 60_000)
  const seconds = Math.floor((timeLeft % 60_000) / 1000)
  const isExpired = timeLeft === 0

  return { hours, minutes, seconds, isExpired, timeLeft }
}
```

---

### `FlashSaleCountdown` Component

**Props:** `saleEndTimeUTC: string`, `saleName: string`, `discountPct: number`

**Display:**
```
⚡ FLASH SALE — 30% OFF
Ends in: 02 : 47 : 33
           HH   MM   SS
```

- Background: dark surface
- Countdown numbers: large, monospace, gold
- Labels: HH MM SS in small muted text below each number
- When `isExpired`: hide or show "Sale ended" message

**Usage:** Place above add-to-cart on PDP when product is in an active flash sale.

---

### Flash Sale API

**`POST /api/admin/flash-sales`**

```json
{
  "name": "Eid Special Sale",
  "discountPct": 30,
  "startTime": "2026-03-28T18:00:00Z",  // must be UTC ISO string
  "endTime": "2026-03-29T06:00:00Z",    // must be UTC
  "productIds": ["prod_abc", "prod_def"]
}
```

**Validation:**
- `discountPct`: 1-99
- `endTime` must be after `startTime`
- `endTime` must be in the future (can't create expired sales)
- `productIds`: non-empty array, all products must exist

**On create:** Set `isActive: false` — the cron or a background check activates it when `startTime` passes. For simplicity, you can activate immediately if `startTime <= now`.

---

### `GET /api/cron/flash-sale-cleanup`

**Protected by:** `Authorization: Bearer {CRON_SECRET}` header.

**Processing:**
1. Verify auth header matches `CRON_SECRET` env var
2. Deactivate expired sales: `where: { isActive: true, endTime: { lt: new Date() } }`
3. Activate upcoming sales that have now started: `where: { isActive: false, startTime: { lte: new Date() }, endTime: { gte: new Date() } }`
4. Return count of activated + deactivated

**`vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/flash-sale-cleanup",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/abandoned-cart",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

### Admin Product Management

**`POST /api/admin/products`**

**Request body:**
```json
{
  "name": "Linen Dress Shirt",
  "description": "Full description here...",
  "shortDescription": "Lightweight linen for summer.",
  "categoryId": "cat_xxx",
  "basePrice": 4500,
  "salePrice": null,
  "sku": "LDS-001",
  "isActive": true,
  "isFeatured": false,
  "tags": ["formal", "summer", "linen"],
  "variants": [
    { "size": "S", "color": "White", "stock": 10, "sku": "LDS-001-WHT-S" },
    { "size": "M", "color": "White", "stock": 15, "sku": "LDS-001-WHT-M" },
    { "size": "M", "color": "Navy", "stock": 8, "sku": "LDS-001-NVY-M" }
  ]
}
```

**Slug auto-generation:**
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
// Append timestamp if slug already exists
```

**Variant SKU uniqueness:** Each variant SKU must be unique. Validate before insert.

---

### `POST /api/admin/products/[id]/images`

**Auth:** ADMIN

**Content-Type:** `multipart/form-data`

**Processing:**
1. Accept file upload (use Next.js `req.formData()`)
2. Upload to Cloudinary via `uploadToCloudinary(buffer, folder: 'products')`
3. Create `ProductImage` record with returned URL
4. If `isPrimary: true` in form data, unset all other primary images for this product first
5. Return new image record

**`src/lib/services/storage/cloudinary.ts`:**
```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
        if (error || !result) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      })
      .end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
```

---

### `ProductForm` Component

**Sections:**

1. **Basic Info**
   - Name input → auto-updates slug field (editable)
   - Short description (1 line input)
   - Full description (textarea, will swap for rich text editor if time allows)

2. **Pricing**
   - Base Price (PKR) — required
   - Sale Price (PKR) — optional, shows "crossed out" in preview
   - SKU — required, unique

3. **Category**
   - Category dropdown (fetches from `/api/admin/categories`)
   - Subcategory dropdown (loads options based on selected category)

4. **Variants Table**
   - Each row: Size | Color | Stock | Price Override | SKU | Delete
   - "+ Add Variant" button adds new row
   - Variants sorted by color then size

5. **Tags**
   - Type tag + Enter to add
   - Removable tag chips

6. **Status**
   - Active toggle (Shadcn Switch)
   - Featured toggle

7. **Images (right panel)**
   - `ImageUploader` drag-and-drop area
   - Uploaded images grid with reorder + set primary (star icon)
   - Delete image (X icon) — removes from Cloudinary too

8. **AI Description** (right panel)
   - "Generate with AI" button → calls `/api/ai/generate-description`
   - Shows loading spinner → pastes result into description field
   - User can edit before saving

---

### `ImageUploader` Component

**UI:**
- Dashed border drop zone with cloud upload icon
- "Drag images here or click to upload" text
- Accepts: image/jpeg, image/png, image/webp
- Max file size: 5MB per image
- Max 8 images per product

**Behavior:**
- On drop/select: show preview thumbnails immediately (client-side blob URL)
- Upload each file to `/api/admin/products/[id]/images` via fetch
- Show upload progress bar per image
- On success: replace blob URL with Cloudinary URL
- First uploaded image is automatically set as primary

---

## Full Code Templates

### `src/app/api/cron/flash-sale-cleanup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const [deactivated, activated] = await Promise.all([
    // Deactivate sales that have ended
    db.flashSale.updateMany({
      where: { isActive: true, endTime: { lt: now } },
      data: { isActive: false },
    }),
    // Activate sales that have started and not yet ended
    db.flashSale.updateMany({
      where: { isActive: false, startTime: { lte: now }, endTime: { gte: now } },
      data: { isActive: true },
    }),
  ])

  console.log(`[CRON] Flash sales: deactivated=${deactivated.count}, activated=${activated.count}`)
  return NextResponse.json({ success: true, deactivated: deactivated.count, activated: activated.count })
}
```

### `src/lib/validations/admin.ts`

```typescript
import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(2, 'Product name required'),
  slug: z.string().optional(),  // auto-generated if not provided
  description: z.string().min(20, 'Description must be at least 20 characters'),
  shortDescription: z.string().max(200).optional(),
  categoryId: z.string().min(1, 'Category required'),
  basePrice: z.number().positive('Price must be positive'),
  salePrice: z.number().positive().optional().nullable(),
  sku: z.string().min(2, 'SKU required'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  variants: z.array(z.object({
    size: z.string().optional(),
    color: z.string().optional(),
    stock: z.number().int().min(0),
    sku: z.string(),
    price: z.number().positive().optional().nullable(),
  })).default([]),
})

export const flashSaleSchema = z.object({
  name: z.string().min(2),
  discountPct: z.number().int().min(1).max(99),
  startTime: z.string().datetime(),  // ISO UTC string
  endTime: z.string().datetime(),
  productIds: z.array(z.string()).min(1, 'Select at least one product'),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine(data => new Date(data.endTime) > new Date(), {
  message: 'End time must be in the future',
  path: ['endTime'],
})

export type ProductInput = z.infer<typeof productSchema>
export type FlashSaleInput = z.infer<typeof flashSaleSchema>
```

---

## Tests Required

### `tests/unit/useFlashSaleTimer.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFlashSaleTimer } from '@/hooks/useFlashSaleTimer'

// Mock fetch for server time
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ serverTime: new Date().toISOString() }),
})

describe('useFlashSaleTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns non-expired for future sale end time', async () => {
    const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    const { result } = renderHook(() => useFlashSaleTimer(futureTime))

    await act(async () => {
      await Promise.resolve() // let fetch resolve
    })

    expect(result.current.isExpired).toBe(false)
    expect(result.current.hours).toBeGreaterThan(0)
  })

  it('returns expired for past sale end time', async () => {
    const pastTime = new Date(Date.now() - 1000).toISOString()
    const { result } = renderHook(() => useFlashSaleTimer(pastTime))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isExpired).toBe(true)
    expect(result.current.timeLeft).toBe(0)
  })
})
```

### `tests/unit/slug-generator.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

describe('Slug generator', () => {
  it('converts spaces to hyphens', () => {
    expect(generateSlug('Linen Dress Shirt')).toBe('linen-dress-shirt')
  })

  it('removes special characters', () => {
    expect(generateSlug("Men's Kurta & Shalwar")).toBe('mens-kurta-shalwar')
  })

  it('collapses multiple spaces', () => {
    expect(generateSlug('Product   Name')).toBe('product-name')
  })

  it('lowercases everything', () => {
    expect(generateSlug('FORMAL SHIRT')).toBe('formal-shirt')
  })
})
```

---

## Acceptance Criteria

- [ ] `GET /api/time` returns current UTC ISO string
- [ ] Flash sale timer syncs with server time on first render
- [ ] Timer counts down in real-time (1 second intervals)
- [ ] Timer shows 00:00:00 and "Sale ended" when expired
- [ ] `POST /api/admin/flash-sales` creates sale with UTC times stored
- [ ] `GET /api/cron/flash-sale-cleanup` activates pending + deactivates expired
- [ ] Cron endpoint rejects requests without `CRON_SECRET` header
- [ ] `POST /api/admin/products` creates product with variants + generates slug
- [ ] Duplicate SKU → 409 error with clear message
- [ ] Image upload → Cloudinary URL stored in `ProductImage` table
- [ ] First uploaded image auto-set as primary
- [ ] AI description generator button in product form works
- [ ] Admin product list shows toggle to activate/deactivate product
- [ ] All unit tests pass

---

## Progress Tracker Updates

```
[2026-04-24] Flash sale scheduler (with server-time-synced frontend timer) — done
[2026-04-24] Product CRUD with drag-and-drop image upload — done
[2026-04-24] Bulk CSV import/export — partial (export done, import Day 14)
```
