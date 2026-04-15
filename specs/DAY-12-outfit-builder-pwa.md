# DAY 12 — Outfit Builder + PWA + Remaining Unique Features

## Overview

**Goal:** The Outfit Builder (admin creates looks, public lookbook page, add-entire-look-to-cart), PWA configuration (installable, offline manifest), Gift Mode (gift wrap toggle at checkout), and Floating WhatsApp widget. These are the remaining differentiating features.

**Deliverables:**
- `POST /api/admin/outfits` — create outfit with products
- `GET /api/admin/outfits` — list outfits
- `PATCH /api/admin/outfits/[id]` — update outfit
- `GET /api/outfits` — public: list published outfits
- `GET /api/outfits/[id]` — public: single outfit with products
- `/lookbook` — public lookbook page
- `/lookbook/[id]` — single outfit page with "Add All to Cart"
- `/admin/outfits` — admin outfit builder
- `public/manifest.json` — PWA manifest
- `public/sw.js` — service worker (basic caching)
- `FloatingWhatsApp` component — bottom-right support widget
- Gift Mode integration in checkout (Day 6 schema already has `isGift` + `giftMessage`)
- `/gift` — standalone gift mode page/flow

**Success Criteria:**
- Admin can create an outfit with 2-5 products, publish it
- Published outfits appear on `/lookbook`
- "Add All to Cart" adds all outfit items to Redux cart
- PWA: `npm run build && npx serve .next` → installable in Chrome
- FloatingWhatsApp button opens WhatsApp chat on click
- Gift mode toggle at checkout shows gift message textarea

---

## Prerequisites

- Day 1: Outfit, OutfitItem models in schema
- Day 3: Redux cartSlice with addItem action
- Day 9: Admin layout, auth guard

---

## Setup & Script Tasks

```bash
# PWA support
npm install next-pwa
# OR use manual manifest + service worker (simpler — we'll do manual)

# Create directories
mkdir -p "src/app/api/admin/outfits/[id]"
mkdir -p "src/app/api/outfits/[id]"
mkdir -p "src/app/(store)/lookbook/[id]"
mkdir -p "src/app/(admin)/admin/outfits"
mkdir -p public/icons

# Generate placeholder PWA icons (use any 192x192 and 512x512 PNG)
# Customer replaces these with their actual brand icons
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/admin/outfits/route.ts` | CREATE | GET all + POST create |
| `src/app/api/admin/outfits/[id]/route.ts` | CREATE | GET + PATCH + DELETE |
| `src/app/api/outfits/route.ts` | CREATE | GET published outfits |
| `src/app/api/outfits/[id]/route.ts` | CREATE | GET single outfit |
| `src/app/(store)/lookbook/page.tsx` | CREATE | Lookbook list page |
| `src/app/(store)/lookbook/[id]/page.tsx` | CREATE | Single outfit page |
| `src/components/store/OutfitCard.tsx` | CREATE | Outfit grid card |
| `src/components/store/OutfitDetail.tsx` | CREATE | Outfit detail with Add All |
| `src/app/(admin)/admin/outfits/page.tsx` | CREATE | Admin outfits list |
| `src/components/admin/OutfitBuilder.tsx` | CREATE | Admin outfit creation form |
| `src/components/store/FloatingWhatsApp.tsx` | CREATE | Fixed bottom-right WhatsApp button |
| `public/manifest.json` | CREATE | PWA manifest |
| `public/sw.js` | CREATE | Basic service worker |
| `src/app/layout.tsx` | MODIFY | Add PWA meta tags + FloatingWhatsApp |
| `src/app/(store)/gift/page.tsx` | CREATE | Gift mode landing/flow |
| `src/lib/validations/outfit.ts` | CREATE | Zod schema for outfit |

---

## Specifications

### Outfit Builder Data Flow

**Admin flow:**
1. Admin opens `/admin/outfits`
2. Clicks "+ Create New Look"
3. Fills: title, description, season, occasion, gender, hero image
4. Searches products and selects 2-5
5. Drag to reorder
6. Toggles "Published"
7. Saves

**Customer flow:**
1. Customer browses `/lookbook` — masonry grid of outfit cards
2. Clicks an outfit card → `/lookbook/[id]`
3. Sees: hero image, outfit name, 2-5 product mini-cards
4. Can "Add All to Cart" (one click adds all items as cart items)
5. Can "Add" individual items

---

### `POST /api/admin/outfits`

**Auth:** ADMIN

