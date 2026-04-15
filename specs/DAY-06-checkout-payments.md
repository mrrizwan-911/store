# DAY 06 — Checkout + Payment Gateways

## Overview

**Goal:** A complete multi-step checkout flow (Address → Shipping → Payment → Confirm) with server-side price validation (flash sale safe), JazzCash mobile wallet integration, EasyPaisa integration, Cash on Delivery, and a Stripe card payment option. Order creation with payment record linking.

**Deliverables:**
- `POST /api/checkout/create-order` — validate cart, validate prices, create Order
- `POST /api/payments/jazzcash/initiate` — generate JazzCash payload + redirect
- `POST /api/payments/jazzcash/callback` — handle JazzCash return, update order
- `POST /api/payments/easypaisa/initiate` — EasyPaisa request
- `POST /api/payments/easypaisa/callback` — update order
- `POST /api/payments/stripe/create-intent` — Stripe PaymentIntent
- `POST /api/payments/stripe/webhook` — Stripe webhook to confirm payment
- `POST /api/payments/cod/confirm` — confirm COD order
- `src/lib/services/payment/priceValidator.ts` — flash sale safe price check
- `src/lib/services/payment/jazzcash.ts` — HMAC hash + payload builder
- Multi-step checkout UI
- `/checkout/success` page

**Success Criteria:**
- Order is only created after server-side price validation (client-sent prices are never trusted)
- JazzCash HMAC hash generates correctly against test credentials
- COD order is created and status set to CONFIRMED
- Checkout success page shows order number and items
- Flash sale discount is applied server-side even if client timer expired

---

## Prerequisites

- Day 1: Order, OrderItem, Payment models in schema
- Day 2: Auth middleware
- Day 4: Product + variant data accessible
- Day 5: Cart API, coupon validation

---

## Setup & Script Tasks

```bash
# Stripe SDK
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Create checkout API directories
mkdir -p src/app/api/checkout
mkdir -p src/app/api/payments/{jazzcash,easypaisa,stripe,cod}
mkdir -p src/lib/services/payment

# Create checkout UI pages
mkdir -p "src/app/(store)/checkout/success"
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/lib/services/payment/priceValidator.ts` | CREATE | Flash sale safe price per product |
| `src/lib/services/payment/jazzcash.ts` | CREATE | JazzCash hash + payload builder |
| `src/lib/services/payment/easypaisa.ts` | CREATE | EasyPaisa hash + payload builder |
| `src/lib/services/payment/stripe.ts` | CREATE | Stripe client + PaymentIntent creation |
| `src/lib/validations/checkout.ts` | CREATE | Zod schemas for checkout flow |
| `src/app/api/checkout/create-order/route.ts` | CREATE | Main order creation endpoint |
| `src/app/api/payments/jazzcash/initiate/route.ts` | CREATE | JazzCash initiation |
| `src/app/api/payments/jazzcash/callback/route.ts` | CREATE | JazzCash callback handler |
| `src/app/api/payments/easypaisa/initiate/route.ts` | CREATE | EasyPaisa initiation |
| `src/app/api/payments/easypaisa/callback/route.ts` | CREATE | EasyPaisa callback |
| `src/app/api/payments/stripe/create-intent/route.ts` | CREATE | Stripe PaymentIntent |
| `src/app/api/payments/stripe/webhook/route.ts` | CREATE | Stripe webhook handler |
| `src/app/api/payments/cod/confirm/route.ts` | CREATE | COD order confirmation |
| `src/app/(store)/checkout/page.tsx` | CREATE | Multi-step checkout page |
| `src/components/store/CheckoutSteps.tsx` | CREATE | Step indicator + forms |
| `src/app/(store)/checkout/success/page.tsx` | CREATE | Order success page |

---

## Specifications

### `src/lib/services/payment/priceValidator.ts`

**Critical security function.** Called server-side during order creation. Client-sent prices are IGNORED — this function determines the actual price to charge.

**Function:** `getValidatedPrice(productId: string): Promise<number>`

**Logic:**
1. Fetch product from DB (basePrice, salePrice)
2. Check for active flash sale: `isActive: true, startTime <= now, endTime >= now, productIds has productId`
3. If active flash sale found → apply discount: `basePrice * (1 - discountPct / 100)`
4. If no flash sale → return `salePrice ?? basePrice`

**IMPORTANT:** All time comparisons use server UTC time (`new Date()`), never client-sent time.

**Also create:** `getValidatedCartTotal(items: { productId: string; variantId?: string; quantity: number }[]): Promise<number>`

This calls `getValidatedPrice` per item, and for variants with a price override, uses the variant price instead. Returns the validated total.

---

### `POST /api/checkout/create-order`

