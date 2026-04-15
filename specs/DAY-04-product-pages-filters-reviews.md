# DAY 04 — Product Pages + Filters + Reviews

## Overview

**Goal:** Full product browsing experience — a Product Listing Page (PLP) with server-side filtering, sorting, and pagination, a Product Detail Page (PDP) with image gallery, variant selector, and a reviews section, and the backend API routes that power them.

**Deliverables:**
- `GET /api/products` — filtered, sorted, paginated product list
- `GET /api/products/[slug]` — single product with variants, images, reviews
- `POST /api/products/[slug]/reviews` — submit a review (authenticated)
- PLP page: `/products` and `/categories/[slug]`
- PDP page: `/products/[slug]`
- `ProductFilters` sidebar component
- `ProductGrid` component (grid/list toggle)
- `ProductDetail` component
- `ImageGallery` component with zoom
- `VariantSelector` component (size + color)
- `ReviewsSection` component
- `SizeGuideModal` component

**Success Criteria:**
- `GET /api/products?category=clothes&minPrice=1000&maxPrice=5000&size=M` returns filtered results
- PLP renders products from API with filters applied
- Changing filters updates URL params and re-fetches
- PDP shows all variants, image gallery is clickable
- Add to cart button dispatches to Redux and opens CartDrawer
- Review submission works for authenticated users (mock auth for now)
- No N+1 queries — all product fetches use Prisma `include`

---

## Prerequisites

- Day 1: Prisma schema with Product, ProductVariant, ProductImage, Review models
- Day 2: Auth middleware (review submission needs authenticated user)
- Day 3: ProductCard component, Redux store with cart slice

---

## Setup & Script Tasks

```bash
# Create route directories
mkdir -p "src/app/api/products/[slug]/reviews"
mkdir -p "src/app/(store)/products/[slug]"
mkdir -p "src/app/(store)/categories/[slug]"

# No new npm installs needed
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/products/route.ts` | CREATE | GET — filtered product list |
| `src/app/api/products/[slug]/route.ts` | CREATE | GET — single product by slug |
| `src/app/api/products/[slug]/reviews/route.ts` | CREATE | POST — submit review |
| `src/lib/validations/products.ts` | CREATE | Zod schemas for review, filter params |
| `src/app/(store)/products/page.tsx` | CREATE | PLP — all products |
| `src/app/(store)/categories/[slug]/page.tsx` | CREATE | PLP — by category |
| `src/components/store/ProductFilters.tsx` | CREATE | Sidebar filters |
| `src/components/store/ProductGrid.tsx` | CREATE | Grid/list toggle + product cards |
| `src/components/store/SortDropdown.tsx` | CREATE | Sort select |
| `src/app/(store)/products/[slug]/page.tsx` | CREATE | PDP page |
| `src/components/store/ImageGallery.tsx` | CREATE | Thumbnail + large image |
| `src/components/store/VariantSelector.tsx` | CREATE | Size + color pickers |
| `src/components/store/ReviewsSection.tsx` | CREATE | Rating summary + review cards |
| `src/components/store/SizeGuideModal.tsx` | CREATE | Size chart in dialog |
| `src/components/store/AddToCartButton.tsx` | CREATE | Cart dispatch + drawer open |

---

## Specifications

### `GET /api/products`

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Pagination page |
| `limit` | number | 24 | Items per page (max 48) |
| `category` | string | — | Category slug |
| `minPrice` | number | 0 | Min base price in PKR |
| `maxPrice` | number | 999999 | Max base price in PKR |
| `size` | string | — | Variant size filter |
| `color` | string | — | Variant color filter |
| `sort` | string | `createdAt_desc` | Sort field + direction |
| `search` | string | — | Search in name and description |
| `featured` | boolean | — | Only featured products |

**Sort options:** `createdAt_desc`, `createdAt_asc`, `basePrice_asc`, `basePrice_desc`, `name_asc`