**Request:**
```json
{
  "title": "The Classic Formal",
  "description": "Perfect for corporate events and formal gatherings.",
  "imageUrl": "https://res.cloudinary.com/...",
  "season": "All Season",
  "occasion": "Formal",
  "gender": "Men",
  "productIds": ["prod_a", "prod_b", "prod_c"],
  "isPublished": false
}
```

**Validation:**
- `productIds`: 2-5 items, all must exist and be active
- `title`: required, min 3 chars
- `occasion`: optional free text (or enum — Casual, Formal, Festive, Wedding, Work)

**Processing:**
1. Validate all productIds
2. Create Outfit record
3. Create OutfitItems in order of the `productIds` array (sortOrder = array index)
4. Return outfit with products

---

### `GET /api/outfits` (Public)

**Query params:**
- `gender`: filter (Men, Women, Unisex)
- `season`: filter (Summer, Winter, All Season)
- `occasion`: filter (Casual, Formal, Festive)

**Response:** Only `isPublished: true` outfits, with product data for cards.

```json
{
  "success": true,
  "data": {
    "outfits": [
      {
        "id": "...",
        "title": "The Classic Formal",
        "imageUrl": "...",
        "season": "All Season",
        "occasion": "Formal",
        "gender": "Men",
        "itemCount": 3,
        "totalPrice": 18500,
        "items": [
          {
            "product": { "id": "...", "name": "...", "basePrice": "4500", "images": [...] }
          }
        ]
      }
    ]
  }
}
```

---

### "Add All to Cart" Behavior

**Client-side only action — dispatches to Redux:**

```typescript
function handleAddAllToCart(outfit: Outfit) {
  outfit.items.forEach(item => {
    dispatch(addItem({
      productId: item.product.id,
      name: item.product.name,
      price: Number(item.product.basePrice),
      quantity: 1,
      imageUrl: item.product.images[0]?.url ?? '',
    }))
  })
  dispatch(openCart())  // slide open the cart drawer
}
```

This is Redux-only (no API call). When user proceeds to checkout, the server validates actual prices.

---

### `FloatingWhatsApp` Component

**Fixed position:** `position: fixed; bottom: 24px; right: 24px; z-index: 100`

**UI:**
- Circle button, 56px diameter, WhatsApp green background (#25D366)
- WhatsApp logo icon (white)
- Tooltip on hover: "Chat with us on WhatsApp"
- On click: open `https://wa.me/{WHATSAPP_NUMBER}?text=Hi! I need help with my order.` in new tab

**Include in root layout** so it appears on every page.

---

### PWA Configuration

**`public/manifest.json`:**
```json
{
  "name": "Your Fashion Store",
  "short_name": "Store",
  "description": "Premium fashion for everyone",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#E8D5B0",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/home.png", "sizes": "1280x720", "type": "image/png", "form_factor": "wide" }
  ]
}
```

**`public/sw.js`** — basic cache-first for static assets:
```javascript
const CACHE_NAME = 'store-cache-v1'
const STATIC_ASSETS = ['/', '/manifest.json']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', event => {
  // Network-first for API calls, cache-first for static
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached ?? fetch(event.request))
  )
})
```

**In `src/app/layout.tsx`**, add:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#E8D5B0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

And register service worker client-side:
```typescript
// src/lib/utils/registerSW.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
    })
  }
}
```

Call `registerServiceWorker()` in a `useEffect` in `ReduxProvider` or a dedicated component.

---

### Gift Mode

**At checkout (Step 3 — Payment), add:**
- Checkbox: "This is a gift"
- On check: show
  - "Gift message" textarea (max 200 chars)
  - "Hide price from recipient" checkbox

**These fields are already in the Order schema** (`isGift`, `giftMessage`). The `createOrder` endpoint already accepts them (Day 6).

**`/gift` page:** Simple landing page explaining gift features. CTA: "Shop Now" and "Learn about gift wrapping".

---

### Admin Outfit Builder UI

**List page:**
- Grid of outfit cards: image + title + published badge + Edit/Delete buttons
- "+ Create New Look" button

**Create/Edit form:**
- Left: form fields (title, description, tags)
- Image upload (Cloudinary, same as product images)
- Product selector: search input → shows matching products as selectable cards
- Selected products: displayed as reorderable cards with drag handle
- Published toggle
- "Save Outfit" button

**Product selector behavior:**
- Type to search `/api/products?search=xxx&limit=8`
- Click to select (green checkmark appears on card)
- Max 5 selections — disable adding more
- Click selected product to deselect

---

## Full Code Templates

### `src/app/api/admin/outfits/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { z } from 'zod'

const outfitSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  season: z.string().optional(),
  occasion: z.string().optional(),
  gender: z.string().optional(),
  productIds: z.array(z.string()).min(2).max(5),
  isPublished: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const outfits = await db.outfit.findMany({
    include: { items: { include: { product: { select: { id: true, name: true, slug: true, basePrice: true } } }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: outfits })
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const body = await req.json()
  const parsed = outfitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { productIds, ...outfitData } = parsed.data

  // Verify all products exist and are active
  const products = await db.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  })

  if (products.length !== productIds.length) {
    return NextResponse.json({ success: false, error: 'One or more products not found' }, { status: 404 })
  }

  const outfit = await db.outfit.create({
    data: {
      ...outfitData,
      items: {
        create: productIds.map((productId, index) => ({ productId, sortOrder: index })),
      },
    },
    include: { items: { include: { product: true }, orderBy: { sortOrder: 'asc' } } },
  })

  return NextResponse.json({ success: true, data: outfit }, { status: 201 })
}
```

### `src/components/store/FloatingWhatsApp.tsx`

```tsx
'use client'

