import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { QuotationDetail } from "@/components/admin/QuotationDetail";
import { logger } from "@/lib/utils/logger";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface QuotationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const session = await getUserSession();

  if (!session || session.role !== "ADMIN") {
    logger.auth("Unauthorized access attempt to admin quotation detail page", {
      userId: session?.userId,
      role: session?.role
    });
    redirect("/login");
  }

  const { id } = await params;

  logger.info("Fetching quotation detail", { quotationId: id });

  try {
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!quotation) {
      logger.warn("Quotation not found", { quotationId: id });
      return notFound();
    }

    // Enrich items with product names
    const items = quotation.items as any[];
    const productIds = items.map((item: any) => item.productId);

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const enrichedQuotation = {
      ...quotation,
      items: items.map((item: any) => ({
        ...item,
        name: products.find((p) => p.id === item.productId)?.name || "Unknown Product"
      }))
    };

    return (
      <div className="p-8 min-h-screen bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with Back button and Status */}
          <div className="flex flex-col gap-6 border-b border-black pb-8">
            <Link
              href="/admin/quotations"
              className="flex items-center gap-2 text-xs font-display uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors w-fit"
            >
              <ChevronLeft className="w-3 h-3" /> Back to Inbox
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h1 data-testid="page-heading" className="text-4xl font-display font-bold uppercase tracking-tight text-black">
                  Quotation Detail
                </h1>
                <p className="text-neutral-500 font-body text-sm tracking-wide">
                  REF: <span className="font-mono text-black">{quotation.id.slice(-8).toUpperCase()}</span> • RECEIVED {new Date(quotation.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 text-[10px] font-display font-bold uppercase tracking-[0.15em] border ${
                  quotation.status === 'PENDING' ? 'bg-neutral-100 border-neutral-200 text-neutral-600' :
                  quotation.status === 'SENT' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                  quotation.status === 'ACCEPTED' ? 'bg-green-50 border-green-100 text-green-600' :
                  quotation.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-600' :
                  quotation.status === 'CONVERTED' ? 'bg-[#E8D5B0] border-[#E8D5B0] text-black' :
                  'bg-neutral-800 border-neutral-800 text-white'
                }`}>
                  {quotation.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <QuotationDetail quotation={enrichedQuotation as any} />
          </div>

          {/* Footer Meta */}
          <div className="pt-12 flex justify-end">
            <p className="text-[10px] font-body text-neutral-400 uppercase tracking-[0.2em]">
              Last updated: {new Date(quotation.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Failed to fetch quotation detail", error);
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase">Error Loading Quotation</h2>
          <p className="font-body text-neutral-600">Please try again later or contact support.</p>
          <Link href="/admin/quotations">
            <Button variant="outline" className="rounded-none border-black mt-4 uppercase font-display tracking-widest">
              Return to Inbox
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}