**Auth:** Required (or guest with guest email)

**Request body:**
```json
{
  "addressId": "addr_xxx",           // saved address (logged-in users)
  "guestAddress": { ... },           // for guest checkout
  "shippingMethod": "express",       // "standard" | "express" | "free"
  "paymentMethod": "JAZZCASH",       // PaymentMethod enum
  "couponCode": "SAVE10",            // optional
  "items": [
    { "productId": "...", "variantId": "...", "quantity": 2 }
  ],
  "isGift": false,
  "giftMessage": null
}
```

**Processing (in a Prisma transaction):**
1. Validate all items exist and are active
2. `getValidatedCartTotal(items)` — server-computed prices
3. Validate coupon if provided (same logic as `/api/coupons/validate`)
4. Compute shippingCost: Standard = 200, Express = 500, Free = 0 (if subtotal ≥ 3000)
5. Compute totals: subtotal, discount, shippingCost, total
6. Create `Order` record
7. Create `OrderItem` records (each with validated price)
8. Create `Payment` record with status PENDING
9. Clear server cart for logged-in users
10. Return orderId + paymentMethod-specific next step

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "orderNumber": "...",
    "total": 8750,
    "paymentMethod": "JAZZCASH",
    "nextStep": "redirect_to_gateway"  // or "confirm_cod"
  }
}
```

---

### `src/lib/services/payment/jazzcash.ts`

**JazzCash Mobile Wallet (MWALLET) Integration**

**HMAC Hash generation:**
1. Collect all `pp_*` fields (except `pp_SecureHash` itself)
2. Sort alphabetically by key
3. Join values with `&` separator
4. Prepend integrity salt: `{SALT}&{values}`
5. HMAC-SHA256 with integrity salt as key
6. Uppercase the hex digest

**Payload fields:**
| Field | Value |
|-------|-------|
| `pp_Version` | `1.1` |
| `pp_TxnType` | `MWALLET` |
| `pp_Language` | `EN` |
| `pp_MerchantID` | From env |
| `pp_Password` | From env |
| `pp_TxnRefNo` | `T{orderId}` (prefix T to avoid starting with digit) |
| `pp_Amount` | Amount in paisas (PKR × 100, integer) |
| `pp_TxnCurrency` | `PKR` |
| `pp_TxnDateTime` | `YYYYMMDDHHmmss` (server time, no separators) |
| `pp_BillReference` | orderId |
| `pp_Description` | Order description |
| `pp_TxnExpiryDateTime` | 1 hour from now, same format |
| `pp_ReturnURL` | `{APP_URL}/api/payments/jazzcash/callback` |
| `pp_MobileNumber` | Customer phone |
| `pp_SecureHash` | Generated hash (added last) |

**Submission:** Form POST to JazzCash sandbox URL (switch to production URL in production).

---

### JazzCash Callback Handler

**GET/POST /api/payments/jazzcash/callback**

JazzCash POSTs back with these fields:
- `pp_ResponseCode` — `000` = success
- `pp_TxnRefNo` — our order ID reference
- `pp_SecureHash` — verify this matches our computed hash
- `pp_Amount` — verify against order total

**Processing:**
1. Verify `pp_SecureHash` — if mismatch, reject (payment tampering attempt)
2. Extract orderId from `pp_TxnRefNo` (strip "T" prefix)
3. Verify `pp_Amount / 100` matches `order.total`
4. If `pp_ResponseCode === '000'`:
   - Update `Payment.status = COMPLETED`, `paidAt = now`, `gatewayRef = pp_TxnRefNo`
   - Update `Order.status = CONFIRMED`
5. Else: Update `Payment.status = FAILED`
6. Redirect to `/checkout/success?order={orderId}` or `/checkout/failed`

---

### `src/lib/services/payment/stripe.ts`

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function createPaymentIntent(amount: number, orderId: string): Promise<string> {
  // Amount in paisas (PKR smallest unit)
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'pkr',
    metadata: { orderId },
  })
  return intent.client_secret!
}
```

**Stripe Webhook:** Verify `stripe-signature` header using `stripe.webhooks.constructEvent`. On `payment_intent.succeeded` event: update Order and Payment records.

---

### Multi-Step Checkout UI

**Step indicator:** 4 steps shown at top — colored gold when active/complete.
```
[1 Address] → [2 Shipping] → [3 Payment] → [4 Confirm]
```

**Step 1 — Address:**
- For logged-in users: show saved addresses as selectable cards + "Add New" form toggle
- For guests: full address form (name, phone, line1, line2, city dropdown, province dropdown)
- City dropdown options (Pakistan cities): Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Faisalabad, Multan, Sialkot

