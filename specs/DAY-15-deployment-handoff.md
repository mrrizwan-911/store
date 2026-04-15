# DAY 15 — Deployment + Customer Handoff

## Overview

**Goal:** Deploy the application to Vercel, configure all production environment variables, set up the GitHub CI/CD pipeline, configure Vercel Cron jobs, run the final end-to-end smoke test on the live URL, and prepare the complete customer handoff package.

**Deliverables:**
- Vercel deployment (production + staging environments)
- GitHub Actions CI pipeline (lint + test on every PR)
- `scripts/setup.sh` — customer one-command setup script
- `README.md` — comprehensive customer setup guide
- `.env.example` — fully documented (already created Day 1, final review)
- Admin user guide (`docs/admin-guide.md`)
- Final checklist — all 15-day features verified live
- `vercel.json` — crons finalized
- Production smoke test: register → add to cart → checkout → order confirmation

**Success Criteria:**
- `https://yourstore.vercel.app` loads homepage
- Admin login works: `admin@store.com` / `Admin@123` (customer changes after)
- Customer can register, verify OTP, and place an order
- Cron jobs are configured in Vercel dashboard
- All environment variables are set in Vercel
- GitHub Actions CI runs successfully on main branch
- Customer receives README + setup script and can deploy independently

---

## Prerequisites

- All Days 1-14 complete
- GitHub repository created
- Vercel account created
- All environment variables ready (all keys and secrets filled)
- `NEXT_PUBLIC_APP_URL` updated to production URL

---

## Setup & Script Tasks

### 15.1 — Git Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "feat: complete e-commerce platform — all 15 days"

# Create GitHub repository and push
gh repo create clothes-store --public
git remote add origin https://github.com/{username}/clothes-store.git
git push -u origin main

# Create staging branch
git checkout -b staging
git push -u origin staging
```

### 15.2 — Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set all environment variables
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add JWT_ACCESS_SECRET production
vercel env add JWT_REFRESH_SECRET production
# ... (add all variables from .env.example)

# Re-deploy with env vars
vercel --prod
```

### 15.3 — Database Migration on Production

```bash
# Run migrations against production Supabase
DATABASE_URL="your-production-url" npx prisma migrate deploy

# Seed initial data (admin user + categories)
DATABASE_URL="your-production-url" npx prisma db seed
```

### 15.4 — Verify Cron Jobs

In Vercel dashboard: Settings → Crons
- `/api/cron/flash-sale-cleanup` every 15 min ✓
- `/api/cron/abandoned-cart` every 15 min ✓

### 15.5 — Final Smoke Test

```bash
# Automated smoke test (run locally against production)
BASE_URL=https://yourstore.vercel.app npx playwright test tests/e2e/smoke.spec.ts
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `scripts/setup.sh` | CREATE | Customer one-command setup |
| `README.md` | CREATE | Customer setup guide |
| `docs/admin-guide.md` | CREATE | Admin panel user guide |
| `.github/workflows/ci.yml` | CREATE | GitHub Actions CI pipeline |
| `tests/e2e/smoke.spec.ts` | CREATE | Production smoke tests |
| `vercel.json` | VERIFY | All crons configured |
| `CLAUDE.md` | MODIFY | Mark all Week 1-8 tasks as done |

---

## Specifications

### `scripts/setup.sh`

**Purpose:** Customer runs this once after cloning and filling `.env`.

```bash
#!/bin/bash
set -e  # exit on any error

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║        E-Commerce Store Setup             ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Found: $(node -v)"
  exit 1
fi

echo "✓ Node.js $(node -v) detected"

# Check .env exists
if [ ! -f ".env" ]; then
  echo "❌ .env file not found. Copy .env.example to .env and fill in your credentials."
  echo "   cp .env.example .env"
  exit 1
fi

echo "✓ .env file found"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Run database migrations
echo ""
echo "Running database migrations..."
npx prisma migrate deploy
echo "✓ Migrations complete"

# Generate Prisma client
npx prisma generate
echo "✓ Prisma client generated"

