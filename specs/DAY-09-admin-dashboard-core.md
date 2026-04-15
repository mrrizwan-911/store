# DAY 09 — Admin Dashboard Core (Analytics + Orders + Customers)

## Overview

**Goal:** The core admin dashboard — revenue analytics with real-time KPIs and charts, order management with status updates, customer list with LTV tracking, and the admin layout shell. All admin routes are protected by auth middleware (ADMIN role only).

**Deliverables:**
- `/admin` → redirects to `/admin/analytics`
- `/admin/analytics` — Revenue KPIs, charts, top products, payment breakdown
- `/admin/orders` — filterable order list
- `/admin/orders/[id]` — order detail with status updater + tracking number
- `/admin/customers` — customer list with LTV
- `/admin/customers/[id]` — customer profile + purchase history
- `GET /api/admin/analytics/revenue` — revenue aggregates
- `GET /api/admin/analytics/orders-by-status` — status breakdown
- `GET /api/admin/analytics/top-products` — top sellers
- `GET /api/admin/orders` — paginated + filtered order list
- `PATCH /api/admin/orders/[id]` — update order status + tracking number
- `GET /api/admin/customers` — customer list with total spend
- Admin sidebar navigation component

**Success Criteria:**
- Admin layout shows sidebar with all 14 nav items
- Analytics page loads with real numbers from DB (zero if no orders yet)
- Order status can be updated from admin panel
- Customer LTV (total spent) calculated and displayed
- All admin routes reject non-admin users with 403
- Charts render (Recharts library) without errors

---

## Prerequisites

- Day 1: Order, Payment, User, Product models in schema
- Day 2: Auth middleware + role check
- Day 6: Checkout flow creates real orders

---

## Setup & Script Tasks

```bash
# Chart library
npm install recharts

# Create admin route directories
mkdir -p "src/app/(admin)/admin"
mkdir -p src/app/api/admin/{analytics,orders,customers}
mkdir -p "src/app/api/admin/analytics/revenue"
mkdir -p "src/app/api/admin/analytics/orders-by-status"
mkdir -p "src/app/api/admin/analytics/top-products"
mkdir -p "src/app/api/admin/orders/[id]"
mkdir -p "src/app/api/admin/customers/[id]"
mkdir -p "src/app/(admin)/admin/orders/[id]"
mkdir -p "src/app/(admin)/admin/customers/[id]"
mkdir -p src/components/admin
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/app/(admin)/admin/layout.tsx` | CREATE | Admin layout with sidebar |
| `src/app/(admin)/admin/page.tsx` | CREATE | Redirect to /admin/analytics |
| `src/app/(admin)/admin/analytics/page.tsx` | CREATE | Analytics dashboard page |
| `src/app/(admin)/admin/orders/page.tsx` | CREATE | Orders list page |
| `src/app/(admin)/admin/orders/[id]/page.tsx` | CREATE | Order detail page |
| `src/app/(admin)/admin/customers/page.tsx` | CREATE | Customer list page |
| `src/app/(admin)/admin/customers/[id]/page.tsx` | CREATE | Customer profile page |
| `src/components/admin/AdminSidebar.tsx` | CREATE | Admin sidebar navigation |
| `src/components/admin/KpiCard.tsx` | CREATE | Reusable KPI metric card |
| `src/components/admin/RevenueChart.tsx` | CREATE | Line chart (30-day revenue) |
| `src/components/admin/OrderStatusChart.tsx` | CREATE | Donut chart for order status |
| `src/components/admin/PaymentMethodChart.tsx` | CREATE | Bar chart for payment methods |
| `src/components/admin/OrderStatusUpdater.tsx` | CREATE | Dropdown + update button |
| `src/app/api/admin/analytics/revenue/route.ts` | CREATE | Revenue KPI aggregates |
| `src/app/api/admin/analytics/orders-by-status/route.ts` | CREATE | Status distribution |
| `src/app/api/admin/analytics/top-products/route.ts` | CREATE | Top selling products |
| `src/app/api/admin/orders/route.ts` | CREATE | Paginated order list |
| `src/app/api/admin/orders/[id]/route.ts` | CREATE | GET order + PATCH update |
| `src/app/api/admin/customers/route.ts` | CREATE | Customer list + LTV |
| `src/app/api/admin/customers/[id]/route.ts` | CREATE | Customer profile |
| `src/lib/utils/adminAuth.ts` | CREATE | Admin auth guard helper |

---

## Specifications

### Admin Layout (`src/app/(admin)/admin/layout.tsx`)

**Structure:**
```
<div class="flex h-screen bg-background overflow-hidden">
  <AdminSidebar />           {/* fixed left, 240px */}
  <main class="flex-1 overflow-y-auto ml-60">
    {children}
  </main>
</div>
```

