# DAY 01 — Project Scaffold + Prisma Schema + Supabase Setup

## Overview

**Goal:** A working Next.js 14 application connected to Supabase (PostgreSQL) with the complete database schema migrated, a seed script that populates categories and an admin user, and every dependency installed.

**Deliverables:**
- Bootstrapped Next.js 14 project with TypeScript, Tailwind, ESLint, App Router, src/ dir
- All npm dependencies installed (Prisma, Supabase client, Shadcn, Redux, Zod, Auth libs, Email, AI, Payment, Storage, Monitoring)
- Complete Prisma schema covering every domain model
- First Prisma migration executed against Supabase
- Prisma client singleton ready for import
- Seed script: admin user + 4 root categories
- `.env.example` with every variable documented
- Folder structure matching the architecture spec

**Success Criteria:**
- `npx prisma migrate status` shows migration applied
- `npx prisma studio` opens and all tables are visible
- `npm run dev` starts on port 3000 without errors
- `npx prisma db seed` runs without errors and creates admin + categories

---

## Prerequisites

- Node.js 18+ installed (`node -v`)
- npm 9+ installed (`npm -v`)
- Supabase project created (free tier is fine)
- Supabase project URL and keys available from the Supabase dashboard → Project Settings → API
- Git installed (for version control from day 1)

---

## Setup & Script Tasks

Run these commands **in order**. Each block is a checkpoint — verify it succeeds before continuing.

### 1.1 — Scaffold Next.js App

```bash
# From /home/hasan/clothes-store (or your chosen parent dir)
npx create-next-app@latest ecommerce \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd ecommerce
```

### 1.2 — Install Core Dependencies

```bash
# Database + ORM
npm install prisma @prisma/client
npm install @supabase/supabase-js

# Validation
npm install zod

# Auth
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# Email
npm install resend

# Caching + Rate Limiting
npm install @upstash/ratelimit @upstash/redis

# AI
npm install @anthropic-ai/sdk openai

# Payments (no official SDK — we build raw requests)
# JazzCash and EasyPaisa use form POST + HMAC — pure Node crypto

# State Management
npm install @reduxjs/toolkit react-redux

# Dev tools
npm install -D ts-node vitest @vitejs/plugin-react
npm install -D prettier eslint-config-prettier
```

### 1.3 — Initialize Shadcn UI

```bash
npx shadcn-ui@latest init
# Prompts:
#   TypeScript: yes
#   Style: Default
#   Base color: Slate
#   CSS variables: yes
```

### 1.4 — Add All Required Shadcn Components

```bash
npx shadcn-ui@latest add button input label card badge sheet dialog
npx shadcn-ui@latest add dropdown-menu navigation-menu separator
npx shadcn-ui@latest add toast form select checkbox radio-group
npx shadcn-ui@latest add table tabs avatar progress skeleton
```

### 1.5 — Initialize Prisma

```bash
npx prisma init
# Creates: prisma/schema.prisma + .env (with DATABASE_URL placeholder)
```

### 1.6 — Run First Migration

```bash
# After filling .env with your Supabase credentials:
npx prisma migrate dev --name init
```

### 1.7 — Generate Prisma Client

```bash
npx prisma generate
```

### 1.8 — Install ts-node for Seed Script

```bash
npm install -D ts-node
```

### 1.9 — Run Seed Script

```bash
npx prisma db seed
```

### 1.10 — Create Folder Structure

```bash
mkdir -p src/{lib/{db,auth,validations,services/{payment,email,ai},utils},store/slices,types,hooks,middleware}
mkdir -p src/components/{ui,store,admin,shared}
mkdir -p tests/{unit,integration,e2e}
```

### 1.11 — Initialize Git

