import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { getUserSession } from '@/lib/auth/session';
import CouponsClient from '@/components/admin/CouponsClient';

export const metadata = {
  title: 'Coupons | Admin',
};

export default async function AdminCouponsPage() {
  const session = await getUserSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch initial coupons
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-black pb-4">
        <h1 data-testid="page-heading" className="text-3xl font-display font-bold uppercase tracking-wide text-black">
          Coupons Management
        </h1>
      </div>
      <CouponsClient initialCoupons={coupons as any} />
    </div>
  );
}
