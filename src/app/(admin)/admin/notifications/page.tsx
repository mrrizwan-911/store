import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NotificationTabs } from "@/components/admin/NotificationTabs";
import { EmailLogTable } from "@/components/admin/EmailLogTable";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

interface NotificationsPageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  // Check authentication and authorization
  const session = await getUserSession();

  if (!session || session.role !== "ADMIN") {
    logger.auth("Unauthorized access attempt to admin notifications page", {
      userId: session?.userId,
      role: session?.role
    });
    redirect("/login");
  }

  // Await searchParams as per Next.js 14+ pattern observed in this project
  const params = await searchParams;
  const filter = params.filter || 'all';

  logger.info("Fetching notification logs", { filter });

  try {
    let where: any = {};
    if (filter === 'orders') where.type = { in: ['order_confirm', 'order_shipped', 'order_delivered'] };
    if (filter === 'cart') where.type = 'abandoned_cart';
    if (filter === 'quotations') where.type = 'quotation_sent';
    if (filter === 'failed') where.status = 'failed';

    const logs = await db.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    return (
      <div className="p-8 min-h-screen bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header section with Minimal Luxury B&W styling */}
          <div className="flex flex-col gap-2 border-b border-black pb-6">
            <h1 data-testid="page-heading" className="text-4xl font-display font-bold uppercase tracking-tight text-black">
              Notifications
            </h1>
            <p className="text-neutral-500 font-body text-sm tracking-wide">
              VIEW AND MANAGE EMAIL LOGS AND NOTIFICATION STATUS.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tabs section */}
            <NotificationTabs />

            {/* Table section */}
            <div className="mt-8">
              <EmailLogTable logs={logs} />
            </div>
          </div>

          {/* Footer/Meta info */}
          <div className="flex justify-between items-center pt-8 text-[10px] font-body text-neutral-400 uppercase tracking-[0.2em]">
            <span>Showing {logs.length} logs</span>
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Failed to fetch notification logs", error);
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase">Error Loading Notifications</h2>
          <p className="font-body text-neutral-600">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }
}
