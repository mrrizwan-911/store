import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'
import { GET as getProducts } from '@/app/api/products/route'
import { GET as getProductBySlug } from '@/app/api/products/[slug]/route'

describe('Product API Integration Tests', () => {
  let category1Id: string
  let category2Id: string
  const timestamp = Date.now()
  const menSlug = `men-${timestamp}`
  const womenSlug = `women-${timestamp}`

  beforeAll(async () => {
    // Seed categories with unique slugs for this run
    const cat1 = await db.category.create({
      data: { name: 'Men', slug: menSlug },
    })
    category1Id = cat1.id

    const cat2 = await db.category.create({
      data: { name: 'Women', slug: womenSlug },
    })
    category2Id = cat2.id

    // Seed products
    await db.product.create({
      data: {
        name: 'Men T-Shirt',
        slug: `men-t-shirt-${timestamp}`,
        description: 'A comfortable men t-shirt',
        basePrice: 20.0,
        sku: `M-TS-001-${timestamp}`,
        categoryId: category1Id,
        isActive: true,
        isFeatured: true,
        variants: {
          create: [
            { size: 'M', color: 'Blue', stock: 10, sku: `M-TS-001-M-B-${timestamp}` },
            { size: 'L', color: 'Blue', stock: 5, sku: `M-TS-001-L-B-${timestamp}` },
          ],
        },
      },
    })

    await db.product.create({
      data: {
        name: 'Women Dress',
        slug: `women-dress-${timestamp}`,
        description: 'An elegant women dress',
        basePrice: 50.0,
        sku: `W-DR-001-${timestamp}`,
        categoryId: category2Id,
        isActive: true,
        isFeatured: false,
        variants: {
          create: [
            { size: 'S', color: 'Red', stock: 8, sku: `W-DR-001-S-R-${timestamp}` },
          ],
        },
      },
    })

    await db.product.create({
      data: {
        name: 'Unisex Hoodie',
        slug: `unisex-hoodie-${timestamp}`,
        description: 'Warm unisex hoodie',
        basePrice: 35.0,
        sku: `U-HO-001-${timestamp}`,
        categoryId: category1Id,
        isActive: true,
        isFeatured: false,
        variants: {
          create: [
            { size: 'XL', color: 'Black', stock: 15, sku: `U-HO-001-XL-BL-${timestamp}` },
          ],
        },
      },
    })
  })

  it('should fetch all active products', async () => {
    const req = new NextRequest('http://localhost/api/products')
    const res = await getProducts(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    // There might be more products from other runs if truncation fails, but at least 3
    expect(data.data.products.length).toBeGreaterThanOrEqual(3)
  })

  it('should filter products by category slug', async () => {
    const req = new NextRequest(`http://localhost/api/products?category=${womenSlug}`)
    const res = await getProducts(req)
    const data = await res.json()

    expect(data.data.products).toHaveLength(1)
    expect(data.data.products[0].name).toBe('Women Dress')
  })

  it('should filter products by price range', async () => {
    const req = new NextRequest(`http://localhost/api/products?minPrice=25&maxPrice=55&category=${menSlug}`)
    const res = await getProducts(req)
    const data = await res.json()

    // Just Unisex Hoodie (35) in Men category
    expect(data.data.products).toHaveLength(1)
    expect(data.data.products[0].name).toBe('Unisex Hoodie')
  })

  it('should filter products by size and color', async () => {
    const req = new NextRequest('http://localhost/api/products?size=M&color=Blue')
    const res = await getProducts(req)
    const data = await res.json()

    expect(data.data.products.length).toBeGreaterThanOrEqual(1)
    expect(data.data.products.find((p: any) => p.name === 'Men T-Shirt')).toBeDefined()
  })

  it('should sort products by basePrice ascending', async () => {
    const req = new NextRequest(`http://localhost/api/products?sort=basePrice_asc&category=${menSlug}`)
    const res = await getProducts(req)
    const data = await res.json()

    expect(data.data.products[0].name).toBe('Men T-Shirt') // 20
    expect(data.data.products[1].name).toBe('Unisex Hoodie') // 35
  })

  it('should fetch a single product by slug', async () => {
    const slug = `men-t-shirt-${timestamp}`
    const req = new NextRequest(`http://localhost/api/products/${slug}`)
    const res = await getProductBySlug(req, {
      params: Promise.resolve({ slug }),
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Men T-Shirt')
    expect(data.data.category.slug).toBe(menSlug)
    expect(data.data.variants).toHaveLength(2)
  })

  it('should return 404 for non-existent product', async () => {
    const req = new NextRequest('http://localhost/api/products/non-existent')
    const res = await getProductBySlug(req, {
      params: Promise.resolve({ slug: 'non-existent' }),
    })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.success).toBe(false)
  })
})
