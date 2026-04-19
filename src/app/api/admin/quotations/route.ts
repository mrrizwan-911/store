import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/utils/adminAuth";
import { logger } from "@/lib/utils/logger";
import { QuotationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as QuotationStatus | null;

    const quotations = await db.quotation.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: quotations });
  } catch (error) {
    logger.error("Failed to fetch quotations", error as Error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
