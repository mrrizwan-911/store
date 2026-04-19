import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { outfitSchema } from '@/lib/validations/outfit'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const outfits = await db.outfit.findMany({
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, basePrice: true, images: true }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: outfits })
  } catch (error) {
    console.error('Failed to fetch outfits:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await req.json()
    const parsed = outfitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { productIds, ...outfitData } = parsed.data

    // Verify all products exist and are active
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ success: false, error: 'One or more products not found or inactive' }, { status: 404 })
    }

    const outfit = await db.outfit.create({
      data: {
        ...outfitData,
        items: {
          create: productIds.map((productId, index) => ({ productId, sortOrder: index })),
        },
      },
      include: { items: { include: { product: true }, orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json({ success: true, data: outfit }, { status: 201 })
  } catch (error) {
    console.error('Failed to create outfit:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
