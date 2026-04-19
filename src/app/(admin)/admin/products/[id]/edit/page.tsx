import { db } from '@/lib/db/client'
import { ProductForm } from '@/components/admin/ProductForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProductPage(context: { params: Promise<{ id: string }> }) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id: (await context.params).id },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!product) {
    notFound()
  }

  // Map to fit the form's expected input
  const initialData = {
    ...product,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    variants: product.variants.map((v) => ({
      size: v.size || undefined,
      color: v.color || undefined,
      stock: v.stock,
      sku: v.sku,
      price: v.price ? Number(v.price) : null,
    })),
  }

  return (
    <div className="p-8">
      <h1 className="font-playfair text-3xl font-bold text-[#000000] mb-8">Edit Product</h1>
      <ProductForm initialData={initialData as any} categories={categories} />
    </div>
  )
}
