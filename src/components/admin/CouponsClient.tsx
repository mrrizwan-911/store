'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

type Coupon = {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  });

  const openNew = () => {
    setEditingId(null);
    setFormData({
      code: '', type: 'PERCENTAGE', discountValue: '',
      minOrderValue: '', maxUses: '', expiresAt: '', isActive: true
    });
    setIsOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setFormData({
      code: c.code,
      type: c.discountPct ? 'PERCENTAGE' : 'FLAT',
      discountValue: (c.discountPct || c.discountFlat || '').toString(),
      minOrderValue: c.minOrderValue?.toString() || '',
      maxUses: c.maxUses?.toString() || '',
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '',
      isActive: c.isActive,
    });
    setIsOpen(true);
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        code: formData.code,
        type: formData.type,
        discountValue: Number(formData.discountValue),
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isActive: formData.isActive,
      };

      const url = editingId
        ? `/api/admin/coupons/${editingId}`
        : `/api/admin/coupons`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsOpen(false);
        router.refresh();
        // Optimistic update
        if (editingId) {
          setCoupons(coupons.map(c => c.id === editingId ? data.data : c));
        } else {
          setCoupons([data.data, ...coupons]);
        }
      } else {
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    // Optimistic
    setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !current } : c));
    await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current })
    });
    router.refresh();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete coupon?')) return;
    setCoupons(coupons.filter(c => c.id !== id));
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    router.refresh();
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-none border-[#E5E5E5]">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">
              {editingId ? 'Edit Coupon' : 'Create Coupon'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="rounded-none border-[#E5E5E5] focus-visible:ring-black uppercase"
                />
                <Button type="button" variant="outline" onClick={generateCode} className="rounded-none">
                  Auto
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discount Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(val) => setFormData({...formData, type: val})}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PERCENTAGE" id="pct" />
                  <Label htmlFor="pct">Percentage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FLAT" id="flat" />
                  <Label htmlFor="flat">Flat Amount</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Discount Value {formData.type === 'PERCENTAGE' ? '(%)' : '(PKR)'}</Label>
              <Input
                type="number"
                required
                min="1"
                max={formData.type === 'PERCENTAGE' ? "100" : undefined}
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                className="rounded-none border-[#E5E5E5] focus-visible:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Order (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                  className="rounded-none border-[#E5E5E5] focus-visible:ring-black"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                  className="rounded-none border-[#E5E5E5] focus-visible:ring-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                className="rounded-none border-[#E5E5E5] focus-visible:ring-black"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(val) => setFormData({...formData, isActive: val})}
              />
              <Label htmlFor="active">Active Coupon</Label>
            </div>

            <Button disabled={loading} type="submit" className="w-full bg-black text-white hover:bg-zinc-800 rounded-none mt-4">
              {loading ? 'Saving...' : 'Save Coupon'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}