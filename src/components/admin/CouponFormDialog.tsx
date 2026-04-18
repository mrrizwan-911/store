'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Coupon } from './CouponsClient';

interface CouponFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingCoupon: Coupon | null;
  onSuccess: (coupon: Coupon, isEdit: boolean) => void;
}

export function CouponFormDialog({
  isOpen,
  setIsOpen,
  editingCoupon,
  onSuccess,
}: CouponFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (editingCoupon) {
        setFormData({
          code: editingCoupon.code,
          type: editingCoupon.discountPct ? 'PERCENTAGE' : 'FLAT',
          discountValue: (editingCoupon.discountPct || editingCoupon.discountFlat || '').toString(),
          minOrderValue: editingCoupon.minOrderValue?.toString() || '',
          maxUses: editingCoupon.maxUses?.toString() || '',
          expiresAt: editingCoupon.expiresAt ? new Date(editingCoupon.expiresAt).toISOString().split('T')[0] : '',
          isActive: editingCoupon.isActive,
        });
      } else {
        setFormData({
          code: '',
          type: 'PERCENTAGE',
          discountValue: '',
          minOrderValue: '',
          maxUses: '',
          expiresAt: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, editingCoupon]);

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

      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : `/api/admin/coupons`;
      const method = editingCoupon ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save coupon');
      }

      setIsOpen(false);
      toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
      router.refresh();
      onSuccess(data.data, !!editingCoupon);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-none border-[#E5E5E5]">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl">
            {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
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
              onValueChange={(val: string) => setFormData({...formData, type: val})}
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
              onCheckedChange={(val: boolean) => setFormData({...formData, isActive: val})}
            />
            <Label htmlFor="active">Active Coupon</Label>
          </div>

          <Button disabled={loading} type="submit" className="w-full bg-black text-white hover:bg-zinc-800 rounded-none mt-4">
            {loading ? 'Saving...' : 'Save Coupon'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
