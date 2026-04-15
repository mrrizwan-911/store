# DAY 05 — Cart Logic + WhatsApp Integration

## Overview

**Goal:** A fully functional cart system — persisted server-side for authenticated users, Redux-only for guests — with a slide-out CartDrawer, a full `/cart` page with coupon validation, and a WhatsApp order flow for the non-checkout path.

**Deliverables:**
- `POST /api/cart` — add item to server cart
- `GET /api/cart` — fetch user's current cart
- `PATCH /api/cart/[itemId]` — update item quantity
- `DELETE /api/cart/[itemId]` — remove item from cart
- `POST /api/cart/sync` — sync Redux cart to server on login
- `POST /api/coupons/validate` — validate coupon code
- WhatsApp URL generator utility (`src/lib/utils/whatsapp.ts`)
- Full `/cart` page
- `CouponInput` component

**Success Criteria:**
- Adding a product from PDP persists to DB for logged-in users
- Guest cart lives in Redux (localStorage persisted via middleware)
- On login, guest cart is synced to server cart
- Coupon code `SAVE10` applies 10% discount (hardcoded for test)
- WhatsApp button on PDP and `/cart` generates correct wa.me link with product details
- Cart quantity updates are debounced (no request on every keystroke)
- Removing last item leaves empty cart state visible

---

## Prerequisites

- Day 1: Cart, CartItem models in Prisma schema
- Day 2: Auth middleware, JWT verification
- Day 3: Redux cartSlice with addItem/removeItem/updateQuantity
- Day 4: ProductCard, PDP page with Add to Cart button

---

## Setup & Script Tasks

```bash
# Create API route directories
mkdir -p "src/app/api/cart/[itemId]"
mkdir -p src/app/api/cart/sync
mkdir -p src/app/api/coupons
mkdir -p "src/app/(store)/cart"

# Add localStorage persistence middleware for Redux
npm install redux-persist
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/cart/route.ts` | CREATE | GET (fetch cart) + POST (add item) |
| `src/app/api/cart/[itemId]/route.ts` | CREATE | PATCH (update qty) + DELETE (remove) |
| `src/app/api/cart/sync/route.ts` | CREATE | POST — bulk sync guest cart to server |
| `src/app/api/coupons/validate/route.ts` | CREATE | POST — validate coupon code |
| `src/lib/utils/whatsapp.ts` | CREATE | WhatsApp URL generator |
| `src/lib/validations/cart.ts` | CREATE | Zod schemas for cart operations |
| `src/app/(store)/cart/page.tsx` | CREATE | Full cart page |
| `src/components/store/CartPage.tsx` | CREATE | Client component for cart UI |
| `src/components/store/CouponInput.tsx` | CREATE | Coupon code input + validation |
| `src/components/store/CartDrawer.tsx` | MODIFY | Complete the slide-out drawer from Day 3 |
| `src/store/middleware/cartPersist.ts` | CREATE | localStorage persistence |

---

## Specifications

### `GET /api/cart`

**Auth:** Required (Bearer token)

**Response:** Full cart with items, product data, variant data.

```json
{
  "success": true,
  "data": {
    "id": "cart_xxx",
    "items": [
      {
        "id": "item_xxx",
        "quantity": 2,
        "product": {
          "id": "...", "name": "Linen Dress Shirt", "slug": "...",
          "basePrice": "4500.00", "salePrice": null,
          "images": [{ "url": "...", "altText": "..." }]
        },
        "variant": { "id": "...", "size": "M", "color": "White", "price": null }
      }
    ],
    "subtotal": 9000,
    "itemCount": 2
  }
}
```

**Computed fields:**
- `subtotal`: sum of (variant.price ?? product.basePrice) * quantity for each item
- `itemCount`: sum of all quantities

---

### `POST /api/cart`

**Auth:** Required

**Request body:**
```json
{ "productId": "...", "variantId": "...", "quantity": 1 }
```

