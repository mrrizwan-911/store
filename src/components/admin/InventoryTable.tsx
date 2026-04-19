"use client"

import * as React from "react"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StockUpdatePopover } from "./StockUpdatePopover"
import { logger } from "@/lib/utils/logger"
import { cn } from "@/lib/utils"
import { Edit2Icon } from "lucide-react"

export interface InventoryItem {
  id: string; // Variant ID
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  product: {
    id: string;
    name: string;
    images: { url: string; altText: string | null; isPrimary: boolean }[];
  };
}

interface InventoryTableProps {
  initialItems: InventoryItem[]
}

export function InventoryTable({ initialItems }: InventoryTableProps) {
  const [items, setItems] = React.useState<InventoryItem[]>(initialItems)

  const handleStockUpdate = async (variantId: string, newStock: number) => {
    // 1. Store original items for rollback
    const originalItems = [...items]

    // 2. Optimistic Update
    setItems((prev) =>
      prev.map((item) =>
        item.id === variantId ? { ...item, stock: newStock } : item
      )
    )

    try {
      logger.info(`Sending PATCH request to /api/admin/inventory/${variantId}`)
      const response = await fetch(`/api/admin/inventory/${variantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock: newStock }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to update stock")
      }

      logger.info(`Stock updated successfully for variant ${variantId}`)
    } catch (error) {
      logger.error(`Error updating stock for variant ${variantId}, rolling back`, error)
      // 3. Rollback on failure
      setItems(originalItems)
    }
  }

  const getStatusBadge = (stock: number) => {
    if (stock > 5) {
      return (
        <Badge
          className="rounded-none bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:bg-[#ECFDF5] font-body px-2"
          variant="outline"
        >
          IN STOCK
        </Badge>
      )
    }
    if (stock > 0) {
      return (
        <Badge
          className="rounded-none bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] hover:bg-[#FFFBEB] font-body px-2"
          variant="outline"
        >
          LOW STOCK
        </Badge>
      )
    }
    return (
      <Badge
        className="rounded-none bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2] font-body px-2"
        variant="outline"
      >
        OUT OF STOCK
      </Badge>
    )
  }

  return (
    <div className="border border-[#E5E5E5] bg-white rounded-none overflow-hidden">
      <Table>
        <TableHeader className="bg-[#FAFAFA]">
          <TableRow className="border-b border-[#E5E5E5] hover:bg-transparent">
            <TableHead className="w-[300px] font-display text-black font-medium py-4">Product</TableHead>
            <TableHead className="font-display text-black font-medium">SKU</TableHead>
            <TableHead className="font-display text-black font-medium">Size</TableHead>
            <TableHead className="font-display text-black font-medium">Color</TableHead>
            <TableHead className="font-display text-black font-medium">Stock</TableHead>
            <TableHead className="font-display text-black font-medium">Status</TableHead>
            <TableHead className="text-right font-display text-black font-medium pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-neutral-500 font-body">
                No inventory items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const primaryImage = item.product.images.find(img => img.isPrimary) || item.product.images[0]

              return (
                <TableRow key={item.id} data-testid="inventory-row" className="border-b border-[#E5E5E5] hover:bg-[#FAFAFA]/50 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative aspect-square w-12 h-12 border border-[#E5E5E5] overflow-hidden bg-[#FAFAFA]">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                            NO IMG
                          </div>
                        )}
                      </div>
                      <span className="font-display text-sm font-medium text-black truncate max-w-[180px]">
                        {item.product.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-body text-sm text-neutral-600">
                    {item.sku}
                  </TableCell>
                  <TableCell className="font-body text-sm text-neutral-600 uppercase">
                    {item.size || "—"}
                  </TableCell>
                  <TableCell className="font-body text-sm text-neutral-600 uppercase">
                    {item.color || "—"}
                  </TableCell>
                  <TableCell className="font-body text-sm">
                    <div className="flex items-center gap-2 group cursor-pointer">
                      <span className={cn(
                        "font-medium font-body",
                        item.stock === 0 ? "text-[#B91C1C]" : "text-black"
                      )}>
                        {item.stock}
                      </span>
                      <StockUpdatePopover
                        initialStock={item.stock}
                        variantId={item.id}
                        onUpdate={(newStock) => handleStockUpdate(item.id, newStock)}
                      >
                        <button data-testid="stock-edit-btn" className="flex items-center gap-1 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-black transition-all">
                          <Edit2Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium uppercase tracking-wider font-body">Edit Stock</span>
                        </button>
                      </StockUpdatePopover>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.stock)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <button className="text-xs font-display font-medium text-neutral-400 hover:text-black underline underline-offset-4 transition-colors">
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
