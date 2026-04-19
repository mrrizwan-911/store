import { db } from '@/lib/db/client'
import { OutfitCard } from '@/components/store/OutfitCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LookbookPage({ searchParams }: { searchParams: Promise<{ gender?: string; season?: string; occasion?: string }> }) {
  const params = await searchParams;
  const whereClause: any = { isPublished: true }

  if (params.gender && params.gender !== 'All') {
    whereClause.gender = params.gender
  }
  if (params.season && params.season !== 'All') {
    whereClause.season = params.season
  }
  if (params.occasion && params.occasion !== 'All') {
    whereClause.occasion = params.occasion
  }

  const outfits = await db.outfit.findMany({
    where: whereClause,
    include: {
      items: {
        include: {
          product: { select: { id: true, basePrice: true, salePrice: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const mappedOutfits = outfits.map(outfit => {
    const itemCount = outfit.items.length
    const totalPrice = outfit.items.reduce((sum, item) => {
      const price = item.product.salePrice ?? item.product.basePrice
      return sum + Number(price)
    }, 0)

    return { ...outfit, itemCount, totalPrice }
  })

  // Simple tabs for filters (can be expanded)
  const filters = ['All', 'Men', 'Women', 'Casual', 'Formal', 'Festive', 'Winter', 'Summer']

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-4">The Look Book</h1>
        <p className="text-[#737373] text-lg">Complete outfits curated by our stylists</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {filters.map(filter => {
          let href = '/lookbook'
          if (filter !== 'All') {
            const isGender = ['Men', 'Women'].includes(filter)
            const isOccasion = ['Casual', 'Formal', 'Festive'].includes(filter)
            const isSeason = ['Winter', 'Summer'].includes(filter)

            if (isGender) href = `/lookbook?gender=${filter}`
            if (isOccasion) href = `/lookbook?occasion=${filter}`
            if (isSeason) href = `/lookbook?season=${filter}`
          }

          const isActive =
            (filter === 'All' && !params.gender && !params.season && !params.occasion) ||
            params.gender === filter ||
            params.season === filter ||
            params.occasion === filter

          return (
            <Link
              key={filter}
              href={href}
              className={`px-4 py-2 text-sm uppercase tracking-widest border transition-colors ${
                isActive
                  ? 'border-[#000000] bg-[#000000] text-white'
                  : 'border-[#E5E5E5] text-[#737373] hover:border-[#000000] hover:text-[#000000]'
              }`}
            >
              {filter}
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mappedOutfits.map(outfit => (
          <OutfitCard key={outfit.id} outfit={outfit} />
        ))}
      </div>

      {mappedOutfits.length === 0 && (
        <div className="text-center py-24 text-[#737373]">
          <p>No outfits found for these filters.</p>
        </div>
      )}
    </div>
  )
}
