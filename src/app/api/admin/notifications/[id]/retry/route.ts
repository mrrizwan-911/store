import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAdmin(req)
  if (authRes instanceof NextResponse) return authRes

  const { id } = params

  try {
    const log = await db.emailLog.findUnique({
      where: { id },
    })

    if (!log) {
      return NextResponse.json({ error: 'Notification log not found' }, { status: 404 })
    }

    logger.info(`Admin ${authRes} triggered email retry for log ID: ${id}`, {
      email: log.email,
      type: log.type,
    })

    // Return a stubbed success response as per instructions
    return NextResponse.json(
      { success: true, message: "Retry triggered (stubbed)" },
      { status: 200 }
    )
  } catch (error) {
    logger.error(`Error retrying notification: ${id}`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
