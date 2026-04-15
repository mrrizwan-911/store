# DAY 03 — Storefront UI Shell (Navbar + Homepage + Redux Store)

## Overview

**Goal:** The visual shell of the storefront — a sticky mega-menu navbar, a full homepage with hero banner, category tiles, featured products grid, new arrivals strip, lookbook teaser, and newsletter section. Redux store initialized with cart, auth, and wishlist slices. All components use the Minimal Luxury Dark design system.

**Deliverables:**
- Redux store configured with 3 slices: cart, auth, wishlist
- `Navbar` component with mega-menu dropdowns on hover
- `Homepage` page assembled from section components
- `HeroBanner` component
- `CategoryTiles` component (4 tiles)
- `ProductCard` component (reusable across the whole app)
- `FeaturedProducts` section (4-col grid)
- `NewArrivalsStrip` (horizontal scroll)
- `LookbookTeaser` section
- `NewsletterSection`
- `Footer` component
- `CartDrawer` slide-out component
- `AnnouncementBar` component
- Redux Provider wired into root layout

**Success Criteria:**
- `npm run dev` → homepage renders at `http://localhost:3000`
- Navbar hover opens subcategory dropdown
- Cart icon shows item count from Redux state
- CartDrawer slides in from right when cart icon clicked
- All 4 category tiles visible
- Featured products grid renders (mock data)
- Newsletter input is functional (no backend yet — just UI state)
- Mobile menu works (hamburger → slide-out drawer)
- No TypeScript errors
- Lighthouse accessibility score ≥ 80 on homepage

---

## Prerequisites

- Day 1 complete: Next.js, Tailwind, Shadcn installed; design tokens in `tailwind.config.ts`
- Day 2 complete: Auth middleware in place (won't block homepage — it's public)
- Google Fonts loaded in `layout.tsx`

---

## Setup & Script Tasks

```bash
# Install Redux Toolkit + React Redux (if not installed on Day 1)
npm install @reduxjs/toolkit react-redux

# Install additional UI packages
npm install lucide-react
npm install next-themes   # for dark mode persistence

# Verify Shadcn components are installed
ls src/components/ui/  # should show button.tsx, input.tsx, card.tsx, sheet.tsx, etc.

# Create component directories
mkdir -p src/components/store
mkdir -p src/components/shared
mkdir -p src/store/slices

# Create page directories
mkdir -p "src/app/(store)"
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/store/index.ts` | CREATE | Redux store configuration |
| `src/store/hooks.ts` | CREATE | Typed useAppSelector / useAppDispatch |
| `src/store/slices/cartSlice.ts` | CREATE | Cart state + actions |
| `src/store/slices/authSlice.ts` | CREATE | Auth state (user, token) |
| `src/store/slices/wishlistSlice.ts` | CREATE | Wishlist product IDs |
| `src/components/shared/ReduxProvider.tsx` | CREATE | Client-side Redux Provider wrapper |
| `src/app/layout.tsx` | MODIFY | Wrap with ReduxProvider |
| `src/components/store/Navbar.tsx` | CREATE | Sticky navbar with mega-menu |
| `src/components/store/AnnouncementBar.tsx` | CREATE | Top strip banner |
| `src/components/store/CartDrawer.tsx` | CREATE | Slide-out cart panel |
| `src/components/store/Footer.tsx` | CREATE | 4-column footer |
| `src/components/store/HeroBanner.tsx` | CREATE | Full-width hero section |
| `src/components/store/CategoryTiles.tsx` | CREATE | 4-tile category row |
| `src/components/store/ProductCard.tsx` | CREATE | Reusable product card |
| `src/components/store/FeaturedProducts.tsx` | CREATE | Featured grid section |
| `src/components/store/NewArrivalsStrip.tsx` | CREATE | Horizontal scroll row |
| `src/components/store/LookbookTeaser.tsx` | CREATE | Editorial lookbook preview |
| `src/components/store/NewsletterSection.tsx` | CREATE | Email capture section |
| `src/app/(store)/page.tsx` | CREATE | Homepage — assembles all sections |
| `src/app/(store)/layout.tsx` | CREATE | Store layout with Navbar + Footer |