**Behavior:**
1. Find or create cart for userId
2. Update `lastActiveAt` to now (for abandoned cart tracking)
3. Check if item already exists (`cartId + productId + variantId` unique constraint)
4. If exists: increment quantity
5. If not: create new CartItem
6. Return updated cart item count

**Validation:**
- `productId`: required, product must exist and be active
- `variantId`: optional, but if provided must belong to the product
- `quantity`: integer, min 1, max 10 (don't allow bulk cart spam)

**Stock check:** Verify `variant.stock >= quantity` before adding. If insufficient → 409 with "Not enough stock"

---

### `PATCH /api/cart/[itemId]`

**Auth:** Required

**Request body:** `{ "quantity": 3 }`

**Behavior:**
- Verify the CartItem belongs to the requesting user's cart (security check)
- Check stock availability for new quantity
- If quantity is 0 → delete the item instead
- Update and return new cart summary

---

### `DELETE /api/cart/[itemId]`

**Auth:** Required

**Behavior:**
- Verify CartItem belongs to requesting user's cart
- Delete CartItem
- Return 200 with `{ success: true }`

---

### `POST /api/cart/sync`

**Purpose:** Called after login to merge guest cart (stored in Redux) into server cart.

**Auth:** Required

**Request body:**
```json
{
  "items": [
    { "productId": "...", "variantId": "...", "quantity": 2 }
  ]
}
```

**Behavior:**
- For each item in the request:
  - Check if item already exists in server cart
  - If yes: take the max quantity (don't double-add)
  - If no: create new CartItem
- Return merged cart
- Client clears Redux cart after sync

---

### `POST /api/coupons/validate`

**Auth:** Optional (coupons work for guests too)

**Request body:**
```json
{ "code": "SAVE10", "orderValue": 5000 }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "SAVE10",
    "discountPct": 10,
    "discountFlat": null,
    "discountAmount": 500,  // computed: 10% of 5000
    "newTotal": 4500
  }
}
```

**Validation rules:**
- Coupon must exist and `isActive: true`
- `usedCount < maxUses` (if maxUses is set)
- `expiresAt > now` (if expiresAt is set)
- `orderValue >= minOrderValue` (if minOrderValue is set)

**Error responses:**
| Condition | Message |
|-----------|---------|
| Not found | "Invalid coupon code" |
| Expired | "This coupon has expired" |
| Max uses reached | "This coupon is no longer available" |
| Order too small | "Minimum order value of PKR {N} required for this coupon" |

---

### `src/lib/utils/whatsapp.ts`

**Function:** `generateWhatsAppOrderUrl(params: WhatsAppOrderParams): string`

**Input:**
```typescript
interface WhatsAppOrderParams {
  productName: string
  size?: string
  color?: string
  quantity: number
  price: number
  productUrl: string
}
```

**Output:** `https://wa.me/{phone}?text={encodedMessage}`

**Message format:**
```
Hi! I'd like to order:

Product: Linen Dress Shirt
Size: M
Color: White
Quantity: 2
Price: PKR 9,000

Link: https://yourstore.com/products/linen-dress-shirt
```

**Phone source:** `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` — strip non-digits before building URL.

**Also create:** `generateWhatsAppCartUrl(items: CartItem[]): string` — for ordering entire cart via WhatsApp (used on `/cart` page).

---

### Cart Page (`/cart`) Specification

**Layout:** Two columns — cart items (left, wider), order summary (right, sticky)

**Left — Cart Items:**
- Heading: "Your Cart ({N} items)"
- Each item row:
  - Product image (72x90px, object-cover)
  - Product name + variant (Size: M, Color: White)
  - Unit price in PKR
  - Quantity stepper: `−` button / number input / `+` button
    - Debounce quantity changes 400ms before API call
    - Don't let quantity go below 1 from stepper (use remove button to delete)
  - Remove button (trash icon) → calls DELETE endpoint + removes from Redux
  - "Move to Wishlist" link → adds to wishlist Redux state, removes from cart
- "Continue Shopping" link → back to `/products`

**Right — Order Summary (sticky):**
- "Order Summary" heading
- Subtotal line
- Shipping: "Calculated at checkout" until checkout step
- Discount line (shows when coupon applied, in green)
- Total
- `CouponInput` component
- "Proceed to Checkout" button (gold, full width) → `/checkout`
- Payment icons row (JazzCash, EasyPaisa, Visa, COD)
- "Order via WhatsApp" link (for users who want direct)

**Empty cart state:**
- Shopping bag icon
- "Your cart is empty"
- "Start Shopping" button → `/products`

---

### Redux localStorage Persistence

Cart and wishlist should persist across page refreshes for guests.

Use `redux-persist`:
```typescript
// src/store/index.ts — update to add persistence
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // localStorage

const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items'], // don't persist isOpen
}

const wishlistPersistConfig = {
  key: 'wishlist',
  storage,
}
```

Wrap the root layout's `ReduxProvider` with `PersistGate` to avoid hydration mismatch.

---

## Full Code Templates

### `src/lib/utils/whatsapp.ts`

```typescript
interface WhatsAppOrderParams {
  productName: string
  size?: string
  color?: string
  quantity: number
  price: number
  productUrl: string
}

export function generateWhatsAppOrderUrl(params: WhatsAppOrderParams): string {
  const { productName, size, color, quantity, price, productUrl } = params

  const lines = [
    `Hi! I'd like to order:`,
    ``,
    `Product: ${productName}`,
    size ? `Size: ${size}` : null,
    color ? `Color: ${color}` : null,
    `Quantity: ${quantity}`,
    `Price: PKR ${price.toLocaleString('en-PK')}`,
    ``,
    `Link: ${productUrl}`,
  ]

  const message = lines.filter(Boolean).join('\n')
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/[^0-9]/g, '')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

