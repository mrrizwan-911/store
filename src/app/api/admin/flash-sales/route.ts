import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { flashSaleSchema } from '@/lib/validations/admin'
import { logger } from '@/lib/utils/logger'

export async function GET(req: Request) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const flashSales = await db.flashSale.findMany({
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json({ success: true, data: flashSales })
  } catch (error: any) {
    logger.error('Failed to fetch flash sales', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to fetch flash sales' }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const flashSale = await db.flashSale.create({
      data: {
        name: data.name,
        discountPct: data.discountPct,
        startTime,
        endTime,
        productIds: data.productIds,
        isActive: startTime <= now && endTime >= now,
      },
    })

    logger.info('Created flash sale', { flashSaleId: flashSale.id })

    return NextResponse.json({ success: true, data: flashSale })
  } catch (error: any) {
    logger.error('Failed to create flash sale', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to create flash sale' }, { status: 500 })
  }
}
