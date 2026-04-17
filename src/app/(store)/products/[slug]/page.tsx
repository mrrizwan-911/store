import { notFound } from 'next/navigation'
import { db } from '@/lib/db/client'
import ProductDetailClient from '@/components/store/pdp/ProductDetailClient'
import { Metadata } from 'next'

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const product = await db.product.findUnique({
    where: { slug: resolvedParams.slug, isActive: true },
    select: { name: true, shortDescription: true, description: true }
  })

  if (!product) return { title: 'Product Not Found' }

  return {
    title: `${product.name} | Clothes Store`,
    description: product.shortDescription || product.description.substring(0, 160)
  }
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params
  const product = await db.product.findUnique({
    where: { slug: resolvedParams.slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Calculate avgRating and reviewCount
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null

  // Fetch related products (same category, excluding current product)
  const relatedProducts = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
    take: 4,
  })

  const enrichedProduct = {
    ...product,
    avgRating,
    reviewCount: product.reviews.length,
    // Ensure Decimal values are converted to Numbers or Strings for client components
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    variants: product.variants.map(v => ({
      ...v,
      price: v.price ? Number(v.price) : null
    }))
  }

  const enrichedRelatedProducts = relatedProducts.map(p => ({
    ...p,
    basePrice: Number(p.basePrice),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
  }))

  return (
    <main className="min-h-screen bg-background pt-20">
      <ProductDetailClient
        product={enrichedProduct as any}
        relatedProducts={enrichedRelatedProducts as any}
      />
    </main>
  )
}
