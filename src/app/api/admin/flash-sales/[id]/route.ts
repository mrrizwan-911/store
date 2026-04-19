import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { flashSaleSchema } from '@/lib/validations/admin'
import { logger } from '@/lib/utils/logger'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const flashSale = await db.flashSale.findUnique({
      where: { id: (await context.params).id },
    })

    if (!flashSale) {
      return NextResponse.json({ success: false, error: 'Flash sale not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: flashSale })
  } catch (error: any) {
    logger.error('Failed to fetch flash sale', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to fetch flash sale' }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const body = await req.json()
    const parsed = flashSaleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const now = new Date()
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)

    // Check if products exist
    const products = await db.product.findMany({
      where: { id: { in: data.productIds } },
    })
    if (products.length !== data.productIds.length) {
      return NextResponse.json({ success: false, error: 'Some products do not exist' }, { status: 400 })
    }

    const flashSale = await db.flashSale.update({
      where: { id: (await context.params).id },
      data: {
        name: data.name,
        discountPct: data.discountPct,
        startTime,
        endTime,
        productIds: data.productIds,
        isActive: startTime <= now && endTime >= now,
      },
    })

    logger.info('Updated flash sale', { flashSaleId: flashSale.id })

    return NextResponse.json({ success: true, data: flashSale })
  } catch (error: any) {
    logger.error('Failed to update flash sale', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to update flash sale' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    await db.flashSale.delete({
      where: { id: (await context.params).id },
    })

    logger.info('Deleted flash sale', { flashSaleId: (await context.params).id })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to delete flash sale', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to delete flash sale' }, { status: 500 })
  }
}
