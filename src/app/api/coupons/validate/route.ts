import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { validateCouponSchema } from '@/lib/validations/coupon'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = validateCouponSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('Invalid coupon validate data', { issues: parsed.error.issues })
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { code, orderValue } = parsed.data
  logger.info('Validating coupon', { code, orderValue })

  const coupon = await db.coupon.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 404 })
  }

  const now = new Date()
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return NextResponse.json({ success: false, error: 'This coupon has expired' }, { status: 400 })
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ success: false, error: 'This coupon is no longer available' }, { status: 400 })
  }

  if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) {
    return NextResponse.json({ success: false, error: `Minimum order value of PKR ${coupon.minOrderValue} required for this coupon` }, { status: 400 })
  }

  let discountAmount = 0
  if (coupon.discountPct) {
    discountAmount = Math.floor((Number(coupon.discountPct) / 100) * orderValue)
  } else if (coupon.discountFlat) {
    discountAmount = Number(coupon.discountFlat)
  }

  // Discount shouldn't exceed order value
  discountAmount = Math.min(discountAmount, orderValue)

  const newTotal = orderValue - discountAmount

  return NextResponse.json({
    success: true,
    data: {
      code: coupon.code,
      discountPct: coupon.discountPct ? Number(coupon.discountPct) : null,
      discountFlat: coupon.discountFlat ? Number(coupon.discountFlat) : null,
      discountAmount,
      newTotal
    }
  })
}
