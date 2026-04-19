import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const statusCounts = await db.order.groupBy({
    by: ['status'],
    _count: true,
  })

  const mapped = statusCounts.map(item => ({
    status: item.status,
    count: item._count,
  }))

  return NextResponse.json({ success: true, data: mapped })
}
