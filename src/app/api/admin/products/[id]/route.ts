import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { productSchema, generateSlug } from '@/lib/validations/admin'
import { logger } from '@/lib/utils/logger'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const product = await db.product.findUnique({
      where: { id: (await context.params).id },
      include: {
        variants: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    logger.error('Failed to fetch product', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
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

    // Ensure we are not conflicting with another product's SKU or slug
    const existingProduct = await db.product.findFirst({
      where: {
        id: { not: (await context.params).id },
        OR: [{ slug }, { sku: data.sku }],
      },
    })

    if (existingProduct) {
      if (existingProduct.sku === data.sku) {
        return NextResponse.json({ success: false, error: 'SKU already exists' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 })
    }

    // Check variant SKUs against other products
    if (data.variants.length > 0) {
      const variantSkus = data.variants.map((v) => v.sku)
      const uniqueSkus = new Set(variantSkus)
      if (uniqueSkus.size !== variantSkus.length) {
        return NextResponse.json({ success: false, error: 'Variant SKUs must be unique' }, { status: 400 })
      }
      const existingVariants = await db.productVariant.findMany({
        where: {
          productId: { not: (await context.params).id },
          sku: { in: variantSkus },
        },
      })
      if (existingVariants.length > 0) {
        return NextResponse.json({ success: false, error: 'One or more variant SKUs already exist on another product' }, { status: 409 })
      }
    }

    // Since Prisma doesn't support nested set for replacing the whole array easily with updates,
    // we delete existing variants and create the new ones
    await db.productVariant.deleteMany({
      where: { productId: (await context.params).id },
    })

    const product = await db.product.update({
      where: { id: (await context.params).id },
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

    logger.info('Updated product', { productId: product.id })

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    logger.error('Failed to update product', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    // Soft delete: deactivate product
    const product = await db.product.update({
      where: { id: (await context.params).id },
      data: { isActive: false },
    })

    logger.info('Deactivated product', { productId: product.id })

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    logger.error('Failed to deactivate product', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to deactivate product' }, { status: 500 })
  }
}