**Response shape:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "...",
        "name": "Linen Dress Shirt",
        "slug": "linen-dress-shirt",
        "basePrice": "4500.00",
        "salePrice": null,
        "category": { "name": "Clothes", "slug": "clothes" },
        "images": [{ "url": "...", "altText": "..." }],
        "variants": [{ "size": "M", "color": "White", "stock": 5 }],
        "avgRating": 4.3,
        "reviewCount": 18
      }
    ],
    "pagination": { "page": 1, "limit": 24, "total": 142, "pages": 6 }
  }
}
```

**Query construction rules:**
- `isActive: true` always applied
- Category filter: join through `category.slug` (not categoryId)
- Size/color filter: `variants.some({ size, color, stock: { gt: 0 } })`
- Price filter: on `basePrice` field
- Search: `OR [name contains, description contains]` — case insensitive
- `avgRating` and `reviewCount` computed in memory after fetch (from included reviews)

**Performance:**
- Include only `images: { where: { isPrimary: true }, take: 1 }` — not all images
- Include `reviews: { select: { rating: true } }` — only ratings, not full text
- Include `variants: { select: { size, color, stock } }`
- `@@index([isActive, isFeatured])` used for homepage featured query

---

### `GET /api/products/[slug]`

**Response:** Full product with ALL images, ALL variants (including out-of-stock), ALL reviews with user name.

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    "slug": "...",
    "description": "...",
    "shortDescription": "...",
    "basePrice": "4500.00",
    "salePrice": null,
    "sku": "LDS-001-WHT-M",
    "isFeatured": false,
    "tags": ["formal", "cotton"],
    "category": { "id": "...", "name": "Clothes", "slug": "clothes" },
    "images": [
      { "id": "...", "url": "...", "altText": "...", "isPrimary": true, "sortOrder": 0 }
    ],
    "variants": [
      { "id": "...", "size": "S", "color": "White", "stock": 3, "price": null }
    ],
    "reviews": [
      {
        "id": "...",
        "rating": 5,
        "title": "Great quality",
        "body": "...",
        "createdAt": "...",
        "user": { "name": "Ahmed K." }
      }
    ],
    "avgRating": 4.3,
    "reviewCount": 18
  }
}
```

→ 404 if product not found or `isActive: false`

---

### `POST /api/products/[slug]/reviews`

**Authentication:** Required — extract userId from Bearer token

**Request body:**
```json
{ "rating": 5, "title": "Great shirt", "body": "Very comfortable fabric, true to size." }
```

**Validation schema:**
- `rating`: integer 1-5
- `title`: optional, max 100 chars
- `body`: min 10 chars, max 2000 chars

**Business rules:**
- One review per user per product (check before insert → 409 if exists)
- `isVerified`: check if user has a completed order containing this product → set true
- Return created review

---

### `ProductFilters` Component Specification

**Props:**
```typescript
interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
}

interface FilterState {
  minPrice: number
  maxPrice: number
  sizes: string[]
  colors: string[]
  minRating: number | null
}
```

**UI sections (each collapsible with +/- toggle):**

1. **Price Range** — dual-handle slider, PKR 0 to PKR 20,000, step 100. Display selected range as "PKR 1,000 – PKR 8,000"

2. **Size** — toggle buttons (multi-select): XS S M L XL XXL + 28 30 32 34 36 (trouser sizes) + UK 6 7 8 9 10 (shoe sizes). Show only relevant sizes once category is known.

