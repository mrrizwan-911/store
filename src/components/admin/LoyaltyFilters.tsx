"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

const LoyaltyFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for immediate UI feedback
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [tier, setTier] = useState(searchParams.get('tier') || 'all');

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get('search') || '')) {
        updateUrl('search', search);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Sync local state when searchParams change externally (e.g. browser back/forward)
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setTier(searchParams.get('tier') || 'all');
  }, [searchParams]);

  const updateUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page to 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleTierChange = (value: string) => {
    setTier(value);
    updateUrl('tier', value);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
        <Input
          placeholder="Search members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-none border-[#E5E5E5] focus-visible:ring-0 focus-visible:border-[#000000] h-10 bg-[#FFFFFF] text-sm"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#000000] border-t-transparent" />
          </div>
        )}
      </div>

      <div className="w-full md:w-56">
        <Select value={tier} onValueChange={handleTierChange}>
          <SelectTrigger className="rounded-none border-[#E5E5E5] focus:ring-0 focus:border-[#000000] h-10 w-full bg-[#FFFFFF] text-sm">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-[#E5E5E5] bg-[#FFFFFF]">
            <SelectItem value="all" className="rounded-none focus:bg-[#FAFAFA] text-sm">All Tiers</SelectItem>
            <SelectItem value="BRONZE" className="rounded-none focus:bg-[#FAFAFA] text-sm">Bronze</SelectItem>
            <SelectItem value="SILVER" className="rounded-none focus:bg-[#FAFAFA] text-sm">Silver</SelectItem>
            <SelectItem value="GOLD" className="rounded-none focus:bg-[#FAFAFA] text-sm">Gold</SelectItem>
            <SelectItem value="PLATINUM" className="rounded-none focus:bg-[#FAFAFA] text-sm">Platinum</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LoyaltyFilters;
