"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
}

interface InventoryFiltersProps {
  categories: Category[];
}

export function InventoryFilters({ categories }: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParams.get("search") || "")) {
        router.push(`?${createQueryString("search", searchTerm)}`, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, createQueryString, router, searchParams]);

  const handleCategoryChange = (categoryId: string | null) => {
    if (!categoryId) return;
    const value = categoryId === "all" ? "" : categoryId;
    router.push(`?${createQueryString("categoryId", value)}`, { scroll: false });
  };

  const handleLowStockChange = (checked: boolean) => {
    router.push(`?${createQueryString("lowStock", checked ? "true" : "")}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6 bg-white p-6 border border-[#E5E5E5] mb-8">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search" className="font-medium text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Search Products
        </Label>
        <Input
          id="search"
          placeholder="SEARCH BY NAME OR SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-none border-[#E5E5E5] h-10 font-body text-xs uppercase tracking-wider focus-visible:ring-0 focus-visible:border-black transition-all"
        />
      </div>

      <div className="w-full md:w-72 space-y-2">
        <Label htmlFor="category" className="font-medium text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Category
        </Label>
        <Select
          defaultValue={searchParams.get("categoryId")?.toString() || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger id="category" className="rounded-none border-[#E5E5E5] h-10 font-body text-xs uppercase tracking-wider w-full focus:ring-0 focus:border-black">
            <SelectValue placeholder="ALL CATEGORIES" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-[#E5E5E5] font-body text-xs uppercase">
            <SelectItem value="all" className="rounded-none">ALL CATEGORIES</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id} className="rounded-none">
                {category.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-3 pb-2.5">
        <Switch
          id="lowStock"
          defaultChecked={searchParams.get("lowStock") === "true"}
          onCheckedChange={handleLowStockChange}
          className="data-checked:bg-black"
        />
        <Label
          htmlFor="lowStock"
          className="font-medium text-[10px] uppercase tracking-[0.2em] text-muted-foreground cursor-pointer"
        >
          Low Stock Only (≤ 5)
        </Label>
      </div>
    </div>
  );
}
