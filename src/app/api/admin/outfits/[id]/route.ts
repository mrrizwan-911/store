import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { outfitSchema } from '@/lib/validations/outfit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
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
      return NextResponse.json({ success: false, error: 'Outfit not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: outfit })
  } catch (error) {
    console.error('Failed to fetch outfit:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const resolvedParams = await params;
    const body = await req.json()
    const parsed = outfitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { productIds, ...outfitData } = parsed.data

    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ success: false, error: 'One or more products not found or inactive' }, { status: 404 })
    }

    // Delete existing items and recreate to maintain sortOrder and exact list
    await db.outfitItem.deleteMany({ where: { outfitId: resolvedParams.id } })

    const outfit = await db.outfit.update({
      where: { id: resolvedParams.id },
      data: {
        ...outfitData,
        items: {
          create: productIds.map((productId, index) => ({ productId, sortOrder: index })),
        },
      },
      include: { items: { include: { product: true }, orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json({ success: true, data: outfit })
  } catch (error) {
    console.error('Failed to update outfit:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const resolvedParams = await params;
    await db.outfit.delete({ where: { id: resolvedParams.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete outfit:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
