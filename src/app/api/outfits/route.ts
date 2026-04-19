import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gender = searchParams.get('gender')
    const season = searchParams.get('season')
    const occasion = searchParams.get('occasion')

    const whereClause: any = { isPublished: true }

    // We only want to filter if the parameter is provided AND it's not "All"
    if (gender && gender !== 'All') {
      whereClause.gender = gender
    }
    if (season && season !== 'All') {
      whereClause.season = season
    }
    if (occasion && occasion !== 'All') {
      whereClause.occasion = occasion
    }

    const outfits = await db.outfit.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, basePrice: true, images: true, salePrice: true }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map the outfits to include calculated fields like item count and total price
    const mappedOutfits = outfits.map(outfit => {
      const itemCount = outfit.items.length
      const totalPrice = outfit.items.reduce((sum, item) => {
        const price = item.product.salePrice ?? item.product.basePrice
        return sum + Number(price)
      }, 0)

      return {
        ...outfit,
        itemCount,
        totalPrice
      }
    })

    return NextResponse.json({ success: true, data: { outfits: mappedOutfits } })
  } catch (error) {
    console.error('Failed to fetch public outfits:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