interface CartItemForWhatsApp {
  name: string
  size?: string
  color?: string
  quantity: number
  price: number
}

export function generateWhatsAppCartUrl(
  items: CartItemForWhatsApp[],
  total: number
): string {
  const itemLines = items.map(item => {
    const variant = [item.size, item.color].filter(Boolean).join(', ')
    return `• ${item.name}${variant ? ` (${variant})` : ''} × ${item.quantity} — PKR ${item.price.toLocaleString('en-PK')}`
  })

  const message = [
    `Hi! I'd like to order the following:`,
    ``,
    ...itemLines,
    ``,
    `Total: PKR ${total.toLocaleString('en-PK')}`,
    ``,
    `Please confirm availability and delivery details.`,
  ].join('\n')

  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/[^0-9]/g, '')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
```

### `src/app/api/cart/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const addItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
})

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload = verifyAccessToken(token)
    return payload.userId
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, basePrice: true, salePrice: true,
                       images: { where: { isPrimary: true }, take: 1 } },
          },
          variant: { select: { id: true, size: true, color: true, price: true } },
        },
      },
    },
  })

  if (!cart) {
    return NextResponse.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } })
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const unitPrice = Number(item.variant?.price ?? item.product.salePrice ?? item.product.basePrice)
    return sum + unitPrice * item.quantity
  }, 0)

  return NextResponse.json({
    success: true,
    data: { ...cart, subtotal, itemCount: cart.items.reduce((s, i) => s + i.quantity, 0) },
  })
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = addItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { productId, variantId, quantity } = parsed.data

  // Validate product exists
  const product = await db.product.findUnique({
    where: { id: productId, isActive: true },
    include: { variants: variantId ? { where: { id: variantId } } : false },
  })

  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
  }

  // Stock check for variant
  if (variantId && product.variants) {
    const variant = product.variants[0]
    if (!variant) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 })
    }
    if (variant.stock < quantity) {
      return NextResponse.json({ success: false, error: 'Not enough stock' }, { status: 409 })
    }
  }

  // Find or create cart
  const cart = await db.cart.upsert({
    where: { userId },
    update: { lastActiveAt: new Date() },
    create: { userId },
  })

  // Upsert cart item (add quantity if exists)
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId_variantId: { cartId: cart.id, productId, variantId: variantId ?? null } },
  })

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await db.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    })
  }

  // Return updated item count
  const itemCount = await db.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  })

  return NextResponse.json({ success: true, data: { itemCount: itemCount._sum.quantity ?? 0 } })
}
```

---

## Tests Required

### `tests/unit/whatsapp.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { generateWhatsAppOrderUrl, generateWhatsAppCartUrl } from '@/lib/utils/whatsapp'

