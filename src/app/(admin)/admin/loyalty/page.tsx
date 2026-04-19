import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { getUserSession } from '@/lib/auth/session';
import LoyaltyStats from '@/components/admin/LoyaltyStats';
import LoyaltyFilters from '@/components/admin/LoyaltyFilters';
import { LoyaltyTable } from '@/components/admin/LoyaltyTable';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    search?: string;
    tier?: string;
  };
}

export default async function AdminLoyaltyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // 1. Auth check
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const { search, tier } = params;
  const currentTier = tier || 'all';

  // 2. Fetch Aggregates
  const totalMembers = await db.loyaltyAccount.count();

  const issuedAgg = await db.loyaltyEvent.aggregate({
    _sum: { points: true },
    where: { points: { gt: 0 } },
  });

  const redeemedAgg = await db.loyaltyEvent.aggregate({
    _sum: { points: true },
    where: { points: { lt: 0 } },
  });

  const totalIssued = issuedAgg._sum.points || 0;
  // Use Math.abs because redeemed points are negative in the database
  const totalRedeemed = Math.abs(redeemedAgg._sum.points || 0);

  // 3. Fetch Members List
  const accounts = await db.loyaltyAccount.findMany({
    where: {
      AND: [
        currentTier !== 'all' ? { tier: currentTier as any } : {},
        search ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        } : {}
      ]
    },
    include: {
      user: true,
      history: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-black pb-6">
          <h1 data-testid="page-heading" className="text-4xl font-display font-bold uppercase tracking-tight text-black">
            Loyalty Management
          </h1>
          <p className="text-neutral-500 font-body text-sm tracking-wide">
            Manage customer rewards, tiers, and point adjustments.
          </p>
        </div>

        {/* Stats Section */}
        <LoyaltyStats
          totalMembers={totalMembers}
          totalIssued={totalIssued}
          totalRedeemed={totalRedeemed}
        />

        {/* Filters and Table Section */}
        <div className="mt-4">
          <LoyaltyFilters />
          <LoyaltyTable accounts={accounts as any} />
        </div>
      </div>
    </div>
  );
}
