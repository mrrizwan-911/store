import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/adminAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  // Wait for params to be consistent with Next.js 15+ patterns
  await params;

  return NextResponse.json(
    { success: false, error: "PDF Generation not implemented yet" },
    { status: 501 }
  );
}