import { MessageCircle } from 'lucide-react'

export function FloatingWhatsApp() {
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/[^0-9]/g, '')
  const message = encodeURIComponent('Hi! I need help with my order.')
  const href = `https://wa.me/${phone}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:bg-[#20ba5a] transition-colors"
    >
      <MessageCircle className="w-7 h-7 text-white" fill="white" />
    </a>
  )
}
```

---

## Tests Required

### `tests/integration/outfits.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db/client'

describe('Outfit builder', () => {
  let outfitId: string
  let productIds: string[] = []

  beforeAll(async () => {
    const category = await db.category.findFirst()
    const products = await Promise.all([
      db.product.create({
        data: { name: 'Outfit Shirt', slug: `os-${Date.now()}`, description: 'Test', basePrice: 3000, sku: `OS-${Date.now()}`, categoryId: category!.id },
      }),
      db.product.create({
        data: { name: 'Outfit Trousers', slug: `ot-${Date.now()}`, description: 'Test', basePrice: 4000, sku: `OT-${Date.now()}`, categoryId: category!.id },
      }),
    ])
    productIds = products.map(p => p.id)
  })

  it('creates outfit with ordered items', async () => {
    const outfit = await db.outfit.create({
      data: {
        title: 'Test Look',
        items: {
          create: productIds.map((productId, idx) => ({ productId, sortOrder: idx })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
    outfitId = outfit.id
    expect(outfit.items).toHaveLength(2)
    expect(outfit.items[0].sortOrder).toBe(0)
    expect(outfit.isPublished).toBe(false)
  })

  it('only published outfits appear in public list', async () => {
    const published = await db.outfit.findMany({ where: { isPublished: true } })
    const ourOutfit = published.find(o => o.id === outfitId)
    expect(ourOutfit).toBeUndefined() // not published yet
  })

  afterAll(async () => {
    if (outfitId) {
      await db.outfitItem.deleteMany({ where: { outfitId } })
      await db.outfit.delete({ where: { id: outfitId } })
    }
    await db.product.deleteMany({ where: { id: { in: productIds } } })
  })
})
```

---

## Acceptance Criteria

- [ ] Admin can create outfit with 2-5 products → saved in DB with correct sortOrder
- [ ] Published outfit appears on `/lookbook` page
- [ ] Unpublished outfit does NOT appear on `/lookbook`
- [ ] "Add All to Cart" dispatches all outfit items to Redux + opens CartDrawer
- [ ] CartDrawer shows all added outfit items with correct prices
- [ ] Lookbook page filters work (gender, occasion tabs)
- [ ] FloatingWhatsApp visible on all pages, opens WhatsApp on click
- [ ] Gift mode toggle at checkout shows gift message textarea
- [ ] `manifest.json` is valid PWA manifest (test with Chrome DevTools Lighthouse)
- [ ] Service worker registers without errors in console
- [ ] Site shows "Add to Home Screen" prompt in Chrome on mobile
- [ ] All integration tests pass

---

## Progress Tracker Updates

```
[2026-04-26] Outfit Builder (admin creates looks, Look Book page, add-entire-look-to-cart) — done
[2026-04-26] Outfit tagging (season, occasion, gender) — done
[2026-04-26] Gift Mode (gift wrap, personal note, hide price) — done
[2026-04-26] PWA setup (installable, push notifications, offline mode) — done
[2026-04-26] Floating WhatsApp support widget — done
```
