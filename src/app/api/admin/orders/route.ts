import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { OrderStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const skip = (page - 1) * limit

  const whereClause: any = {}

  if (status) {
    whereClause.status = status as OrderStatus
  }

  if (search) {
    whereClause.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        payment: { select: { method: true, status: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.order.count({ where: whereClause })
  ])

  return NextResponse.json({
    success: true,
    data: {
      orders: orders.map(o => ({
        ...o,
        itemCount: o._count.items
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  })
}