```bash
git init
git add .
git commit -m "chore: initial scaffold with Prisma schema and Supabase connection"
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | CREATE | Complete database schema — all 20+ models |
| `src/lib/db/client.ts` | CREATE | Prisma client singleton |
| `prisma/seed.ts` | CREATE | Admin user + category seeder |
| `.env.example` | CREATE | All environment variable placeholders with comments |
| `.env.local` | CREATE (gitignored) | Developer's actual credentials |
| `.gitignore` | MODIFY | Ensure `.env.local` and `node_modules` are excluded |
| `package.json` | MODIFY | Add prisma seed script config |
| `vitest.config.ts` | CREATE | Vitest configuration |
| `src/app/layout.tsx` | MODIFY | Add Google Fonts (Playfair Display + DM Sans) |
| `tailwind.config.ts` | MODIFY | Add design tokens matching SCREENS.md theme |

---

## Specifications

### `prisma/schema.prisma`

**Purpose:** Single source of truth for the database. Customers run `prisma migrate deploy` from this file — never touch SQL manually.

**Datasource:** PostgreSQL via Supabase. Two connection strings required:
- `DATABASE_URL` — pooled connection (pgBouncer) for Prisma queries
- `DIRECT_URL` — direct connection for migrations

**Enums:**
| Enum | Values |
|------|--------|
| `Role` | ADMIN, CUSTOMER, GUEST |
| `OrderStatus` | PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| `PaymentMethod` | JAZZCASH, EASYPAISA, CARD, COD, BANK_TRANSFER |
| `PaymentStatus` | PENDING, COMPLETED, FAILED, REFUNDED |
| `QuotationStatus` | PENDING, SENT, ACCEPTED, REJECTED, CONVERTED, EXPIRED |
| `LoyaltyTier` | BRONZE, SILVER, GOLD, PLATINUM |

**Models (all 20):**

| Model | Primary Key | Key Fields | Indexes |
|-------|-------------|------------|---------|
| `User` | cuid | email (unique), role, googleId | email, role |
| `Address` | cuid | userId, label, city, province, isDefault | userId |
| `RefreshToken` | cuid | token (unique), userId, expiresAt | token, userId |
| `OtpToken` | cuid | userId, code, expiresAt, used | userId |
| `Category` | cuid | name, slug (unique), parentId (self-relation), isActive | slug, parentId |
| `Product` | cuid | slug (unique), sku (unique), categoryId, basePrice, salePrice | slug, categoryId, isActive+isFeatured |
| `ProductVariant` | cuid | productId, size, color, stock, sku (unique) | productId |
| `ProductImage` | cuid | productId, url, isPrimary, sortOrder | productId |
| `Review` | cuid | productId, userId, rating (1-5), sentiment | productId, userId |
| `Cart` | cuid | userId (unique), lastActiveAt | userId, lastActiveAt |
| `CartItem` | cuid | cartId, productId, variantId, quantity | cartId; unique(cartId,productId,variantId) |
| `Order` | cuid | orderNumber (unique/cuid), userId, status, total | userId, status, createdAt |
| `OrderItem` | cuid | orderId, productId, variantId, quantity, price | orderId |
| `Payment` | cuid | orderId (unique), method, status, amount, gatewayRef | orderId, status |
| `FlashSale` | cuid | name, discountPct, startTime, endTime, isActive, productIds[] | startTime+endTime, isActive |
| `Quotation` | cuid | userId?, name, email, items (Json), status, pdfUrl, aiDraft | status, email |
| `LoyaltyAccount` | cuid | userId (unique), points, tier, totalEarned | userId |
| `LoyaltyEvent` | cuid | accountId, points (+earned/-redeemed), reason | accountId |
| `Outfit` | cuid | title, season, occasion, gender, isPublished | — |
| `OutfitItem` | cuid | outfitId, productId, sortOrder | outfitId |
| `WishlistItem` | cuid | userId, productId, createdAt | userId; unique(userId,productId) |
| `Coupon` | cuid | code (unique), discountPct, discountFlat, minOrderValue, maxUses | code |
| `EmailLog` | cuid | email, type, status, retryCount | email+type, status |

**Cascade rules:**
- User deleted → Addresses, RefreshTokens, OtpTokens, Cart, WishlistItems, LoyaltyAccount cascade delete
- Product deleted → ProductVariants, ProductImages, Reviews cascade delete
- Cart deleted → CartItems cascade delete
- Order deleted → OrderItems cascade delete
- Outfit deleted → OutfitItems cascade delete
- LoyaltyAccount deleted → LoyaltyEvents cascade delete

### `src/lib/db/client.ts`

**Purpose:** Prevent multiple Prisma client instances in development (Next.js hot reload creates new module instances on every change).

**Behavior:**
- In development: store client on `globalThis` so hot reloads reuse the existing instance
- In production: create a fresh instance (no globalThis caching needed)
- Log level: development logs `query`, `error`, `warn`; production logs `error` only

**Export:** Named export `db` — import as `import { db } from '@/lib/db/client'`

### `prisma/seed.ts`

**Purpose:** Bootstrap a fresh database with the minimum data needed to use the system.

**What it creates:**
1. Admin user — `admin@store.com` / `Admin@123` (bcrypt hashed, 12 rounds), role: ADMIN, isVerified: true
2. Four root categories — Clothes, Shoes, Apparel, Accessories (each with slug)

**Behavior:** Uses `upsert` on unique fields — safe to run multiple times without creating duplicates.

**Security note:** Default password `Admin@123` is documented in README. Customer MUST change it on first login.

### `.env.example`

Every variable has a comment explaining what it is and where to get it.

```
# ─── DATABASE ──────────────────────────────────────────────────────────────────
# Get from: Supabase Dashboard → Project Settings → Database → Connection String
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# ─── AUTH ──────────────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET="your-32-char-minimum-secret-here"
JWT_REFRESH_SECRET="your-different-32-char-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# ─── GOOGLE OAUTH ──────────────────────────────────────────────────────────────
# Get from: console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ─── EMAIL ─────────────────────────────────────────────────────────────────────
# Get from: resend.com → API Keys
RESEND_API_KEY=""

