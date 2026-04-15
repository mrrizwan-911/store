# DAY 11 — Notifications + Loyalty System

## Overview

**Goal:** Automated email notifications for order lifecycle events, abandoned cart recovery emails (via Vercel Cron), and a complete loyalty points system — earn on purchase, redeem at checkout, tier progression, and history.

**Deliverables:**
- `src/lib/services/email/sender.ts` — retry-logic email sender
- Order confirmation email (triggers on CONFIRMED status)
- Shipped email (triggers on SHIPPED status)
- Delivered email (triggers on DELIVERED status)
- Abandoned cart Cron (`/api/cron/abandoned-cart`)
- `src/lib/services/loyalty/award.ts` — points on order delivery
- `POST /api/loyalty/redeem` — redeem points at checkout
- `GET /api/account/loyalty` — customer loyalty dashboard data
- `/account/loyalty` — loyalty page UI
- Abandoned cart email template
- Order status email templates

**Success Criteria:**
- Order confirmation email sent within 30 seconds of order creation
- Abandoned cart email sent within 75 minutes of cart going idle (cron runs every 15 min)
- No duplicate abandoned cart emails within 24 hours per cart
- Loyalty points awarded on DELIVERED status change
- Points can be redeemed at checkout for discount (100 points = PKR 100)
- Tier updates automatically: BRONZE → SILVER at 500 pts, GOLD at 2000, PLATINUM at 5000

---

## Prerequisites

- Day 1: EmailLog, LoyaltyAccount, LoyaltyEvent models
- Day 9: Order status update endpoint (`PATCH /api/admin/orders/[id]`)
- Day 10: Vercel cron infrastructure (`vercel.json` already has the cron entry)

---

## Setup & Script Tasks

```bash
# Verify Resend is installed
node -e "require('resend'); console.log('Resend OK')"

# Create service directories
mkdir -p src/lib/services/email/templates
mkdir -p src/lib/services/loyalty
mkdir -p src/app/api/loyalty
mkdir -p src/app/api/account/loyalty
mkdir -p "src/app/(store)/account/loyalty"
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/lib/services/email/sender.ts` | CREATE | Retry-logic email dispatcher |
| `src/lib/services/email/orderEmails.ts` | CREATE | Order lifecycle email triggers |
| `src/lib/services/email/templates/orderConfirm.ts` | CREATE | Order confirmation HTML |
| `src/lib/services/email/templates/orderShipped.ts` | CREATE | Shipped notification HTML |
| `src/lib/services/email/templates/orderDelivered.ts` | CREATE | Delivered email HTML |
| `src/lib/services/email/templates/abandonedCart.ts` | CREATE | Abandoned cart HTML |
| `src/app/api/cron/abandoned-cart/route.ts` | CREATE | Abandoned cart cron |
| `src/lib/services/loyalty/award.ts` | CREATE | Award points on order |
| `src/lib/services/loyalty/redeem.ts` | CREATE | Redeem points validation |
| `src/app/api/loyalty/redeem/route.ts` | CREATE | POST — redeem points |
| `src/app/api/account/loyalty/route.ts` | CREATE | GET — loyalty account data |
| `src/app/(store)/account/loyalty/page.tsx` | CREATE | Loyalty page UI |
| `src/components/store/LoyaltyDashboard.tsx` | CREATE | Points + tier + history |
| `src/app/api/admin/orders/[id]/route.ts` | MODIFY | Trigger emails on status change |

---

## Specifications

### `src/lib/services/email/sender.ts`

**Purpose:** Central email dispatcher with retry logic and status tracking.

**Retry behavior:**
- Attempt 1: immediate
- Attempt 2: wait 1 second (exponential: 1000 * 2^0)
- Attempt 3: wait 2 seconds (1000 * 2^1)
- After 3 failures: log as `status: 'failed'`, return false

**Function signature:**
```typescript
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  type: string  // for EmailLog
  userId?: string
}, retryCount?: number): Promise<boolean>
```

**After each attempt (success or final failure):** Create EmailLog entry.

**Important:** Use `setTimeout` for delay between retries. This blocks the request — acceptable since emails are sent in background (after response is sent to client, or in cron).

---

### Order Lifecycle Emails

**Trigger points in `PATCH /api/admin/orders/[id]`:**

```typescript
// After status update in DB:
if (newStatus === 'CONFIRMED') {
  await sendOrderConfirmationEmail(order, user)
}
if (newStatus === 'SHIPPED') {
  await sendOrderShippedEmail(order, user, trackingNumber)
}
if (newStatus === 'DELIVERED') {
  await sendOrderDeliveredEmail(order, user)
  await awardOrderPoints(user.id, Number(order.total), order.id)
}
```