# Seed initial data
echo ""
echo "Seeding initial data (admin user + categories)..."
npm run seed
echo "✓ Seed complete"

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║   Setup complete!                         ║"
echo "╠═══════════════════════════════════════════╣"
echo "║   Start development: npm run dev          ║"
echo "║   Admin email:       admin@store.com      ║"
echo "║   Admin password:    Admin@123            ║"
echo "║                                           ║"
echo "║   ⚠️  Change admin password immediately!   ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
```

```bash
chmod +x scripts/setup.sh
```

---

### `README.md`

````markdown
# Fashion E-Commerce Store

A full-stack fashion e-commerce platform built with Next.js 14, Supabase, Prisma, and AI features.

## Features

- 🛍️ Product catalog with categories, variants, filters, and search
- 🛒 Cart, checkout, and order management
- 💳 Payment gateways: JazzCash, EasyPaisa, Stripe, COD, Bank Transfer
- 🤖 AI shopping assistant (Claude API)
- 📊 Admin dashboard with analytics
- ⚡ Flash sale scheduler with server-synced countdown
- 🎁 Loyalty points system with tier progression
- 👔 Outfit Builder (curated looks)
- 📱 PWA (installable as mobile app)
- 🔔 Email notifications (order lifecycle + abandoned cart)
- 📋 B2B Quotation system with AI-drafted PDF

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone and Install

```bash
git clone https://github.com/your-repo/clothes-store.git
cd clothes-store
cp .env.example .env
```

### 2. Fill in Environment Variables

Open `.env` and fill in all values. The required ones to get started:

```env
# From Supabase Dashboard → Project Settings → Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

# From resend.com (free plan works)
RESEND_API_KEY="..."
```

All other keys (payments, AI, monitoring) are optional to start — the app works without them but those features will be disabled.

### 3. Run Setup Script

```bash
bash scripts/setup.sh
```

This installs dependencies, runs database migrations, and seeds the initial admin user.

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Admin login:**
- Email: `admin@store.com`
- Password: `Admin@123`
- ⚠️ **Change this password immediately after first login!**

## Deployment (Vercel)

1. Push to GitHub
2. Import repository in [Vercel Dashboard](https://vercel.com/new)
3. Add all environment variables in Vercel Settings → Environment Variables
4. Deploy

After deploying, run migrations:
```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
DATABASE_URL="your-production-url" npx prisma db seed
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | JWT (custom) + Google OAuth |
| UI | Tailwind CSS + Shadcn UI |
| State | Redux Toolkit |
| AI | Anthropic Claude API |
| Email | Resend |
| Storage | Cloudinary |
| Payments | JazzCash + EasyPaisa + Stripe |
| Deployment | Vercel |

## Environment Variables

See [`.env.example`](.env.example) — every variable is documented with where to get it.

## Database Schema

The complete schema is in [`prisma/schema.prisma`](prisma/schema.prisma). Customer onboarding:
1. Create Supabase project
2. Set `DATABASE_URL` and `DIRECT_URL` in `.env`
3. Run `npx prisma migrate deploy`
4. Done — no manual SQL required.
````

---

### `docs/admin-guide.md`

```markdown
# Admin Panel Guide

## Accessing the Admin Panel

URL: https://yourstore.com/admin
Default email: admin@store.com
Default password: Admin@123

⚠️ IMPORTANT: Change your password immediately at /admin/settings

## Section Overview

### Analytics
Real-time revenue dashboard showing:
- Today / This Month / YTD revenue
- Order counts by status
- Top-selling products
- Payment method breakdown
- Abandoned cart statistics

### Products
- Add new products with images, variants, and pricing
- Use "Generate with AI" to auto-write product descriptions
- Toggle products active/inactive without deleting
- Drag to reorder images; first image is the primary

### Orders
- View all orders with status, customer, and total
- Update order status: Pending → Confirmed → Processing → Shipped → Delivered
- Add tracking number when shipping
- Loyalty points are automatically awarded when status → Delivered

### Flash Sales
- Schedule time-limited sales with % discounts
- Set start and end times in UTC
- Assign specific products to each sale
- The system deactivates sales automatically when they expire

### Outfits (Look Book)
- Create styled outfit combinations (2-5 products)
- Add hero image and tags (occasion, season, gender)
- Toggle "Published" to show on the public Look Book page

### Quotations
- View incoming B2B quote requests
- Edit the AI-generated email draft before sending
- Generate and email PDF quotations
- Convert accepted quotations to orders

## Customer Data

⚠️ Never share customer emails, addresses, or order details externally.
```

---

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      DIRECT_URL: ${{ secrets.DIRECT_URL }}
      JWT_ACCESS_SECRET: test-access-secret-32-chars-minimum-x
      JWT_REFRESH_SECRET: test-refresh-secret-32-chars-minimum-x

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npx vitest run tests/unit

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: http://localhost:3000
```

---

### `tests/e2e/smoke.spec.ts`

**Production smoke test — runs against the live URL.**

```typescript
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