# ─── AI ────────────────────────────────────────────────────────────────────────
# Get from: platform.openai.com/api-keys
OPENAI_API_KEY=""
# Get from: console.anthropic.com/keys
ANTHROPIC_API_KEY=""

# ─── PAYMENTS ──────────────────────────────────────────────────────────────────
# JazzCash: developer.jazzcash.com.pk
JAZZCASH_MERCHANT_ID=""
JAZZCASH_PASSWORD=""
JAZZCASH_INTEGRITY_SALT=""
# EasyPaisa: easypay.easypaisa.com.pk
EASYPAISA_STORE_ID=""
EASYPAISA_HASH_KEY=""
# Stripe: dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ─── STORAGE ───────────────────────────────────────────────────────────────────
# Get from: cloudinary.com → Dashboard
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# ─── MONITORING ────────────────────────────────────────────────────────────────
# Sentry: sentry.io → Project Settings → DSN
SENTRY_DSN=""
# Google Analytics 4 Measurement ID
NEXT_PUBLIC_GA4_ID=""
# Meta Pixel ID
NEXT_PUBLIC_META_PIXEL_ID=""

# ─── APP ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# WhatsApp business number in international format (no spaces)
NEXT_PUBLIC_WHATSAPP_NUMBER="+92XXXXXXXXXX"

# ─── CRON SECURITY ─────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
CRON_SECRET=""

# ─── UPSTASH (Rate Limiting) ───────────────────────────────────────────────────
# Get from: console.upstash.com → Redis → REST API
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### `tailwind.config.ts` — Design Token Additions

Add these to the `extend` block to match the SCREENS.md "Minimal Luxury Dark" theme:

```typescript
colors: {
  background: '#0A0A0A',
  surface: '#141414',
  border: '#222222',
  primary: {
    DEFAULT: '#E8D5B0',
    hover: '#F5E6C8',
  },
  accent: '#C9A96E',
  text: {
    primary: '#F5F5F5',
    secondary: '#888888',
  },
  success: '#4CAF84',
  error: '#E05252',
  warning: '#E8A838',
},
fontFamily: {
  display: ['Playfair Display', 'serif'],
  body: ['DM Sans', 'sans-serif'],
},
```

### `src/app/layout.tsx` — Google Fonts

Add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

### `package.json` — Add prisma seed config