**Auth check:** Server component — read token from headers/cookies and verify ADMIN role. If not admin, `redirect('/login')`.

---

### `AdminSidebar` Component

**Always visible on desktop, Sheet on mobile.**

**Nav sections:**
| Icon | Label | Route |
|------|-------|-------|
| BarChart2 | Analytics | /admin/analytics |
| Package | Products | /admin/products |
| ShoppingBag | Orders | /admin/orders |
| Users | Customers | /admin/customers |
| FileText | Quotations | /admin/quotations |
| Archive | Inventory | /admin/inventory |
| Tag | Coupons | /admin/coupons |
| Zap | Flash Sales | /admin/flash-sales |
| Shirt | Outfits | /admin/outfits |
| Star | Loyalty | /admin/loyalty |
| Mail | Notifications | /admin/notifications |
| Settings | Settings | /admin/settings |

**Active state:** Gold left border (border-l-2 border-primary) + slightly lighter bg.

**Bottom:** Admin user avatar + name + logout button.

---

### `GET /api/admin/analytics/revenue`

**Auth:** Required, ADMIN only

**Admin auth guard helper:**
```typescript
// src/lib/utils/adminAuth.ts
export async function requireAdmin(req: NextRequest): Promise<string | NextResponse> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const payload = verifyAccessToken(token)
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return payload.userId
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
```

**Query:**
```typescript
const now = new Date()
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const startOfYear = new Date(now.getFullYear(), 0, 1)

// Run 4 queries in parallel
const [todayStats, monthStats, ytdStats, byPaymentMethod] = await Promise.all([
  db.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: startOfToday } }, _sum: { amount: true }, _count: true }),
  db.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } }, _sum: { amount: true }, _count: true }),
  db.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: startOfYear } }, _sum: { amount: true }, _count: true }),
  db.payment.groupBy({ by: ['method'], where: { status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
])
```

**Response:**
```json
{
  "success": true,
  "data": {
    "today": { "revenue": 84500, "orders": 12 },
    "thisMonth": { "revenue": 2400000, "orders": 287 },
    "ytd": { "revenue": 18700000, "orders": 2140 },
    "activeOrders": 47,
    "byPaymentMethod": [
      { "method": "JAZZCASH", "revenue": 980000, "count": 87 },
      { "method": "COD", "revenue": 750000, "count": 120 }
    ]
  }
}
```

---

### `GET /api/admin/analytics/orders-by-status`

```typescript
const statusCounts = await db.order.groupBy({
  by: ['status'],
  _count: true,
})
```

Returns array of `{ status, count }` for donut chart.

---

### `GET /api/admin/analytics/top-products`

**Top 10 products by units sold (last 30 days):**

```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

const topProducts = await db.orderItem.groupBy({
  by: ['productId'],
  where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } } },
  _sum: { quantity: true },
  _count: true,
  orderBy: { _sum: { quantity: 'desc' } },
  take: 10,
})

// Then fetch product names for the IDs
```

---

### `GET /api/admin/orders`

**Query params:**
- `page`, `limit` (default 20)
- `status` — filter by OrderStatus enum value
- `search` — search by orderNumber or customer name/email
- `paymentMethod` — filter by PaymentMethod
- `dateFrom`, `dateTo` — date range

**Response includes:** Order + user (name, email) + payment status + item count.

---

### `PATCH /api/admin/orders/[id]`

**Auth:** ADMIN

**Request body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "TCS-9384729",
  "notes": "Dispatched via TCS overnight"
}
```

**Allowed status transitions:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
Any status → CANCELLED (admin can cancel)
Any status → REFUNDED (admin can refund)
```

On status change to `DELIVERED`: trigger loyalty points award (import `awardOrderPoints` from Day 11 — for now just update status).

On status change to `SHIPPED`: queue tracking email (Day 11).

---

### `GET /api/admin/customers`

**Query params:** `page`, `limit`, `search` (name/email), `tier` (loyalty tier)

**Response:** User list with total spend (LTV), order count, loyalty tier.

```sql
-- Equivalent Prisma query:
db.user.findMany({
  include: {
    orders: {
      select: { total: true },
      where: { status: { not: 'CANCELLED' } }
    },
    loyalty: { select: { tier: true, points: true } }
  }
})
// Compute LTV = sum of order totals
```

---

### Analytics Dashboard UI

**KPI Cards row (4 cards):**
Each `KpiCard` shows:
- Label (e.g., "Today's Revenue")
- Value (e.g., "PKR 84,500")
- Trend: ▲12% or ▼5% (compare with yesterday/last month)
- Trend color: green for up, red for down