---

## Specifications

### Design System Constraints

All components MUST follow the SCREENS.md "Minimal Luxury Dark" theme:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A0A` | Page backgrounds |
| Surface | `#141414` | Cards, panels, drawers |
| Border | `#222222` | All borders |
| Primary | `#E8D5B0` | CTAs, active states, prices |
| Primary hover | `#F5E6C8` | Button hover |
| Accent | `#C9A96E` | Badges, highlights |
| Text primary | `#F5F5F5` | Headings, body |
| Text secondary | `#888888` | Subtitles, labels |
| Font display | Playfair Display | All `<h1>`, `<h2>`, product names |
| Font body | DM Sans | All UI text, buttons, inputs |
| Button corners | `rounded-none` | Sharp corners always |
| Card style | bg surface + border, no shadow | |

---

### Redux Store Architecture

**`src/store/slices/cartSlice.ts`**

State shape:
```typescript
interface CartItem {
  productId: string
  variantId?: string
  name: string
  price: number       // in PKR, as number
  quantity: number
  imageUrl: string
  size?: string
  color?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean     // controls CartDrawer visibility
}
```

Actions:
| Action | Payload | Behavior |
|--------|---------|----------|
| `addItem` | CartItem | If same productId+variantId exists, increment quantity; else push new item |
| `removeItem` | `{productId, variantId?}` | Filter out matching item |
| `updateQuantity` | `{productId, variantId?, quantity}` | Set quantity on matching item |
| `clearCart` | none | Empty items array |
| `toggleCart` | none | Flip isOpen |
| `openCart` | none | Set isOpen to true |
| `closeCart` | none | Set isOpen to false |

**`src/store/slices/authSlice.ts`**

State shape:
```typescript
interface AuthState {
  user: { id: string; name: string; email: string; role: string } | null
  accessToken: string | null
  isAuthenticated: boolean
}
```

Actions: `setUser`, `setToken`, `logout` (clears user + token)

**`src/store/slices/wishlistSlice.ts`**

State shape:
```typescript
interface WishlistState {
  productIds: string[]
}
```

Actions: `addToWishlist(productId)`, `removeFromWishlist(productId)`, `toggleWishlist(productId)`

---

### `Navbar` Component Specification

**Behavior:**
- Sticky: `position: sticky; top: 0; z-index: 50`
- Height: 64px (h-16)
- Background: `#0A0A0A` (bg-background) with `border-b border-border`
- Logo: "STORE" text — link to `/` — Playfair Display, text-xl, font-bold
- Desktop nav: 4 category links, each with hover mega-dropdown
- Mobile: hamburger icon → Sheet (Shadcn) from left

**Mega-dropdown behavior:**
- Triggered by `onMouseEnter` / `onMouseLeave` on the nav item
- Dropdown is absolutely positioned below the nav item
- Contains subcategory links in a single column
- Min width: 192px
- Border + shadow, surface background

**Nav categories (hardcoded — API data on Day 4):**
```
Clothes → sub: Tops, Bottoms, Outerwear, Formal, Casual
Shoes → sub: Sneakers, Formal, Sandals, Boots, Sports
Apparel → sub: Kurtas, Shalwar Kameez, Abayas, Sportswear
Accessories → sub: Bags, Belts, Wallets, Sunglasses, Watches
```

**Right icons:**
- Search icon → future: opens search overlay
- Heart icon → `/wishlist`
- User icon → authenticated: `/account`, unauthenticated: `/login`
- Cart icon → toggles CartDrawer; shows item count badge when > 0

---

### `CartDrawer` Component Specification

**Behavior:**
- Slide from right using Shadcn `Sheet` component
- Open state controlled by Redux `cart.isOpen`
- Overlay backdrop on open
- Width: 400px on desktop, full width on mobile

