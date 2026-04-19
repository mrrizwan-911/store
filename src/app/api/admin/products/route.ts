import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { productSchema, generateSlug } from '@/lib/validations/admin'
import { logger } from '@/lib/utils/logger'

export async function GET(req: Request) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      db.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          variants: true,
          images: true,
        },
      }),
      db.product.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error: any) {
    logger.error('Failed to fetch admin products', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const body = await req.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const slug = data.slug || generateSlug(data.name)

    // Check if slug or SKU already exists
    const existingProduct = await db.product.findFirst({
      where: {
        OR: [{ slug }, { sku: data.sku }],
      },
    })

    if (existingProduct) {
      if (existingProduct.sku === data.sku) {
        return NextResponse.json({ success: false, error: 'SKU already exists' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 })
    }

    // Check if variant SKUs already exist
    if (data.variants.length > 0) {
      const variantSkus = data.variants.map((v) => v.sku)
      const uniqueSkus = new Set(variantSkus)
      if (uniqueSkus.size !== variantSkus.length) {
        return NextResponse.json({ success: false, error: 'Variant SKUs must be unique' }, { status: 400 })
      }
      const existingVariants = await db.productVariant.findMany({
        where: { sku: { in: variantSkus } },
      })
      if (existingVariants.length > 0) {
        return NextResponse.json({ success: false, error: 'One or more variant SKUs already exist' }, { status: 409 })
      }
    }

    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        sku: data.sku,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        tags: data.tags,
        variants: {
          create: data.variants,
        },
      },
      include: {
        variants: true,
      },
    })

    logger.info('Created product', { productId: product.id })

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    logger.error('Failed to create product', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 })
  }
}
