import { db } from '@/lib/db/client'
import { FlashSaleForm } from '@/components/admin/FlashSaleForm'

export const dynamic = 'force-dynamic'

export default async function NewFlashSalePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, basePrice: true },
    orderBy: { name: 'asc' },
  })

  // Map to match the props expected by FlashSaleForm
  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.basePrice),
  }))

  return (
    <div className="p-8">
      <h1 className="font-playfair text-3xl font-bold text-[#000000] mb-8">Create Flash Sale</h1>
      <FlashSaleForm products={formattedProducts} />
    </div>
  )
}