**Contents:**
- Header: "Your Cart (N items)", close button (X)
- Item list: each item shows image, name, variant info, price, qty stepper, remove button
- Footer: subtotal, "View Cart" button → `/cart`, "Checkout" button → `/checkout`
- Empty state: "Your cart is empty" with "Start Shopping" CTA

---

### `ProductCard` Component Specification

**Props:**
```typescript
interface ProductCardProps {
  id: string
  name: string
  slug: string
  imageUrl: string
  secondaryImageUrl?: string
  price: number
  salePrice?: number
  category: string
  avgRating?: number
  reviewCount?: number
  isBadgeNew?: boolean
  isBadgeSale?: boolean
  isLowStock?: boolean
  stockCount?: number
}
```

**Behavior:**
- Image: 4:5 aspect ratio, `object-cover`
- On hover: if `secondaryImageUrl` provided, swap to secondary (CSS transition opacity)
- Wishlist heart icon: top-right of image, visible on hover (or always on mobile)
- Clicking heart → dispatches `toggleWishlist` to Redux; gold when in wishlist
- Badge: top-left of image — "NEW" (gold) or "SALE" (red)
- Low stock: "Only {N} left!" amber badge at bottom of image
- Price display: if salePrice, show strikethrough basePrice + gold salePrice
- Rating: star icons (gold) + review count

---

### `AnnouncementBar` Component Specification

- Height: 36px
- Background: `#E8D5B0` (primary)
- Text: dark (`#0A0A0A`), centered, DM Sans, text-sm
- Content: "Free delivery on orders over PKR 3,000 | New arrivals every Friday"
- Optional: marquee animation on mobile

---

### `Footer` Component Specification

4-column layout:
1. **About** — store name, short description, social icons (Instagram, Facebook, WhatsApp)
2. **Categories** — links to /categories/clothes, /shoes, /apparel, /accessories
3. **Help** — Size Guide, Track Order, Returns & Exchanges, Contact Us
4. **Contact** — WhatsApp number, email, address

Bottom bar:
- Copyright notice
- Payment method icons: JazzCash, EasyPaisa, Visa, Mastercard, COD (text or SVG icons)

---

### `HeroBanner` Component Specification

- Height: ~80vh (min-h-[80vh])
- Background: dark with gradient overlay (bottom-up)
- Content (centered, vertically):
  - Headline: "Dress for the life you want" — Playfair Display, large (text-5xl md:text-7xl)
  - Subtitle: DM Sans, text-secondary
  - Two CTAs: "Shop Now" (gold filled) + "View Lookbook" (outline gold)
- Mobile: smaller headline, stacked buttons

---

### Homepage Assembly (`src/app/(store)/page.tsx`)

Render in this order:
1. `AnnouncementBar`
2. `HeroBanner`
3. `CategoryTiles`
4. `FeaturedProducts` (mock data — 8 items)
5. `NewArrivalsStrip` (mock data — 8 items)
6. `LookbookTeaser`
7. `NewsletterSection`

All with mock/hardcoded data — real API calls added Day 4.

---

## Full Code Templates

### `src/store/index.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './slices/cartSlice'
import authReducer from './slices/authSlice'
import wishlistReducer from './slices/wishlistSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    wishlist: wishlistReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### `src/store/hooks.ts`

```typescript
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'

// Use these typed hooks throughout the app — never raw useSelector/useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector)
```

### `src/store/slices/cartSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CartItem {
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  size?: string
  color?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

const initialState: CartState = { items: [], isOpen: false }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        i => i.productId === action.payload.productId &&
             i.variantId === action.payload.variantId
      )
      if (existing) {
        existing.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
    },
    removeItem(state, action: PayloadAction<{ productId: string; variantId?: string }>) {
      state.items = state.items.filter(
        i => !(i.productId === action.payload.productId &&
               i.variantId === action.payload.variantId)
      )
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>
    ) {
      const item = state.items.find(
        i => i.productId === action.payload.productId &&
             i.variantId === action.payload.variantId
      )
      if (item) item.quantity = action.payload.quantity
    },
    clearCart(state) {
      state.items = []
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen
    },
    openCart(state) {
      state.isOpen = true
    },
    closeCart(state) {
      state.isOpen = false
    },
  },
})