beforeEach(() => {
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+92-300-1234567'
})

describe('WhatsApp URL generator', () => {
  it('generates a valid wa.me URL', () => {
    const url = generateWhatsAppOrderUrl({
      productName: 'Linen Dress Shirt',
      size: 'M',
      color: 'White',
      quantity: 2,
      price: 9000,
      productUrl: 'https://store.com/products/linen-dress-shirt',
    })
    expect(url).toMatch(/^https:\/\/wa\.me\/92300/)
    expect(url).toContain('Linen+Dress+Shirt')
    expect(url).toContain('Size%3A+M')
  })

  it('omits size and color lines when not provided', () => {
    const url = generateWhatsAppOrderUrl({
      productName: 'Generic Product',
      quantity: 1,
      price: 1500,
      productUrl: 'https://store.com/products/generic',
    })
    expect(url).not.toContain('Size')
    expect(url).not.toContain('Color')
  })

  it('strips non-numeric characters from phone number', () => {
    const url = generateWhatsAppOrderUrl({
      productName: 'Test',
      quantity: 1,
      price: 100,
      productUrl: 'https://store.com/p',
    })
    expect(url).toMatch(/wa\.me\/923001234567/)
  })

  it('generates cart URL with multiple items', () => {
    const url = generateWhatsAppCartUrl(
      [
        { name: 'Shirt', size: 'M', quantity: 1, price: 2500 },
        { name: 'Shoes', color: 'Black', quantity: 1, price: 5000 },
      ],
      7500
    )
    expect(url).toContain('Shirt')
    expect(url).toContain('Shoes')
    expect(url).toContain('7%2C500') // PKR 7,500 encoded
  })
})
```

```bash
npx vitest run tests/unit/whatsapp.test.ts
```

---

## Acceptance Criteria

- [ ] `POST /api/cart` with valid product → 200, item appears in DB CartItem table
- [ ] `POST /api/cart` with `variantId` that has 0 stock → 409 "Not enough stock"
- [ ] `GET /api/cart` returns correct subtotal (variant price override respected)
- [ ] `PATCH /api/cart/{itemId}` with quantity 0 → removes the item
- [ ] `DELETE /api/cart/{itemId}` removes item, cart still exists
- [ ] `POST /api/coupons/validate` with `SAVE10` → 200 with 10% discount computed
- [ ] `POST /api/coupons/validate` with expired code → 400 "This coupon has expired"
- [ ] `/cart` page shows all cart items with correct prices
- [ ] Qty stepper debounces API calls — no request per keystroke
- [ ] Removing item from cart updates count in Navbar immediately (Redux)
- [ ] WhatsApp button on PDP generates correct wa.me URL
- [ ] WhatsApp button on `/cart` page generates multi-item message
- [ ] Guest cart persists across page refreshes (localStorage)
- [ ] All unit tests pass

---

## Progress Tracker Updates

```
[2026-04-19] Cart drawer + full cart page — done
[2026-04-19] Coupon/discount code validation — done
[2026-04-19] WhatsApp order button + pre-filled message — done
[2026-04-19] Floating WhatsApp support widget — partial (add on Day 12)
```
