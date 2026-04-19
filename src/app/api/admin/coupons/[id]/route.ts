import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireAdmin } from '@/lib/utils/adminAuth';
import { logger } from '@/lib/utils/logger';
import { couponSchema } from '@/lib/validations/coupon';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authRes = await requireAdmin(req);
    if (authRes instanceof NextResponse) return authRes;
    const body = await req.json();

    // Allow partial updates (e.g., just toggling isActive)
    if (Object.keys(body).length === 1 && typeof body.isActive === 'boolean') {
      const coupon = await db.coupon.update({
        where: { id },
        data: { isActive: body.isActive },
      });
      return NextResponse.json({ success: true, data: coupon });
    }

    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { code, type, discountValue, minOrderValue, maxUses, expiresAt, isActive } = parsed.data;

    // Check code uniqueness if changing code
    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ success: false, error: "Coupon code already exists" }, { status: 400 });
    }

    const coupon = await db.coupon.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: coupon });
  } catch (err: any) {
    logger.error('UPDATE_COUPON_ERROR', err);
    return NextResponse.json({ success: false, error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authRes = await requireAdmin(req);
    if (authRes instanceof NextResponse) return authRes;
    await db.coupon.delete({ where: { id } });
    logger.info(`Coupon deleted: ${id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('DELETE_COUPON_ERROR', err);
    return NextResponse.json({ success: false, error: err.message }, { status: err.status || 500 });
  }
}
