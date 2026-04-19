import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/utils/adminAuth";
import { logger } from "@/lib/utils/logger";
import { quotationUpdateSchema } from "@/lib/validations/quotation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const { id } = await params;
    const body = await req.json();

    const validatedData = quotationUpdateSchema.parse(body);

    const quotation = await db.quotation.update({
      where: { id },
      data: {
        ...validatedData,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: quotation });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: error.issues?.[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    logger.error("Failed to update quotation", error as Error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
