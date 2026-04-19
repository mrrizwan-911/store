import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const topProductsRaw = await db.orderItem.groupBy({
    by: ['productId'],
    where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } } },
    _sum: { quantity: true, price: true },
    _count: true,
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  })

  // Fetch product details for the IDs
  const productIds = topProductsRaw.map(p => p.productId)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      variants: { select: { stock: true } },
      category: { select: { name: true } }
    },
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  const topProducts = topProductsRaw.map(raw => {
    const p = productMap.get(raw.productId)
    const stock = p?.variants.reduce((sum, v) => sum + v.stock, 0) || 0
    return {
      productId: raw.productId,
      name: p?.name || 'Unknown Product',
      category: p?.category?.name || 'Unknown Category',
      stock: stock,
      unitsSold: raw._sum.quantity || 0,
      revenue: Number(raw._sum.price || 0) * Number(raw._sum.quantity || 0),
    }
  })

  return NextResponse.json({ success: true, data: topProducts })
}
