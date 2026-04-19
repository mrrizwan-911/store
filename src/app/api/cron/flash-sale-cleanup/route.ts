import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const [deactivated, activated] = await Promise.all([
      // Deactivate sales that have ended
      db.flashSale.updateMany({
        where: { isActive: true, endTime: { lt: now } },
        data: { isActive: false },
      }),
      // Activate sales that have started and not yet ended
      db.flashSale.updateMany({
        where: { isActive: false, startTime: { lte: now }, endTime: { gte: now } },
        data: { isActive: true },
      }),
    ])

    logger.info('Cron: Flash sale cleanup completed', {
      deactivated: deactivated.count,
      activated: activated.count,
    })

    return NextResponse.json({
      success: true,
      data: { deactivated: deactivated.count, activated: activated.count },
    })
  } catch (error: any) {
    logger.error('Cron: Failed to clean up flash sales', { error: error.message })
    return NextResponse.json(
      { success: false, error: 'Failed to clean up flash sales' },
      { status: 500 }
    )
  }
}
