import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireAdmin } from '@/lib/utils/adminAuth';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const updateStockSchema = z.object({
  stock: z.number().int().min(0, 'Stock cannot be negative'),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authRes = await requireAdmin(req);
    if (authRes instanceof NextResponse) return authRes;

    const body = await req.json();

    const validation = updateStockSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { stock } = validation.data;

    const variant = await db.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    const updatedVariant = await db.productVariant.update({
      where: { id },
      data: { stock },
    });

    logger.info(`Stock updated for variant ${id}`, {
      variantId: id,
      oldStock: variant.stock,
      newStock: stock,
      adminId: authRes,
    });

    return NextResponse.json({
      success: true,
      data: updatedVariant,
    });
  } catch (error) {
    logger.error('Failed to update stock', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
