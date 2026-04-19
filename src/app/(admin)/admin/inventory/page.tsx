import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { InventoryFilters } from "@/components/admin/InventoryFilters";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

interface InventoryPageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    lowStock?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  // Check authentication and authorization
  const session = await getUserSession();

  if (!session || session.role !== "ADMIN") {
    logger.auth("Unauthorized access attempt to admin inventory page", {
      userId: session?.userId,
      role: session?.role
    });
    redirect("/login");
  }

  // Await searchParams as per Next.js 15+ patterns (indicated by package.json next: 16.x)
  const params = await searchParams;
  const { search, categoryId, lowStock } = params;

  logger.info("Fetching inventory data", { search, categoryId, lowStock });

  try {
    // 1. Fetch variants with filtering
    const variants = await db.productVariant.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { sku: { contains: search, mode: "insensitive" } },
              { product: { name: { contains: search, mode: "insensitive" } } }
            ]
          } : {},
          categoryId ? { product: { categoryId } } : {},
          lowStock === "true" ? { stock: { lte: 5 } } : {}
        ]
      },
      include: {
        product: {
          include: {
            category: true,
            images: { where: { isPrimary: true } }
          }
        }
      },
      orderBy: { product: { name: "asc" } }
    });

    // 2. Fetch all active categories for the filter dropdown
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });

    // Map Prisma variants to InventoryItem type expected by the component
    // Note: InventoryTable expects products.images to be an array of { url, altText, isPrimary }
    const inventoryItems = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      stock: v.stock,
      product: {
        id: v.product.id,
        name: v.product.name,
        images: v.product.images.map(img => ({
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary
        }))
      }
    }));

    return (
      <div className="p-8 min-h-screen bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header section with Minimal Luxury B&W styling */}
          <div className="flex flex-col gap-2 border-b border-black pb-6">
            <h1 data-testid="page-heading" className="text-4xl font-display font-bold uppercase tracking-tight text-black">
              Inventory Management
            </h1>
            <p className="text-neutral-500 font-body text-sm tracking-wide">
              MONITOR AND UPDATE STOCK LEVELS ACROSS YOUR PRODUCT CATALOG.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Filter section */}
            <InventoryFilters categories={categories} />

            {/* Table section */}
            <div className="mt-8">
              <InventoryTable initialItems={inventoryItems} />
            </div>
          </div>

          {/* Footer/Meta info */}
          <div className="flex justify-between items-center pt-8 text-[10px] font-body text-neutral-400 uppercase tracking-[0.2em]">
            <span>Showing {inventoryItems.length} items</span>
            <span>Last Sync: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Failed to fetch inventory data", error);
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase">Error Loading Inventory</h2>
          <p className="font-body text-neutral-600">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }
}
