import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search')
  const skip = (page - 1) * limit

  const whereClause: any = { role: 'CUSTOMER' }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      include: {
        orders: {
          select: { total: true },
          where: { status: { not: 'CANCELLED' } }
        },
        loyalty: { select: { tier: true, points: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.user.count({ where: whereClause })
  ])

  const customers = users.map(user => {
    const ltv = user.orders.reduce((sum, order) => sum + Number(order.total), 0)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      orderCount: user.orders.length,
      ltv,
      tier: user.loyalty?.tier || 'BRONZE',
      points: user.loyalty?.points || 0
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  })
}
