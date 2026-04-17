import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams

  // Parse search params
  const category = (resolvedSearchParams.category as string) || undefined
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const size = (resolvedSearchParams.size as string) || undefined
  const color = (resolvedSearchParams.color as string) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  const [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  // Construct Prisma where clause
  const where = {
    isActive: true,
    ...(category && { category: { slug: category } }),
    basePrice: { gte: minPrice, lte: maxPrice },
    ...(size || color
      ? {
          variants: {
            some: {
              ...(size && { size: { in: size.split(',') } }),
              ...(color && { color: { in: color.split(',') } }),
              stock: { gt: 0 },
            },
          },
        }
      : {}),
  }

  // Fetch data in parallel
  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: { select: { size: true, color: true, stock: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { [sortField]: sortDir },
      take: 24,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  // Process ratings
  const enrichedProducts = products.map((p) => {
    const avgRating =
      p.reviews.length > 0 ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length : null
    return {
      ...p,
      avgRating,
      reviewCount: p.reviews.length,
      reviews: undefined,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }
  })

  return (
    <ProductListingClient
      initialProducts={enrichedProducts}
      initialTotal={total}
      categories={categories}
      title="All Products"
      subtitle="Refined essentials for the modern wardrobe."
    />
  )
}