test.describe('Production smoke tests', () => {
  test('homepage loads', async ({ page }) => {
    const response = await page.goto(BASE_URL)
    expect(response?.status()).toBe(200)
    await expect(page.locator('header')).toBeVisible()
  })

  test('products API returns data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products?limit=4`)
    const json = await response.json()
    expect(response.status()).toBe(200)
    expect(json.success).toBe(true)
  })

  test('admin login works', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@store.com')
    await page.fill('input[type="password"]', 'Admin@123')
    await page.click('button[type="submit"]')
    // After login, should redirect to home or account
    await expect(page).not.toHaveURL(`${BASE_URL}/login`)
  })

  test('server time endpoint works', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/time`)
    const json = await response.json()
    expect(response.status()).toBe(200)
    expect(new Date(json.serverTime).getFullYear()).toBeGreaterThan(2020)
  })

  test('manifest.json is valid PWA manifest', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/manifest.json`)
    const json = await response.json()
    expect(json.name).toBeDefined()
    expect(json.icons).toBeDefined()
    expect(json.start_url).toBe('/')
  })
})
```

---

### Final Production Checklist

```markdown
## Pre-Launch Checklist

### Environment
- [ ] All .env variables set in Vercel dashboard
- [ ] DATABASE_URL points to production Supabase (not dev)
- [ ] JWT secrets are random 32+ char strings (not test values)
- [ ] NEXT_PUBLIC_APP_URL is the production domain
- [ ] NEXT_PUBLIC_WHATSAPP_NUMBER is the customer's WhatsApp

### Database
- [ ] `npx prisma migrate deploy` ran successfully
- [ ] `npx prisma db seed` ran — admin user + 4 categories exist
- [ ] Admin password changed from Admin@123

### Payments
- [ ] JazzCash: switched from sandbox to production endpoint URL
- [ ] EasyPaisa: switched from sandbox to production
- [ ] Stripe: switched from test keys to live keys
- [ ] Payment callback URLs point to production domain

### Features
- [ ] Register a new user → OTP email arrives
- [ ] Login works
- [ ] Browse products → Product detail page works
- [ ] Add to cart → CartDrawer opens
- [ ] Checkout with COD → Order created, confirmation email received
- [ ] Admin panel accessible at /admin
- [ ] Flash sale timer counts down correctly
- [ ] WhatsApp button opens correct number
- [ ] Lookbook page loads published outfits
- [ ] Lighthouse score > 85 on production URL

### Monitoring
- [ ] Sentry DSN connected — test error appears in Sentry
- [ ] GA4 tag fires on page load
- [ ] Vercel analytics enabled in dashboard

### Crons
- [ ] /api/cron/flash-sale-cleanup configured (every 15 min)
- [ ] /api/cron/abandoned-cart configured (every 15 min)
- [ ] CRON_SECRET set in Vercel env vars
```

---

## Acceptance Criteria

- [ ] `https://yourstore.vercel.app` loads with Lighthouse score ≥ 85
- [ ] Admin login works at `/admin` with seeded credentials
- [ ] New user can register, receive OTP email, verify, and login
- [ ] Place a COD order → order appears in admin `/admin/orders`
- [ ] Order status update in admin → customer receives email notification
- [ ] GitHub Actions CI passes on main branch (build + lint + tests)
- [ ] `bash scripts/setup.sh` completes without errors on a fresh clone
- [ ] Vercel crons show in dashboard and are scheduled
- [ ] Production smoke tests pass: `BASE_URL=https://yourstore.vercel.app npx playwright test`
- [ ] `README.md` is complete and readable
- [ ] `.env.example` has every variable used in the project

---

## Progress Tracker Updates

Mark all remaining items in `CLAUDE.md`:
```
[2026-04-29] Vercel deployment configured — done
[2026-04-29] Supabase production setup — done
[2026-04-29] CI/CD pipeline (GitHub Actions → auto-deploy on push) — done
[2026-04-29] Staging environment (separate from production) — done
[2026-04-29] Vercel Cron Jobs configured — done
[2026-04-29] .env.example completed for customer handoff — done
[2026-04-29] README with setup instructions — done
[2026-04-29] Admin user guide — done
[2026-04-29] GitHub repo handoff — done
[2026-04-29] Client handover meeting — done
```

---

## Customer Delivery Summary

Hand off to customer:
1. GitHub repository URL (private repo, add them as collaborator)
2. Vercel project URL + their login credentials
3. The `README.md` — they read this first
4. The `docs/admin-guide.md` — for day-to-day admin use
5. A Zoom/Meet session to walk through:
   - Admin panel demo (add product, process order, flash sale)
   - How to change WhatsApp number and other settings
   - How to deploy updates (git push → auto-deploys)
   - How to add staff accounts (role management)
6. After meeting: change admin password together
