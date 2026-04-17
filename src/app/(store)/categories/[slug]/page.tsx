import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { notFound } from 'next/navigation'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams

  // Verify category exists
  const activeCategory = await db.category.findUnique({
    where: { slug, isActive: true },
    select: { name: true, description: true },
  })

  if (!activeCategory) {
    notFound()
  }

  // Parse search params
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const size = (resolvedSearchParams.size as string) || undefined
  const color = (resolvedSearchParams.color as string) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  const [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  // Construct Prisma where clause
  const where = {
    isActive: true,
    category: { slug },
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

  // Fetch data
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

  // Process products
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
      title={activeCategory.name}
      subtitle={activeCategory.description || `Refined collection in ${activeCategory.name}.`}
    />
  )
}
