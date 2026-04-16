import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'
import { signAccessToken } from '@/lib/auth/jwt'
import { POST as submitReview } from '@/app/api/products/[slug]/reviews/route'
import { logger } from '@/lib/utils/logger'

async function truncateDb() {
  const tables: { tablename: string }[] = await db.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != '_prisma_migrations';
  `

  if (tables.length > 0) {
    const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ')
    try {
      await db.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`)
    } catch (error) {
      logger.error('Failed to truncate tables', error, { tableNames })
    }
  }
}

describe('Product Reviews Integration Tests', () => {
  const testUser = {
    id: 'user-123',
    email: 'reviewer@example.com',
    name: 'Test Reviewer',
  }

  const testProduct = {
    id: 'prod-123',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product description',
    categoryId: 'cat-123',
    basePrice: 100,
    sku: 'TEST-SKU',
  }

  const testCategory = {
    id: 'cat-123',
    name: 'Test Category',
    slug: 'test-category',
  }

  let accessToken: string

  beforeEach(async () => {
    await truncateDb()

    // Create common resources
    await db.category.create({ data: testCategory })
    await db.product.create({ data: testProduct })
    await db.user.create({
      data: {
        ...testUser,
        passwordHash: 'hashed_password',
        isVerified: true,
      },
    })

    accessToken = signAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: 'CUSTOMER',
    })
  })

  it('Case 1: should set isVerified to true for a user with a DELIVERED order', async () => {
    // 1. Create a delivered order for this user and product
    const order = await db.order.create({
      data: {
        userId: testUser.id,
        status: 'DELIVERED',
        subtotal: 100,
        shippingCost: 0,
        total: 100,
        items: {
          create: {
            productId: testProduct.id,
            quantity: 1,
            price: 100,
          },
        },
      },
    })

    // 2. Submit review
    const req = new NextRequest(`http://localhost/api/products/${testProduct.slug}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        title: 'Great product',
        body: 'I really loved this item!',
      }),
    })

    const res = await submitReview(req, { params: Promise.resolve({ slug: testProduct.slug }) })
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.isVerified).toBe(true)

    // Verify in DB
    const review = await db.review.findFirst({
      where: { userId: testUser.id, productId: testProduct.id },
    })
    expect(review?.isVerified).toBe(true)
  })

  it('Case 2: should set isVerified to false for a user without a DELIVERED order', async () => {
    // Create a new product and user to avoid conflicts
    const userNoOrder = await db.user.create({
      data: {
        id: 'user-no-order',
        email: 'noorder@example.com',
        name: 'No Order User',
        passwordHash: 'hashed_password',
        isVerified: true,
      },
    })

    const token = signAccessToken({
      userId: userNoOrder.id,
      email: userNoOrder.email,
      role: 'CUSTOMER',
    })

    // Create a PENDING order (not DELIVERED)
    await db.order.create({
      data: {
        userId: userNoOrder.id,
        status: 'PENDING',
        subtotal: 100,
        shippingCost: 0,
        total: 100,
        items: {
          create: {
            productId: testProduct.id,
            quantity: 1,
            price: 100,
          },
        },
      },
    })

    const req = new NextRequest(`http://localhost/api/products/${testProduct.slug}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating: 4,
        title: 'Decent',
        body: 'Not bad, but I havent received it yet.',
      }),
    })

    const res = await submitReview(req, { params: Promise.resolve({ slug: testProduct.slug }) })
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.isVerified).toBe(false)

    // Verify in DB
    const review = await db.review.findFirst({
      where: { userId: userNoOrder.id, productId: testProduct.id },
    })
    expect(review?.isVerified).toBe(false)
  })

  it('Case 3: should return 409 Conflict for duplicate reviews', async () => {
    // 1. Create an initial review
    await db.review.create({
      data: {
        productId: testProduct.id,
        userId: testUser.id,
        rating: 5,
        body: 'Initial review',
      },
    })

    // 2. Attempt to submit a duplicate review
    const req = new NextRequest(`http://localhost/api/products/${testProduct.slug}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        rating: 1,
        title: 'Duplicate',
        body: 'Trying to review again.',
      }),
    })

    const res = await submitReview(req, { params: Promise.resolve({ slug: testProduct.slug }) })
    const data = await res.json()

    expect(res.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toContain('already reviewed')
  })
})
