import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireAdmin } from '@/lib/utils/adminAuth';
import { logger } from '@/lib/utils/logger';
import { couponSchema } from '@/lib/validations/coupon';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: coupons });
  } catch (err: any) {
    logger.error('GET_COUPONS_ERROR', err);
    return NextResponse.json({ success: false, error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { code, type, discountValue, minOrderValue, maxUses, expiresAt, isActive } = parsed.data;

    // Check if code exists
    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Coupon code already exists" }, { status: 400 });
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        discountPct: type === 'PERCENTAGE' ? discountValue : null,
        discountFlat: type === 'FLAT' ? discountValue : null,
        minOrderValue,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
      }
    });

    logger.info(`Coupon created: ${code}`);
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (err: any) {
    logger.error('CREATE_COUPON_ERROR', err);
    return NextResponse.json({ success: false, error: err.message }, { status: err.status || 500 });
  }
}
