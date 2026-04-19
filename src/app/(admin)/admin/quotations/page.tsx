import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { QuotationTabs } from "@/components/admin/QuotationTabs";
import { QuotationTable } from "@/components/admin/QuotationTable";
import { logger } from "@/lib/utils/logger";
import { QuotationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface QuotationsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  // Check authentication and authorization
  const session = await getUserSession();

  if (!session || session.role !== "ADMIN") {
    logger.auth("Unauthorized access attempt to admin quotations page", {
      userId: session?.userId,
      role: session?.role
    });
    redirect("/login");
  }

  // Await searchParams as per Next.js App Router pattern
  const params = await searchParams;
  const status = params.status || 'all';

  logger.info("Fetching quotations for admin inbox", { status });

  try {
    const where: any = {};
    if (status !== 'all') {
      where.status = status as QuotationStatus;
    }

    const quotations = await db.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // Include any other relations if needed in the future
    });

    return (
      <div className="p-8 min-h-screen bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header section with Minimal Luxury B&W styling */}
          <div className="flex flex-col gap-2 border-b border-black pb-6">
            <h1 data-testid="page-heading" className="text-4xl font-display font-bold uppercase tracking-tight text-black">
              Quotation Inbox
            </h1>
            <p className="text-neutral-500 font-body text-sm tracking-wide">
              VIEW AND MANAGE B2B BULK ORDER REQUESTS AND QUOTATIONS.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tabs section */}
            <div className="mb-8">
              <QuotationTabs />
            </div>

            {/* Table section */}
            <div className="mt-8">
              <QuotationTable quotations={quotations} />
            </div>
          </div>

          {/* Footer/Meta info */}
          <div className="flex justify-between items-center pt-8 text-[10px] font-body text-neutral-400 uppercase tracking-[0.2em]">
            <span>Showing {quotations.length} requests</span>
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Failed to fetch quotations", error);
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase">Error Loading Quotations</h2>
          <p className="font-body text-neutral-600">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }
}