**Step 2 — Shipping:**
- Radio cards:
  - Standard Delivery (3-5 business days) — PKR 200
  - Express Delivery (1-2 business days) — PKR 500
  - Free (auto-selected when subtotal ≥ PKR 3,000)

**Step 3 — Payment:**
- Radio cards with logos:
  - JazzCash Mobile Wallet — PKR most popular
  - EasyPaisa Account — similar
  - Credit / Debit Card — shows card form on select (Stripe Elements)
  - Cash on Delivery — shows delivery note
  - Bank Transfer — shows account details
- Gift mode toggle: checkbox + gift message textarea + "Hide price from recipient" checkbox

**Step 4 — Confirm:**
- Order summary (read-only): items, address, shipping, payment method
- Total clearly displayed
- "Place Order" button — calls `/api/checkout/create-order`
- Note: "By placing your order you agree to our Terms & Conditions"

**Right sidebar (all steps):** Sticky order summary with items and totals. Updates in real time as shipping method changes.

---

### `/checkout/success` Page

- Large animated checkmark (CSS keyframe, gold)
- "Order Confirmed!" — Playfair Display
- "Thank you, {name}. Your order #{orderNumber} has been placed."
- Order summary card: items count, total, estimated delivery
- "Track Your Order" button → `/track?order={orderNumber}`
- "Continue Shopping" button → `/products`
- WhatsApp share: "Share order on WhatsApp"
- Email notice: "Confirmation sent to {email}"

---

## Full Code Templates

### `src/lib/services/payment/priceValidator.ts`

```typescript
import { db } from '@/lib/db/client'

export async function getValidatedPrice(productId: string): Promise<number> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { basePrice: true, salePrice: true },
  })

  if (!product) throw new Error(`Product ${productId} not found`)

  const now = new Date()

  // Server UTC check — never trust client-sent flash sale data
  const activeSale = await db.flashSale.findFirst({
    where: {
      isActive: true,
      startTime: { lte: now },
      endTime: { gte: now },
      productIds: { has: productId },
    },
  })

  const basePrice = Number(product.basePrice)
  const salePrice = product.salePrice ? Number(product.salePrice) : null

  if (activeSale) {
    return Math.round(basePrice * (1 - activeSale.discountPct / 100) * 100) / 100
  }

  return salePrice ?? basePrice
}

export async function getValidatedCartTotal(
  items: { productId: string; variantId?: string; quantity: number }[]
): Promise<{ subtotal: number; lineItems: { productId: string; validatedPrice: number; quantity: number }[] }> {
  const lineItems = await Promise.all(
    items.map(async item => {
      // Check if variant has a price override
      let unitPrice = await getValidatedPrice(item.productId)

      if (item.variantId) {
        const variant = await db.productVariant.findUnique({
          where: { id: item.variantId },
          select: { price: true },
        })
        if (variant?.price) {
          unitPrice = Number(variant.price)
        }
      }

      return { productId: item.productId, validatedPrice: unitPrice, quantity: item.quantity }
    })
  )

  const subtotal = lineItems.reduce((sum, item) => sum + item.validatedPrice * item.quantity, 0)

  return { subtotal, lineItems }
}
```

### `src/lib/services/payment/jazzcash.ts`

```typescript
import crypto from 'crypto'

interface JazzCashPaymentParams {
  amount: number       // PKR amount (not paisas)
  orderId: string
  description: string
  customerPhone: string
}

export function generateJazzCashHash(fields: Record<string, string>, salt: string): string {
  const sortedValues = Object.keys(fields)
    .sort()
    .map(key => fields[key])
    .join('&')

  return crypto
    .createHmac('sha256', salt)
    .update(`${salt}&${sortedValues}`)
    .digest('hex')
    .toUpperCase()
}

export function buildJazzCashPayload(params: JazzCashPaymentParams): Record<string, string> {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID!
  const password = process.env.JAZZCASH_PASSWORD!
  const salt = process.env.JAZZCASH_INTEGRITY_SALT!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const now = new Date()
  const formatDateTime = (d: Date) =>
    d.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)

  const txnDateTime = formatDateTime(now)
  const expiryDateTime = formatDateTime(new Date(now.getTime() + 60 * 60 * 1000))

  const fields: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: `T${params.orderId}`,
    pp_Amount: String(Math.round(params.amount * 100)), // paisas
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: txnDateTime,
    pp_BillReference: params.orderId,
    pp_Description: params.description.slice(0, 100),
    pp_TxnExpiryDateTime: expiryDateTime,
    pp_ReturnURL: `${appUrl}/api/payments/jazzcash/callback`,
    pp_MobileNumber: params.customerPhone,
  }

  fields.pp_SecureHash = generateJazzCashHash(fields, salt)
  return fields
}
```