**Email templates — all use the dark luxury theme:**

**Order Confirmation:**
- Subject: `Order Confirmed — #ORD-XXXXX`
- Content: order items table, delivery address, total paid, WhatsApp link
- CTA: "Track your order" button

**Order Shipped:**
- Subject: `Your order is on its way! — #ORD-XXXXX`
- Content: tracking number + courier link, estimated delivery
- CTA: "Track on courier" button

**Order Delivered:**
- Subject: `Your order has arrived — #ORD-XXXXX`
- Content: thank you message, loyalty points earned, review request
- CTA: "Write a review" + "Shop again" buttons

---

### `src/app/api/cron/abandoned-cart/route.ts`

**Auth:** `Authorization: Bearer {CRON_SECRET}`

**Logic:**
1. Find carts that:
   - `lastActiveAt` is between 60 and 75 minutes ago (the 15-min cron window)
   - Have at least one item
   - Belong to a user with an email
2. For each cart: check `EmailLog` — if `abandoned_cart` email sent in last 24 hours → skip
3. Generate email HTML with the first 3 items (images + names + prices)
4. Send via `sendEmail`
5. Return count of emails sent

**Window rationale:** Cron runs every 15 min. Check `60-75 min ago` so each cart is caught exactly once in one cron run. If cron misses a run, the 15-min window ensures no gap.

---

### `src/lib/services/loyalty/award.ts`

**Earning rate:** 1 point per PKR 100 spent (PKR 100 = 1 point, i.e., `POINTS_PER_PKR = 0.01`)

**Tier thresholds (based on `totalEarned`, not current balance):**

| Tier | Min Total Earned |
|------|-----------------|
| BRONZE | 0 |
| SILVER | 500 |
| GOLD | 2,000 |
| PLATINUM | 5,000 |

**Function:** `awardOrderPoints(userId: string, orderTotal: number, orderId: string): Promise<void>`

```
pointsEarned = Math.floor(orderTotal * 0.01)
```

If `pointsEarned === 0` (order total < 100), return early — don't create empty event.

**Steps:**
1. `upsert` LoyaltyAccount (create if doesn't exist)
2. Increment `points` and `totalEarned`
3. Compute new tier from `totalEarned`
4. If tier changed: update `tier` field
5. Create `LoyaltyEvent` with `points: pointsEarned, reason: "Order #orderId"`

---

### `POST /api/loyalty/redeem`

**Auth:** Required

**Request:**
```json
{ "points": 200, "orderId": "order_being_created" }
```

**Validation:**
- User must have a `LoyaltyAccount`
- `points` ≤ `account.points` (can't redeem more than you have)
- `points` must be a multiple of 100 (minimum redeem: 100 points = PKR 100)
- `points` max per order: 500 (max PKR 500 off per order — admin configurable)

**Processing:**
1. Validate
2. Deduct from `account.points`
3. Create `LoyaltyEvent` with `points: -points, reason: "Redeemed at checkout"`
4. Return `{ discountAmount: points }` (1 point = 1 PKR)

**Note:** The actual discount is applied server-side in `create-order` — this endpoint just validates and deducts. Call this AFTER order creation succeeds.

---

### `GET /api/account/loyalty`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 450,
    "tier": "SILVER",
    "totalEarned": 650,
    "nextTier": "GOLD",
    "pointsToNextTier": 1350,
    "progressPct": 7.5,
    "history": [
      { "id": "...", "points": 45, "reason": "Order #ORD-123", "createdAt": "..." },
      { "id": "...", "points": -100, "reason": "Redeemed at checkout", "createdAt": "..." }
    ]
  }
}
```

**Computed fields:**
- `nextTier`: next tier above current
- `pointsToNextTier`: points needed to reach next tier
- `progressPct`: progress from current tier threshold to next (0-100)

---

### Loyalty Page UI (`/account/loyalty`)

**Layout follows account section sidebar from Day 4.**

**Sections:**

1. **Tier badge (top):**
   - Large icon for current tier (Bronze/Silver/Gold/Platinum)
   - Tier name in Playfair Display
   - Badge color: Bronze (brown), Silver (silver), Gold (#E8D5B0), Platinum (blue-white)

2. **Points balance:**
   - Large number: "450 pts"
   - Equivalent: "= PKR 450 in store credit"

3. **Progress to next tier:**
   - Progress bar (Shadcn Progress component, gold fill)
   - "1,350 points to Gold"

4. **How to earn (info cards):**
   - Shopping: 1 point per PKR 100
   - Reviews: +5 points (Day 14 feature)
   - Referrals: +50 points (Day 14 feature)

5. **Redeem section:**
   - Slider: select how many points to redeem (multiples of 100)
   - Shows: "500 pts = PKR 500 off"
   - "Apply to cart" button → calls `/api/loyalty/redeem`

6. **History table:**
   - Date | Reason | Points (+/- colored)
   - Last 20 events

---

## Full Code Templates

### `src/lib/services/email/sender.ts`

```typescript
import { Resend } from 'resend'
import { db } from '@/lib/db/client'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  html: string
  type: string
  userId?: string
}

