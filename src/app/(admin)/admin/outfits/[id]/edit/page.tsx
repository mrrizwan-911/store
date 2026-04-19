import { OutfitBuilder } from '@/components/admin/OutfitBuilder'
import { db } from '@/lib/db/client'
import { notFound } from 'next/navigation'

export default async function EditOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const outfit = await db.outfit.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, basePrice: true, images: true } }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!outfit) {
    notFound()
  }

  // Pass it as initialData
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold">Edit Outfit</h1>
      </div>
      <OutfitBuilder initialData={outfit} />
    </div>
  )
}
