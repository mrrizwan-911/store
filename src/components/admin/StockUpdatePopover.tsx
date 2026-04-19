"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logger } from "@/lib/utils/logger"

interface StockUpdatePopoverProps {
  initialStock: number
  variantId: string
  onUpdate: (newStock: number) => Promise<void>
  children: React.ReactElement
}

export function StockUpdatePopover({
  initialStock,
  variantId,
  onUpdate,
  children,
}: StockUpdatePopoverProps) {
  const [stock, setStock] = React.useState(initialStock)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      logger.info(`Updating stock for variant ${variantId} to ${stock}`)
      await onUpdate(stock)
      setIsOpen(false)
    } catch (error) {
      logger.error(`Failed to update stock for variant ${variantId}`, error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent data-testid="stock-popover" className="w-60 rounded-none border-[#E5E5E5] bg-white shadow-none">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-display font-medium leading-none text-black">Update Stock</h4>
            <p className="text-sm text-neutral-500 font-body">
              Enter new stock level for this variant.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="stock" className="font-body text-black">Stock</Label>
              <Input
                id="stock"
                data-testid="stock-input"
                type="number"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="col-span-2 h-8 rounded-none border-[#E5E5E5] focus:ring-0 focus:border-black font-body text-black bg-white"
              />
            </div>
            <Button
              data-testid="stock-submit-btn"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full rounded-none bg-black text-white hover:bg-neutral-800 font-body transition-colors mt-2"
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