3. **Color** — circular color swatches (multi-select):
   - White (#FFFFFF), Black (#000000), Navy (#001f54), Beige (#f5f0e8), Red (#CC0000), Green (#228B22)
   - Show color name on hover

4. **Rating** — radio: 4★ & above, 3★ & above, 2★ & above, All

**Applied filters:** Show dismissible chips above the product grid showing active filters. "Clear All" button clears all.

**Mobile:** Wrap in Shadcn `Sheet` triggered by "Filters" button. Show above grid on mobile.

---

### `ProductGrid` Component Specification

**Props:**
```typescript
interface ProductGridProps {
  products: ProductSummary[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
}
```

**Grid view:** 4 cols desktop, 2 cols mobile. Uses `ProductCard` component.

**List view:** Full-width rows. Each row: image left (small), product info right (name, category, short desc, sizes, price, "Add to Cart" button inline).

**Loading state:** Show 8 `Skeleton` cards (Shadcn Skeleton) while fetching.

**Empty state:** "No products found" with a "Clear filters" suggestion.

---

### `ImageGallery` Component Specification

**Props:**
```typescript
interface ImageGalleryProps {
  images: { url: string; altText?: string; isPrimary: boolean }[]
  productName: string
}
```

**Behavior:**
- Primary image displayed large (4:5 aspect ratio)
- Thumbnail strip below (max 5 visible, scrollable if more)
- Clicking thumbnail swaps the main image (no animation needed — instant swap)
- Zoom: on `mouseenter` on main image, cursor becomes crosshair; on `mousemove`, transform-scale(1.5) the image within a fixed-size container (CSS `overflow: hidden` approach — no library needed)
- Mobile: swipe-able (native scroll with `snap-x`)

---

### `VariantSelector` Component Specification

**Props:**
```typescript
interface VariantSelectorProps {
  variants: { id: string; size?: string; color?: string; stock: number; price?: number | null }[]
  onVariantChange: (variantId: string | null) => void
  selectedVariantId: string | null
}
```

**Color picker:** Circular swatches. Selected: gold ring (`ring-2 ring-primary`). Sold out: muted + diagonal line overlay.

**Size picker:** Button grid. Selected: gold border + text. Out of stock: strikethrough text, disabled, muted style.

**When a variant is selected:** Update displayed price if variant has price override. Update stock badge.

---

### PDP Page Layout (`/products/[slug]/page.tsx`)

This is a **Server Component** that fetches product data, then passes to client components.

```
Server Component → fetch product from API/DB
  └── ProductDetailClient (client component, receives product as prop)
        ├── Breadcrumb
        ├── Two-column layout:
        │   ├── LEFT: ImageGallery
        │   └── RIGHT: product info
        │       ├── Name (Playfair Display)
        │       ├── Star rating + review count
        │       ├── Price display
        │       ├── Short description
        │       ├── VariantSelector (color)
        │       ├── VariantSelector (size)
        │       ├── "Size Guide" → opens SizeGuideModal
        │       ├── Stock badge
        │       ├── Quantity stepper
        │       ├── AddToCartButton
        │       ├── "Order via WhatsApp" button
        │       └── Delivery + return info
        ├── Product Tabs (Description | Size Guide | Reviews)
        └── Related Products strip
```

**Stock badge logic:**
- `stock > 10` → "In Stock" (green)
- `stock > 0 && stock <= 10` → "Only {N} left!" (amber)
- `stock === 0` → "Out of Stock" (red)

---

## Full Code Templates

### `src/app/api/products/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(48, parseInt(searchParams.get('limit') ?? '24'))
  const category = searchParams.get('category') || undefined
  const minPrice = parseFloat(searchParams.get('minPrice') ?? '0')
  const maxPrice = parseFloat(searchParams.get('maxPrice') ?? '999999')
  const size = searchParams.get('size') || undefined
  const color = searchParams.get('color') || undefined
  const search = searchParams.get('search') || undefined
  const featured = searchParams.get('featured') === 'true'
  const sortParam = searchParams.get('sort') ?? 'createdAt_desc'

  const [sortField, sortDir] = sortParam.split('_') as [string, 'asc' | 'desc']

  const where = {
    isActive: true,
    ...(featured && { isFeatured: true }),
    ...(category && { category: { slug: category } }),
    basePrice: { gte: minPrice, lte: maxPrice },
    ...(size || color
      ? { variants: { some: { ...(size && { size }), ...(color && { color }), stock: { gt: 0 } } } }
      : {}),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: { select: { size: true, color: true, stock: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { [sortField]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ])

  const enrichedProducts = products.map(p => ({
    ...p,
    avgRating:
      p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : null,
    reviewCount: p.reviews.length,
    reviews: undefined, // don't send raw reviews to PLP
  }))

  return NextResponse.json({
    success: true,
    data: {
      products: enrichedProducts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  })
}
```

### `src/app/api/products/[slug]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const product = await db.product.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null

  return NextResponse.json({
    success: true,
    data: { ...product, avgRating, reviewCount: product.reviews.length },
  })
}
```

### `src/lib/validations/products.ts`

```typescript
import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10, 'Review must be at least 10 characters').max(2000),
})