export async function sendEmail(
  params: SendEmailParams,
  retryCount: number = 0
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: 'store@yourdomain.com',
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    await db.emailLog.create({
      data: { email: params.to, type: params.type, status: 'sent', userId: params.userId, retryCount },
    })

    return true
  } catch (error) {
    console.error(`[EMAIL] Attempt ${retryCount + 1} failed for ${params.type}:`, error)

    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)))
      return sendEmail(params, retryCount + 1)
    }

    // Final failure — log it
    await db.emailLog.create({
      data: { email: params.to, type: params.type, status: 'failed', userId: params.userId, retryCount },
    })

    return false
  }
}
```

### `src/lib/services/loyalty/award.ts`

```typescript
import { db } from '@/lib/db/client'
import { LoyaltyTier } from '@prisma/client'

const POINTS_PER_PKR = 0.01  // PKR 100 = 1 point

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
}

function computeTier(totalEarned: number): LoyaltyTier {
  if (totalEarned >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM'
  if (totalEarned >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (totalEarned >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  return 'BRONZE'
}

export async function awardOrderPoints(
  userId: string,
  orderTotal: number,
  orderId: string
): Promise<void> {
  const pointsEarned = Math.floor(orderTotal * POINTS_PER_PKR)
  if (pointsEarned === 0) return

  // Upsert loyalty account — creates if first time earning
  const account = await db.loyaltyAccount.upsert({
    where: { userId },
    update: {
      points: { increment: pointsEarned },
      totalEarned: { increment: pointsEarned },
    },
    create: {
      userId,
      points: pointsEarned,
      totalEarned: pointsEarned,
    },
  })

  const newTotalEarned = account.totalEarned  // already incremented by upsert
  const newTier = computeTier(newTotalEarned)

  // Update tier if it changed
  if (newTier !== account.tier) {
    await db.loyaltyAccount.update({
      where: { userId },
      data: { tier: newTier },
    })
  }

  await db.loyaltyEvent.create({
    data: {
      accountId: account.id,
      points: pointsEarned,
      reason: `Order #${orderId}`,
    },
  })
}
```

### `src/app/api/cron/abandoned-cart/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { sendEmail } from '@/lib/services/email/sender'
import { abandonedCartTemplate } from '@/lib/services/email/templates/abandonedCart'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const sixtyMinsAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const seventyFiveMinsAgo = new Date(now.getTime() - 75 * 60 * 1000)

  // Carts abandoned 60-75 minutes ago (current cron window)
  const abandonedCarts = await db.cart.findMany({
    where: {
      lastActiveAt: { lt: sixtyMinsAgo, gt: seventyFiveMinsAgo },
      items: { some: {} },  // has at least one item
    },
    include: {
      user: { select: { email: true, name: true, id: true } },
      items: {
        include: {
          product: { select: { name: true, basePrice: true, slug: true,
                                images: { where: { isPrimary: true }, take: 1 } } },
        },
        take: 3,  // show max 3 items in email
      },
    },
  })

  let emailsSent = 0

  for (const cart of abandonedCarts) {
    if (!cart.user?.email) continue

    // Prevent duplicate emails within 24 hours
    const recentEmail = await db.emailLog.findFirst({
      where: {
        email: cart.user.email,
        type: 'abandoned_cart',
        sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    })

    if (recentEmail) continue

    const html = abandonedCartTemplate(cart.user.name, cart.items)

    const sent = await sendEmail({
      to: cart.user.email,
      subject: 'You left something behind 👀',
      html,
      type: 'abandoned_cart',
      userId: cart.userId,
    })

    if (sent) emailsSent++
  }

  return NextResponse.json({ success: true, emailsSent })
}
```

### `src/lib/services/email/templates/abandonedCart.ts`

```typescript
interface CartItem {
  product: { name: string; basePrice: any; slug: string; images: { url: string }[] }
  quantity: number
}

export function abandonedCartTemplate(name: string, items: CartItem[]): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourstore.com'

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #222;">
        <img src="${item.product.images[0]?.url ?? ''}" 
             style="width:60px;height:75px;object-fit:cover;display:inline-block;vertical-align:middle;" />
        <span style="margin-left:12px;color:#F5F5F5;font-size:14px;">${item.product.name}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #222;color:#E8D5B0;text-align:right;">
        PKR ${Number(item.product.basePrice).toLocaleString('en-PK')}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" style="background:#141414;border:1px solid #222;max-width:520px;width:100%;">
        <tr><td style="padding:32px;">
          <h2 style="color:#E8D5B0;font-size:22px;margin:0 0 8px;">You left something behind</h2>
          <p style="color:#888;font-size:14px;margin:0 0 24px;">Hi ${name}, your cart is waiting for you.</p>

          <table width="100%" style="border-collapse:collapse;">
            ${itemRows}
          </table>

          <div style="text-align:center;margin:32px 0;">
            <a href="${appUrl}/cart"
               style="background:#E8D5B0;color:#0A0A0A;padding:14px 32px;text-decoration:none;font-weight:600;display:inline-block;">
              Complete Your Purchase
            </a>
          </div>

          <p style="color:#888;font-size:12px;text-align:center;">
            Items in your cart are not reserved and may sell out.<br/>
            <a href="${appUrl}/unsubscribe" style="color:#888;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}
```

---

## Tests Required

### `tests/integration/loyalty.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db/client'
import { awardOrderPoints } from '@/lib/services/loyalty/award'

describe('Loyalty points system', () => {
  let userId: string

  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `loyalty-${Date.now()}@test.com`, name: 'Test', passwordHash: 'x', isVerified: true },
    })
    userId = user.id
  })

  it('awards points for an order (PKR 5000 = 50 points)', async () => {
    await awardOrderPoints(userId, 5000, 'order_test_1')
    const account = await db.loyaltyAccount.findUnique({ where: { userId } })
    expect(account!.points).toBe(50)
    expect(account!.totalEarned).toBe(50)
    expect(account!.tier).toBe('BRONZE')
  })

  it('accumulates points and upgrades tier to SILVER', async () => {
    // Add enough orders to reach 500 total earned
    await awardOrderPoints(userId, 45000, 'order_test_2')  // 450 more points
    const account = await db.loyaltyAccount.findUnique({ where: { userId } })
    expect(account!.totalEarned).toBeGreaterThanOrEqual(500)
    expect(account!.tier).toBe('SILVER')
  })

  it('creates loyalty event for each award', async () => {
    const events = await db.loyaltyEvent.findMany({
      where: { account: { userId } },
    })
    expect(events.length).toBeGreaterThanOrEqual(2)
  })

  it('skips award for zero-point orders (< PKR 100)', async () => {
    const countBefore = await db.loyaltyEvent.count({ where: { account: { userId } } })
    await awardOrderPoints(userId, 50, 'order_test_tiny')  // 0.5 → floor to 0
    const countAfter = await db.loyaltyEvent.count({ where: { account: { userId } } })
    expect(countAfter).toBe(countBefore)  // no new event
  })

  afterAll(async () => {
    const account = await db.loyaltyAccount.findUnique({ where: { userId } })
    if (account) await db.loyaltyEvent.deleteMany({ where: { accountId: account.id } })
    await db.loyaltyAccount.deleteMany({ where: { userId } })
    await db.user.delete({ where: { id: userId } })
  })
})
```

---

## Acceptance Criteria

- [ ] Order confirmation email arrives within 30s of status → CONFIRMED
- [ ] Shipped email arrives within 30s of status → SHIPPED
- [ ] Abandoned cart cron: carts idle 60-75 min get email within next cron run
- [ ] No duplicate abandoned cart email within 24 hours for same cart
- [ ] Retry: if Resend fails, 3 attempts with backoff, final status logged as 'failed'
- [ ] `awardOrderPoints(userId, 5000, orderId)` → 50 points in account
- [ ] Tier upgrade: going from BRONZE to SILVER updates tier in DB + creates event
- [ ] `GET /api/account/loyalty` returns correct points, tier, progress, history
- [ ] Loyalty page renders tier badge with correct color
- [ ] Points redeem at checkout: deducts from account, creates negative event
- [ ] All integration tests pass

---

## Progress Tracker Updates

```
[2026-04-25] Order confirmation / shipped / delivered emails (auto-trigger) — done
[2026-04-25] Abandoned cart recovery email (cron, retry logic, status tracking) — done
[2026-04-25] Loyalty points — earn on purchase — done
[2026-04-25] Loyalty points — redeem at checkout — done
[2026-04-25] Tier system (Bronze → Silver → Gold → Platinum) — done
```
