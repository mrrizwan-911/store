import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { productFilterSchema } from '@/lib/validations/products'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const parsedParams = productFilterSchema.safeParse(Object.fromEntries(searchParams.entries()))

  if (!parsedParams.success) {
    return NextResponse.json({ success: false, error: 'Invalid query parameters' }, { status: 400 })
  }

  const {
    page = 1,
    limit = 24,
    category,
    minPrice = 0,
    maxPrice = 999999,
    size,
    color,
    sort = 'createdAt_desc',
    search,
    featured,
  } = parsedParams.data

  const [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  const where = {
    isActive: true,
    ...(featured && { isFeatured: true }),
    ...(category && { category: { slug: category } }),
    basePrice: { gte: minPrice, lte: maxPrice },
    ...(size || color
      ? {
          variants: {
            some: {
              ...(size && { size }),
              ...(color && { color }),
              stock: { gt: 0 }
            }
          }
        }
      : {}),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  try {
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

    const enrichedProducts = products.map(p => {
      const avgRating = p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : null

      return {
        ...p,
        avgRating,
        reviewCount: p.reviews.length,
        reviews: undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        products: enrichedProducts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