export const { addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart } =
  cartSlice.actions
export default cartSlice.reducer
```

### `src/store/slices/authSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      state.isAuthenticated = true
    },
    setToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
    },
  },
})

export const { setUser, setToken, logout } = authSlice.actions
export default authSlice.reducer
```

### `src/store/slices/wishlistSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface WishlistState {
  productIds: string[]
}

const initialState: WishlistState = { productIds: [] }

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist(state, action: PayloadAction<string>) {
      if (!state.productIds.includes(action.payload)) {
        state.productIds.push(action.payload)
      }
    },
    removeFromWishlist(state, action: PayloadAction<string>) {
      state.productIds = state.productIds.filter(id => id !== action.payload)
    },
    toggleWishlist(state, action: PayloadAction<string>) {
      const idx = state.productIds.indexOf(action.payload)
      if (idx === -1) {
        state.productIds.push(action.payload)
      } else {
        state.productIds.splice(idx, 1)
      }
    },
  },
})

export const { addToWishlist, removeFromWishlist, toggleWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
```

### `src/components/shared/ReduxProvider.tsx`

```tsx
'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}
```

### `src/components/store/Navbar.tsx`

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart, User, Search, Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleCart } from '@/store/slices/cartSlice'

const NAV_CATEGORIES = [
  {
    label: 'Clothes',
    href: '/categories/clothes',
    sub: ['Tops', 'Bottoms', 'Outerwear', 'Formal', 'Casual'],
  },
  {
    label: 'Shoes',
    href: '/categories/shoes',
    sub: ['Sneakers', 'Formal', 'Sandals', 'Boots', 'Sports'],
  },
  {
    label: 'Apparel',
    href: '/categories/apparel',
    sub: ['Kurtas', 'Shalwar Kameez', 'Abayas', 'Sportswear'],
  },
  {
    label: 'Accessories',
    href: '/categories/accessories',
    sub: ['Bags', 'Belts', 'Wallets', 'Sunglasses', 'Watches'],
  },
]

export function Navbar() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(state => state.cart.items)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-bold text-text-primary tracking-tight">
          STORE
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_CATEGORIES.map(cat => (
            <div
              key={cat.label}
              className="relative"
              onMouseEnter={() => setActiveCategory(cat.label)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <Link
                href={cat.href}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {cat.label}
              </Link>

              {activeCategory === cat.label && (
                <div className="absolute top-full left-0 bg-surface border border-border p-3 min-w-48 shadow-lg z-50">
                  {cat.sub.map(sub => (
                    <Link
                      key={sub}
                      href={`${cat.href}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block text-sm text-text-secondary hover:text-text-primary py-1.5 transition-colors"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          <button
            aria-label="Search"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <Heart className="w-5 h-5" />
          </Link>
          <Link
            href={isAuthenticated ? '/account' : '/login'}
            aria-label="Account"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => dispatch(toggleCart())}
            className="relative text-text-secondary hover:text-text-primary transition-colors"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-background text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden text-text-secondary" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-surface border-border w-72">
              <nav className="flex flex-col gap-1 mt-8">
                {NAV_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <Link
                      href={cat.href}
                      className="block py-2 text-sm font-medium text-text-primary border-b border-border"
                    >
                      {cat.label}
                    </Link>
                    {cat.sub.map(sub => (
                      <Link
                        key={sub}
                        href={`${cat.href}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block py-1.5 pl-4 text-sm text-text-secondary hover:text-text-primary"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
```

---

## Mock Data for Homepage

Create `src/lib/utils/mockData.ts` for Day 3 development:

```typescript
export const MOCK_PRODUCTS = Array.from({ length: 8 }, (_, i) => ({
  id: `prod_${i + 1}`,
  name: ['Linen Dress Shirt', 'Slim Fit Chinos', 'Leather Oxford', 'Cotton Kurta', 'Silk Blouse', 'Wool Blazer', 'Sneaker Hi-Top', 'Embroidered Dupatta'][i],
  slug: `product-${i + 1}`,
  imageUrl: `https://placehold.co/400x500/141414/E8D5B0?text=Product+${i + 1}`,
  category: ['Clothes', 'Clothes', 'Shoes', 'Apparel', 'Clothes', 'Clothes', 'Shoes', 'Accessories'][i],
  price: [4500, 3200, 8900, 2800, 5600, 12000, 7500, 1800][i],
  salePrice: i % 3 === 0 ? [3500, null, null, null, null, null, null, null][0] : undefined,
  avgRating: 4.2 + (i % 5) * 0.1,
  reviewCount: 12 + i * 7,
  isBadgeNew: i < 2,
  isBadgeSale: i === 0,
}))
```

---

## Tests Required

### `tests/unit/cartSlice.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import cartReducer, { addItem, removeItem, updateQuantity, clearCart, toggleCart } from '@/store/slices/cartSlice'

const mockItem = {
  productId: 'p1',
  variantId: 'v1',
  name: 'Test Shirt',
  price: 2500,
  quantity: 1,
  imageUrl: '/img.jpg',
}

describe('Cart slice', () => {
  it('adds a new item', () => {
    const state = cartReducer(undefined, addItem(mockItem))
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(1)
  })

  it('increments quantity for existing item', () => {
    let state = cartReducer(undefined, addItem(mockItem))
    state = cartReducer(state, addItem({ ...mockItem, quantity: 2 }))
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(3)
  })

  it('removes an item', () => {
    let state = cartReducer(undefined, addItem(mockItem))
    state = cartReducer(state, removeItem({ productId: 'p1', variantId: 'v1' }))
    expect(state.items).toHaveLength(0)
  })

  it('updates quantity', () => {
    let state = cartReducer(undefined, addItem(mockItem))
    state = cartReducer(state, updateQuantity({ productId: 'p1', variantId: 'v1', quantity: 5 }))
    expect(state.items[0].quantity).toBe(5)
  })

  it('clears all items', () => {
    let state = cartReducer(undefined, addItem(mockItem))
    state = cartReducer(state, clearCart())
    expect(state.items).toHaveLength(0)
  })

  it('toggles cart visibility', () => {
    const state = cartReducer(undefined, toggleCart())
    expect(state.isOpen).toBe(true)
    const state2 = cartReducer(state, toggleCart())
    expect(state2.isOpen).toBe(false)
  })

  it('treats same product with different variant as separate item', () => {
    let state = cartReducer(undefined, addItem(mockItem))
    state = cartReducer(state, addItem({ ...mockItem, variantId: 'v2' }))
    expect(state.items).toHaveLength(2)
  })
})
```

```bash
npx vitest run tests/unit/cartSlice.test.ts
```

---

## Acceptance Criteria

- [ ] `http://localhost:3000` renders without errors or console warnings
- [ ] Navbar is sticky on scroll
- [ ] Hovering "Clothes" shows dropdown with Tops, Bottoms, Outerwear, Formal, Casual
- [ ] Hamburger menu opens mobile drawer on screens < 768px
- [ ] Cart icon badge shows total quantity across all items
- [ ] Clicking cart icon opens CartDrawer from right
- [ ] Clicking wishlist heart on ProductCard updates Redux wishlist state
- [ ] All 8 featured products render in a 4-column grid (2-col mobile)
- [ ] New Arrivals strip scrolls horizontally
- [ ] Newsletter email input accepts input (no backend — just controlled state)
- [ ] Footer links are present (not broken — 404 is acceptable, just no blank hrefs)
- [ ] All unit tests pass: `npx vitest run`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## Progress Tracker Updates

Mark these items in `CLAUDE.md`:
```
[2026-04-17] Mega-menu navbar (Clothes, Shoes, Apparel, Accessories) — done
[2026-04-17] Homepage (hero, featured products, category tiles) — done
[2026-04-17] Google OAuth — partial (Day 2 backend, Day 3 frontend — wire on Day 4)
```
