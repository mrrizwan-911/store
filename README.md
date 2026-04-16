# Minimal Luxury E-Commerce Platform

A production-ready, full-stack AI-powered fashion e-commerce platform built for the Pakistan market. This project delivers a high-end, editorial shopping experience with deep local integration and intelligent features.

## 🚀 Technical Architecture

- **Framework**: [Next.js 14/15 (App Router)](https://nextjs.org/) for optimized SEO and performance.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for full-stack type safety.
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL) with [Prisma 7](https://www.prisma.io/) ORM.
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) for complex UI states (Cart, Auth, Wishlist).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) with custom B&W design tokens.
- **Authentication**: JWT (Access/Refresh Tokens) + manual Google OAuth implementation + OTP Verification.
- **AI Engine**: Integrated with Anthropic Claude & OpenAI for shopping assistants and size recommendations.
- **Payments**: Native support for JazzCash, EasyPaisa, HBL/Stripe, and Cash on Delivery.

## ✨ Core Features

### 🛍️ Storefront
- **High-End UI**: Minimalist B&W aesthetic with sharp corners and luxury typography.
- **Mega-Menu Navigation**: Deep category support for Clothes, Shoes, Apparel, and Accessories.
- **Interactive Shopping**: Real-time cart drawer, dynamic filters, and localized size guides.
- **WhatsApp Integration**: "Order via WhatsApp" one-click links and floating support widget.

### 🛡️ Security & Performance
- **Standardized Logging**: Unified logging system (logger.ts) for dev/prod separation.
- **Token Security**: Refresh token rotation and httpOnly cookie storage.
- **Rate Limiting**: Tiered protection for auth, checkout, and public API routes.
- **Optimized Assets**: Image delivery via Cloudinary CDN and `next/image`.

### 🤖 AI Capabilities
- **Shopping Assistant**: Natural language search and personalized recommendations.
- **Smart Size Recommender**: AI-driven size analysis based on user body inputs.
- **Automated Content**: AI product description generator for administrators.

## 🛠️ Getting Started

### 1. Installation
```bash
git clone <repository-url>
cd ecommerce
npm install
```

### 2. Environment Configuration
Populate `.env.local` using the templates provided in `.env.example`. You will need credentials for:
- Supabase PostgreSQL (Database)
- Resend (Email/OTP)
- Cloudinary (Image Storage)
- JWT Secrets (32+ chars)

### 3. Database Migration
Apply the schema and seed initial data (Admin user & Categories):
```bash
npx prisma db push
npm run seed
```

### 4. Local Development
```bash
npm run dev
```

## 🎨 Design Tokens
The project follows a **Minimal Luxury B&W** aesthetic:
- **Primary Color**: `#000000` (Pure Black)
- **Background**: `#FFFFFF` (Pure White)
- **Headings**: `Playfair Display`
- **Body UI**: `DM Sans`

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
