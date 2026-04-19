import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [todayStats, monthStats, ytdStats, byPaymentMethod, activeOrders] = await Promise.all([
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfToday } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfYear } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.groupBy({
      by: ['method'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    }),
    db.order.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] } },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      today: { revenue: Number(todayStats._sum.amount ?? 0), orders: todayStats._count },
      thisMonth: { revenue: Number(monthStats._sum.amount ?? 0), orders: monthStats._count },
      ytd: { revenue: Number(ytdStats._sum.amount ?? 0), orders: ytdStats._count },
      activeOrders,
      byPaymentMethod: byPaymentMethod.map(m => ({
        method: m.method,
        revenue: Number(m._sum.amount ?? 0),
        count: m._count,
      })),
    },
  })
}