### `src/lib/validations/checkout.ts`

```typescript
import { z } from 'zod'

export const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(5, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().min(4),
})

export const createOrderSchema = z.object({
  addressId: z.string().optional(),
  guestAddress: addressSchema.optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express', 'free']),
  paymentMethod: z.enum(['JAZZCASH', 'EASYPAISA', 'CARD', 'COD', 'BANK_TRANSFER']),
  couponCode: z.string().optional(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1).max(10),
  })).min(1, 'Cart cannot be empty'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
```

---

## Tests Required

### `tests/unit/jazzcash-hash.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { generateJazzCashHash, buildJazzCashPayload } from '@/lib/services/payment/jazzcash'

beforeEach(() => {
  process.env.JAZZCASH_MERCHANT_ID = 'MC123456'
  process.env.JAZZCASH_PASSWORD = 'abc123'
  process.env.JAZZCASH_INTEGRITY_SALT = 'testsalt'
  process.env.NEXT_PUBLIC_APP_URL = 'https://mystore.com'
})

describe('JazzCash hash generator', () => {
  it('generates uppercase hex hash', () => {
    const hash = generateJazzCashHash({ pp_Amount: '100000', pp_MerchantID: 'MC123' }, 'salt')
    expect(hash).toMatch(/^[A-F0-9]+$/)
  })

  it('hash changes when payload changes', () => {
    const hash1 = generateJazzCashHash({ pp_Amount: '100000' }, 'salt')
    const hash2 = generateJazzCashHash({ pp_Amount: '200000' }, 'salt')
    expect(hash1).not.toBe(hash2)
  })

  it('builds complete payload with SecureHash', () => {
    const payload = buildJazzCashPayload({
      amount: 1000,
      orderId: 'order_abc123',
      description: 'Test order',
      customerPhone: '03001234567',
    })
    expect(payload.pp_Amount).toBe('100000') // 1000 PKR = 100000 paisas
    expect(payload.pp_SecureHash).toBeDefined()
    expect(payload.pp_TxnRefNo).toBe('Torder_abc123')
    expect(payload.pp_ReturnURL).toContain('/api/payments/jazzcash/callback')
  })
})
```

### `tests/integration/price-validator.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db/client'
import { getValidatedPrice } from '@/lib/services/payment/priceValidator'

describe('Price validator', () => {
  let productId: string
  let categoryId: string

  beforeAll(async () => {
    const category = await db.category.findFirst()
    categoryId = category!.id
    const product = await db.product.create({
      data: {
        name: 'Test Validator Product',
        slug: `test-validator-${Date.now()}`,
        description: 'Test',
        basePrice: 5000,
        sku: `TVP-${Date.now()}`,
        categoryId,
      },
    })
    productId = product.id
  })

  it('returns base price when no sale active', async () => {
    const price = await getValidatedPrice(productId)
    expect(price).toBe(5000)
  })

  it('returns sale price when set and no flash sale', async () => {
    await db.product.update({ where: { id: productId }, data: { salePrice: 4000 } })
    const price = await getValidatedPrice(productId)
    expect(price).toBe(4000)
  })

  it('throws for non-existent product', async () => {
    await expect(getValidatedPrice('fake_id')).rejects.toThrow()
  })

  afterAll(async () => {
    await db.product.delete({ where: { id: productId } })
  })
})
```

---

## Acceptance Criteria

- [ ] `POST /api/checkout/create-order` creates Order + OrderItems + Payment with server-validated prices
- [ ] Client-sent price that differs from server price is silently ignored (server always wins)
- [ ] Flash sale price applied even if client didn't show the sale (server UTC check)
- [ ] JazzCash hash test passes — hash is deterministic
- [ ] JazzCash callback: valid hash + `pp_ResponseCode=000` → Order status CONFIRMED
- [ ] JazzCash callback: tampered hash → request rejected (400/401)
- [ ] COD order: status immediately set to PENDING (confirmed when delivered)
- [ ] Stripe PaymentIntent created with correct PKR amount
- [ ] `/checkout/success` shows order number
- [ ] Checkout step 1 validates address fields (city is required)
- [ ] Cannot checkout with empty cart
- [ ] All unit tests pass

---

## Progress Tracker Updates

```
[2026-04-20] Multi-step checkout (Address → Shipping → Payment → Confirm) — done
[2026-04-20] Guest checkout — done
[2026-04-20] Saved addresses — done
[2026-04-20] JazzCash integration — done
[2026-04-20] EasyPaisa integration — done
[2026-04-20] HBL/Stripe card integration — done
[2026-04-20] COD option — done
[2026-04-20] Bank transfer with manual confirmation — done
[2026-04-20] Payment webhooks → order auto-update — done
```
