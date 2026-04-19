import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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
                variants: {
                  select: { id: true, size: true, color: true, price: true, stock: true }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!outfit || !outfit.isPublished) {
      return NextResponse.json({ success: false, error: 'Outfit not found' }, { status: 404 })
    }

    const itemCount = outfit.items.length
    const totalPrice = outfit.items.reduce((sum, item) => {
      const price = item.product.salePrice ?? item.product.basePrice
      return sum + Number(price)
    }, 0)

    const mappedOutfit = {
      ...outfit,
      itemCount,
      totalPrice
    }

    return NextResponse.json({ success: true, data: mappedOutfit })
  } catch (error) {
    console.error('Failed to fetch public outfit:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