**RevenueChart:**
- Line chart, x-axis = last 30 days, y-axis = revenue in PKR
- Gold line on dark background
- Hover tooltip: shows date + PKR amount
- Tabs to switch: 7D / 30D / 90D / YTD
- Each tab triggers a different API query (pass `period` param)

**For the 30-day data:** Query by `createdAt` date, group by date:
```typescript
// Use raw query for date grouping — one of the few acceptable exceptions
const dailyRevenue = await db.$queryRaw`
  SELECT DATE(paid_at) as date, SUM(amount) as revenue
  FROM "Payment"
  WHERE status = 'COMPLETED'
    AND paid_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(paid_at)
  ORDER BY date ASC
`
```

---

## Full Code Templates

### `src/app/api/admin/analytics/revenue/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [todayStats, monthStats, ytdStats, byPaymentMethod, activeOrders] = await Promise.all([
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfToday } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfYear } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.groupBy({
      by: ['method'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    }),
    db.order.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] } },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      today: { revenue: Number(todayStats._sum.amount ?? 0), orders: todayStats._count },
      thisMonth: { revenue: Number(monthStats._sum.amount ?? 0), orders: monthStats._count },
      ytd: { revenue: Number(ytdStats._sum.amount ?? 0), orders: ytdStats._count },
      activeOrders,
      byPaymentMethod: byPaymentMethod.map(m => ({
        method: m.method,
        revenue: Number(m._sum.amount ?? 0),
        count: m._count,
      })),
    },
  })
}
```

### `src/components/admin/KpiCard.tsx`

```tsx
interface KpiCardProps {
  label: string
  value: string
  trend?: { pct: number; label: string }
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  const trendPositive = (trend?.pct ?? 0) >= 0

  return (
    <div className="bg-surface border border-border p-6">
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary font-display">{value}</p>
      {trend && (
        <p className={`text-xs mt-2 ${trendPositive ? 'text-success' : 'text-error'}`}>
          {trendPositive ? '▲' : '▼'} {Math.abs(trend.pct)}% {trend.label}
        </p>
      )}
    </div>
  )
}
```

---

## Tests Required

### `tests/integration/analytics.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db/client'

describe('Revenue analytics aggregation', () => {
  let userId: string
  let orderId: string
  let productId: string

  beforeAll(async () => {
    const category = await db.category.findFirst()
    const product = await db.product.create({
      data: {
        name: 'Analytics Test Product',
        slug: `analytics-test-${Date.now()}`,
        description: 'Test',
        basePrice: 3000,
        sku: `ATP-${Date.now()}`,
        categoryId: category!.id,
      },
    })
    productId = product.id

    const user = await db.user.create({
      data: { email: `analytics-${Date.now()}@test.com`, name: 'Test', passwordHash: 'x', isVerified: true },
    })
    userId = user.id

    const order = await db.order.create({
      data: {
        userId,
        subtotal: 3000,
        total: 3200,
        shippingCost: 200,
        items: { create: [{ productId, quantity: 1, price: 3000 }] },
      },
    })
    orderId = order.id

    // Create completed payment for this order
    await db.payment.create({
      data: {
        orderId,
        method: 'COD',
        status: 'COMPLETED',
        amount: 3200,
        paidAt: new Date(),
      },
    })
  })

  it('today revenue includes newly created payment', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const result = await db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: today } },
      _sum: { amount: true },
    })
    expect(Number(result._sum.amount)).toBeGreaterThanOrEqual(3200)
  })

  afterAll(async () => {
    await db.payment.deleteMany({ where: { orderId } })
    await db.order.deleteMany({ where: { id: orderId } })
    await db.product.delete({ where: { id: productId } })
    await db.user.delete({ where: { id: userId } })
  })
})
```

---

## Acceptance Criteria

- [ ] Non-admin visiting `/admin` → redirected to `/login`
- [ ] Non-admin calling admin API → 403 response
- [ ] Analytics page shows 4 KPI cards with numbers from DB
- [ ] Revenue chart renders (flat if no orders — just empty chart)
- [ ] Orders list shows all orders with status badges
- [ ] Order detail page shows order items, address, payment method
- [ ] Updating order status from admin reflects immediately in DB
- [ ] Tracking number saved and displayed on customer `/account/orders/[id]`
- [ ] Customer list shows total LTV (PKR sum of completed orders)
- [ ] Customer profile shows complete order history
- [ ] All integration tests pass

---

## Progress Tracker Updates

```
[2026-04-23] Revenue KPIs (today, month, YTD) — done
[2026-04-23] Orders by status with trend charts — done
[2026-04-23] Top-selling products per category — done
[2026-04-23] Payment method breakdown — done
[2026-04-23] Order list with filters + detail view — done
[2026-04-23] Customer list with LTV tracking — done
```
