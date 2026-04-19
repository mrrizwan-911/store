import { db } from '@/lib/db/client'
import { ProductForm } from '@/components/admin/ProductForm'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="p-8">
      <h1 className="font-playfair text-3xl font-bold text-[#000000] mb-8">Add New Product</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