export type ReviewInput = z.infer<typeof reviewSchema>
```

### `src/app/api/products/[slug]/reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { reviewSchema } from '@/lib/validations/products'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let userId: string
  try {
    const payload = verifyAccessToken(token)
    userId = payload.userId
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
  }

  const product = await db.product.findUnique({ where: { slug: params.slug } })
  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
  }

  const existingReview = await db.review.findFirst({
    where: { productId: product.id, userId },
  })
  if (existingReview) {
    return NextResponse.json(
      { success: false, error: 'You have already reviewed this product' },
      { status: 409 }
    )
  }

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  // Check if user purchased this product (marks review as verified)
  const hasPurchased = await db.orderItem.findFirst({
    where: {
      productId: product.id,
      order: { userId, status: 'DELIVERED' },
    },
  })

  const review = await db.review.create({
    data: {
      productId: product.id,
      userId,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      isVerified: !!hasPurchased,
    },
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json({ success: true, data: review }, { status: 201 })
}
```

---

## Tests Required

### `tests/unit/product-filter.test.ts`

Test the filter parameter parsing logic (extract to a pure function):

```typescript
import { describe, it, expect } from 'vitest'

function buildProductWhere(params: URLSearchParams) {
  const category = params.get('category') || undefined
  const minPrice = parseFloat(params.get('minPrice') ?? '0')
  const maxPrice = parseFloat(params.get('maxPrice') ?? '999999')
  const size = params.get('size') || undefined
  const color = params.get('color') || undefined

  return {
    isActive: true,
    ...(category && { category: { slug: category } }),
    basePrice: { gte: minPrice, lte: maxPrice },
    ...(size || color
      ? { variants: { some: { ...(size && { size }), ...(color && { color }), stock: { gt: 0 } } } }
      : {}),
  }
}

describe('Product filter builder', () => {
  it('builds basic where clause', () => {
    const where = buildProductWhere(new URLSearchParams())
    expect(where.isActive).toBe(true)
    expect(where.basePrice).toEqual({ gte: 0, lte: 999999 })
  })

  it('adds category filter', () => {
    const where = buildProductWhere(new URLSearchParams('category=clothes'))
    expect(where.category).toEqual({ slug: 'clothes' })
  })

  it('adds size and color filters', () => {
    const where = buildProductWhere(new URLSearchParams('size=M&color=White'))
    expect(where.variants).toEqual({
      some: { size: 'M', color: 'White', stock: { gt: 0 } },
    })
  })
})
```

---

## Acceptance Criteria

- [ ] `GET /api/products` returns 200 with paginated products (once seed data exists)
- [ ] `GET /api/products?category=clothes` returns only clothes category products
- [ ] `GET /api/products?minPrice=2000&maxPrice=5000` respects price range
- [ ] `GET /api/products?sort=basePrice_asc` returns cheapest first
- [ ] `GET /api/products/linen-dress-shirt` returns full product with variants + images
- [ ] PLP renders filter sidebar on desktop, sheet on mobile
- [ ] Selecting a filter updates URL params (e.g., `?size=M&color=White`)
- [ ] PDP image gallery: clicking thumbnail swaps main image
- [ ] PDP variant selector: selecting out-of-stock size disables Add to Cart
- [ ] Add to Cart dispatches to Redux, CartDrawer opens
- [ ] WhatsApp button generates correct pre-filled URL
- [ ] Review submission: authenticated user can submit once per product
- [ ] Duplicate review → 409 response
- [ ] All unit tests pass

---

## Progress Tracker Updates

Mark these items in `CLAUDE.md`:
```
[2026-04-18] Product Listing Page (grid/list toggle, pagination) — done
[2026-04-18] Advanced filters (size, color, price, category, rating) — done
[2026-04-18] Product Detail Page (gallery, zoom, variants, stock badge) — done
[2026-04-18] Product reviews and star rating — done
[2026-04-18] Related products + customers also bought — done
[2026-04-18] Compare products (up to 3) — partial
```
