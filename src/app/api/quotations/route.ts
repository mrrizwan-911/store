import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";
import { quotationSchema } from "@/lib/validations/quotation";
import { QuotationStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    logger.request("Public quotation creation request", body);

    const validatedData = quotationSchema.parse(body);
    logger.info("Quotation validated data", { validatedData });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create a plain object for data to ensure no prototype issues
    const data: any = {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || null,
      company: validatedData.company || null,
      items: JSON.parse(JSON.stringify(validatedData.items)), // Ensure items is a plain serializable object
      status: QuotationStatus.PENDING,
      expiresAt,
      aiDraft: "Acknowledgment draft pending...",
    };

    // Log the exact data being sent to Prisma for debugging
    logger.info("Sending to Prisma", { data });

    try {
      const quotation = await db.quotation.create({ data });
      return NextResponse.json({ success: true, data: quotation }, { status: 201 });
    } catch (dbError: any) {
      logger.error("Prisma create error", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        data // Log the data that caused the error
      });
      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: error.issues?.[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    logger.error("Failed to create quotation", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