Add this top-level key:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "scripts": {
    "seed": "npx prisma db seed",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Full Code Templates

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  CUSTOMER
  GUEST
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  JAZZCASH
  EASYPAISA
  CARD
  COD
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum QuotationStatus {
  PENDING
  SENT
  ACCEPTED
  REJECTED
  CONVERTED
  EXPIRED
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

// ─── USERS ────────────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String
  phone         String?
  role          Role      @default(CUSTOMER)
  isVerified    Boolean   @default(false)
  googleId      String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  addresses     Address[]
  orders        Order[]
  cart          Cart?
  wishlist      WishlistItem[]
  reviews       Review[]
  loyalty       LoyaltyAccount?
  quotations    Quotation[]
  sessions      RefreshToken[]
  otpTokens     OtpToken[]

  @@index([email])
  @@index([role])
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  label      String  // "Home", "Office"
  line1      String
  line2      String?
  city       String
  province   String
  postalCode String
  isDefault  Boolean @default(false)

  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders     Order[]

  @@index([userId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
}

model OtpToken {
  id        String   @id @default(cuid())
  userId    String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  imageUrl    String?
  parentId    String?
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())

  parent      Category?  @relation("SubCategories", fields: [parentId], references: [id])
  children    Category[] @relation("SubCategories")
  products    Product[]

  @@index([slug])
  @@index([parentId])
}

model Product {
  id               String          @id @default(cuid())
  name             String
  slug             String          @unique
  description      String
  shortDescription String?
  categoryId       String
  basePrice        Decimal         @db.Decimal(10, 2)
  salePrice        Decimal?        @db.Decimal(10, 2)
  sku              String          @unique
  isActive         Boolean         @default(true)
  isFeatured       Boolean         @default(false)
  tags             String[]
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  category         Category        @relation(fields: [categoryId], references: [id])
  variants         ProductVariant[]
  images           ProductImage[]
  reviews          Review[]
  wishlistItems    WishlistItem[]
  cartItems        CartItem[]
  orderItems       OrderItem[]
  outfitItems      OutfitItem[]

  @@index([slug])
  @@index([categoryId])
  @@index([isActive, isFeatured])
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  size      String?
  color     String?
  stock     Int      @default(0)
  sku       String   @unique
  price     Decimal? @db.Decimal(10, 2)

  product    Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems  CartItem[]
  orderItems OrderItem[]

  @@index([productId])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  altText   String?
  isPrimary Boolean @default(false)
  sortOrder Int     @default(0)

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model Review {
  id         String   @id @default(cuid())
  productId  String
  userId     String
  rating     Int      // 1-5
  title      String?
  body       String
  isVerified Boolean  @default(false)
  sentiment  String?  // AI-analyzed: positive/negative/neutral
  createdAt  DateTime @default(now())

  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])

  @@index([productId])
  @@index([userId])
}

// ─── CART ─────────────────────────────────────────────────────────────────────

model Cart {
  id           String     @id @default(cuid())
  userId       String     @unique
  lastActiveAt DateTime   @default(now())
  createdAt    DateTime   @default(now())

  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items        CartItem[]

  @@index([userId])
  @@index([lastActiveAt])
}

model CartItem {
  id        String          @id @default(cuid())
  cartId    String
  productId String
  variantId String?
  quantity  Int

  cart      Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product         @relation(fields: [productId], references: [id])
  variant   ProductVariant? @relation(fields: [variantId], references: [id])

  @@unique([cartId, productId, variantId])
  @@index([cartId])
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

model Order {
  id             String      @id @default(cuid())
  orderNumber    String      @unique @default(cuid())
  userId         String?
  addressId      String?
  status         OrderStatus @default(PENDING)
  subtotal       Decimal     @db.Decimal(10, 2)
  shippingCost   Decimal     @db.Decimal(10, 2) @default(0)
  discount       Decimal     @db.Decimal(10, 2) @default(0)
  total          Decimal     @db.Decimal(10, 2)
  couponCode     String?
  trackingNumber String?
  notes          String?
  isGift         Boolean     @default(false)
  giftMessage    String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  user           User?       @relation(fields: [userId], references: [id])
  address        Address?    @relation(fields: [addressId], references: [id])
  items          OrderItem[]
  payment        Payment?

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id        String          @id @default(cuid())
  orderId   String
  productId String
  variantId String?
  quantity  Int
  price     Decimal         @db.Decimal(10, 2)

  order     Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product         @relation(fields: [productId], references: [id])
  variant   ProductVariant? @relation(fields: [variantId], references: [id])

  @@index([orderId])
}

model Payment {
  id              String        @id @default(cuid())
  orderId         String        @unique
  method          PaymentMethod
  status          PaymentStatus @default(PENDING)
  amount          Decimal       @db.Decimal(10, 2)
  gatewayRef      String?
  gatewayResponse Json?
  paidAt          DateTime?
  createdAt       DateTime      @default(now())

  order           Order         @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([status])
}

// ─── FLASH SALES ──────────────────────────────────────────────────────────────

model FlashSale {
  id          String   @id @default(cuid())
  name        String
  discountPct Int      // 0-100
  startTime   DateTime // UTC always
  endTime     DateTime // UTC always
  isActive    Boolean  @default(false)
  productIds  String[]
  createdAt   DateTime @default(now())

  @@index([startTime, endTime])
  @@index([isActive])
}

// ─── QUOTATIONS ───────────────────────────────────────────────────────────────

model Quotation {
  id        String          @id @default(cuid())
  userId    String?
  name      String
  email     String
  phone     String?
  company   String?
  items     Json            // [{productId, qty, notes}]
  status    QuotationStatus @default(PENDING)
  pdfUrl    String?
  aiDraft   String?
  expiresAt DateTime?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  user      User?           @relation(fields: [userId], references: [id])

  @@index([status])
  @@index([email])
}

// ─── LOYALTY ──────────────────────────────────────────────────────────────────

model LoyaltyAccount {
  id          String        @id @default(cuid())
  userId      String        @unique
  points      Int           @default(0)
  tier        LoyaltyTier   @default(BRONZE)
  totalEarned Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  history     LoyaltyEvent[]

  @@index([userId])
}

model LoyaltyEvent {
  id        String         @id @default(cuid())
  accountId String
  points    Int            // positive = earned, negative = redeemed
  reason    String
  createdAt DateTime       @default(now())

  account   LoyaltyAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
}

// ─── OUTFIT BUILDER ───────────────────────────────────────────────────────────

model Outfit {
  id          String       @id @default(cuid())
  title       String
  description String?
  imageUrl    String?
  season      String?
  occasion    String?
  gender      String?
  isPublished Boolean      @default(false)
  createdAt   DateTime     @default(now())

  items       OutfitItem[]
}

model OutfitItem {
  id        String  @id @default(cuid())
  outfitId  String
  productId String
  sortOrder Int     @default(0)

  outfit    Outfit  @relation(fields: [outfitId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@index([outfitId])
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────────

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@index([userId])
}

// ─── COUPONS ──────────────────────────────────────────────────────────────────

model Coupon {
  id            String    @id @default(cuid())
  code          String    @unique
  discountPct   Int?
  discountFlat  Decimal?  @db.Decimal(10, 2)
  minOrderValue Decimal?  @db.Decimal(10, 2)
  maxUses       Int?
  usedCount     Int       @default(0)
  expiresAt     DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())

  @@index([code])
}

// ─── EMAIL TRACKING ───────────────────────────────────────────────────────────

model EmailLog {
  id         String    @id @default(cuid())
  userId     String?
  email      String
  type       String    // "order_confirm", "abandoned_cart", "price_drop", etc.
  status     String    @default("sent") // sent, opened, clicked, failed
  retryCount Int       @default(0)
  sentAt     DateTime  @default(now())
  openedAt   DateTime?
  clickedAt  DateTime?

  @@index([email, type])
  @@index([status])
}
```

### `src/lib/db/client.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Prevent multiple instances during hot reload in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // Create admin user — password must be changed on first login
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  await db.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      name: 'Store Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // Root categories — customers browse by these
  const rootCategories = [
    { name: 'Clothes', slug: 'clothes' },
    { name: 'Shoes', slug: 'shoes' },
    { name: 'Apparel', slug: 'apparel' },
    { name: 'Accessories', slug: 'accessories' },
  ]

  for (const category of rootCategories) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('Seed complete — admin@store.com created, 4 categories seeded')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
```

---

## Tests Required

### `tests/unit/db-client.test.ts`

Verify the Prisma singleton behavior:

```typescript
import { describe, it, expect } from 'vitest'
import { db } from '@/lib/db/client'

describe('Prisma client singleton', () => {
  it('exports a PrismaClient instance', () => {
    expect(db).toBeDefined()
    expect(typeof db.$connect).toBe('function')
  })

  it('returns the same instance on repeated imports', async () => {
    const { db: db2 } = await import('@/lib/db/client')
    expect(db).toBe(db2)
  })
})
```

**Manual verification after seed:**
```bash
# Check admin user exists
npx prisma studio
# Navigate to User table — should see admin@store.com with role ADMIN

# Check categories
# Navigate to Category table — should see 4 entries
```

---

## Acceptance Criteria

- [ ] `npm run dev` starts without TypeScript errors
- [ ] `npx prisma migrate status` shows 1 migration applied: `20XXXXXX_init`
- [ ] `npx prisma studio` opens all 20+ tables
- [ ] `npx prisma db seed` exits with code 0 and prints "Seed complete"
- [ ] Supabase dashboard shows tables matching schema
- [ ] `.env.example` has every variable with a comment
- [ ] `.env.local` is gitignored (not committed)
- [ ] Design tokens in `tailwind.config.ts` include all 8 brand colors
- [ ] Google Fonts (Playfair Display + DM Sans) load in browser

---

## Progress Tracker Updates

Mark these items in `CLAUDE.md`:
```
[2026-04-15] Next.js 14 scaffold with TypeScript, Tailwind, Shadcn — done
[2026-04-15] Prisma schema — all tables — done
[2026-04-15] Supabase connection setup + first migration — done
[2026-04-15] Figma-free UI: Shadcn + Tailwind design tokens configured — done
```
