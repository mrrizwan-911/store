import { db } from '@/lib/db/client'
import { OutfitDetail } from '@/components/store/OutfitDetail'
import { notFound } from 'next/navigation'

export default async function SingleOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const outfit = await db.outfit.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              images: true,
              description: true,
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!outfit || !outfit.isPublished) {
    notFound()
  }

  const itemCount = outfit.items.length
  const totalPrice = outfit.items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.basePrice
    return sum + Number(price)
  }, 0)

  const mappedOutfit = {
    ...outfit,
    items: outfit.items.map(item => ({
      ...item,
      product: {
        ...item.product,
        basePrice: item.product.basePrice.toString(),
        salePrice: item.product.salePrice ? item.product.salePrice.toString() : null,
      }
    })),
    itemCount,
    totalPrice
  }

  return <OutfitDetail outfit={mappedOutfit} />
}
