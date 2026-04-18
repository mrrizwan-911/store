'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CouponFormDialog } from './CouponFormDialog';

export type Coupon = {
  id: string;
  code: string;
  discountPct: number | null;
  discountFlat: number | null;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

export default function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const router = useRouter();

  const openNew = () => {
    setEditingCoupon(null);
    setIsOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setIsOpen(true);
  };

  const handleSuccess = (coupon: Coupon, isEdit: boolean) => {
    if (isEdit) {
      setCoupons(coupons.map(c => c.id === coupon.id ? coupon : c));
    } else {
      setCoupons([coupon, ...coupons]);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    // Optimistic update
    setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !current } : c));

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update coupon status');
      }

      router.refresh();
      toast.success(current ? 'Coupon deactivated' : 'Coupon activated');
    } catch (error: any) {
      // Revert optimistic update
      setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: current } : c));
      toast.error(error.message || 'An error occurred while updating status');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete coupon?')) return;

    const previousCoupons = [...coupons];
    // Optimistic delete
    setCoupons(coupons.filter(c => c.id !== id));

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete coupon');
      }

      router.refresh();
      toast.success('Coupon deleted successfully');
    } catch (error: any) {
      // Revert optimistic update
      setCoupons(previousCoupons);
      toast.error(error.message || 'An error occurred while deleting coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-semibold tracking-tight text-black">Coupons</h1>
        <Button onClick={openNew} className="bg-black text-white hover:bg-zinc-800 rounded-none">
          <Plus className="mr-2 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <div className="border border-[#E5E5E5] bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-black">
            <tr>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Discount</th>
              <th className="px-6 py-4 font-medium">Min Order</th>
              <th className="px-6 py-4 font-medium">Uses</th>
              <th className="px-6 py-4 font-medium">Expires</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-[#737373]">
                  No coupons yet. Create your first one.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA]/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{coupon.code}</td>
                  <td className="px-6 py-4">{coupon.discountPct ? 'Percentage' : 'Flat'}</td>
                  <td className="px-6 py-4">
                    {coupon.discountPct ? `${coupon.discountPct}%` : `Rs. ${coupon.discountFlat}`}
                  </td>
                  <td className="px-6 py-4 text-[#737373]">{coupon.minOrderValue ? `Rs. ${coupon.minOrderValue}` : '—'}</td>
                  <td className="px-6 py-4 text-[#737373]">{coupon.usedCount} / {coupon.maxUses || '∞'}</td>
                  <td className="px-6 py-4 text-[#737373]">
                    {coupon.expiresAt ? format(new Date(coupon.expiresAt), 'MMM d, yyyy') : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <Switch
                      checked={coupon.isActive}
                      onCheckedChange={() => toggleActive(coupon.id, coupon.isActive)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(coupon)} className="text-[#737373] hover:text-black mr-3">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteCoupon(coupon.id)} className="text-[#737373] hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CouponFormDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        editingCoupon={editingCoupon}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
