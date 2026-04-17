'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Variant {
  id: string
  size?: string | null
  color?: string | null
  stock: number
  price?: number | null
}

interface VariantSelectorProps {
  variants: Variant[]
  selectedColor: string | null
  selectedSize: string | null
  onColorChange: (color: string) => void
  onSizeChange: (size: string) => void
}

const COLOR_MAP: Record<string, string> = {
  White: '#FFFFFF',
  Black: '#000000',
  Navy: '#001f54',
  Beige: '#f5f0e8',
  Red: '#CC0000',
  Green: '#228B22',
  Blue: '#0000FF',
  Gray: '#808080',
  Gold: '#E8D5B0',
}

export default function VariantSelector({
  variants,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: VariantSelectorProps) {
  const colors = useMemo(() => {
    const uniqueColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[]
    return uniqueColors
  }, [variants])

  const sizes = useMemo(() => {
    const uniqueSizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[]
    // Simple sort for sizes
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL']
    return uniqueSizes.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a)
      const indexB = sizeOrder.indexOf(b)
      if (indexA === -1 || indexB === -1) return a.localeCompare(b)
      return indexA - indexB
    })
  }, [variants])

  const isSizeAvailableInColor = (size: string, color: string | null) => {
    if (!color) return true
    return variants.some((v) => v.color === color && v.size === size && v.stock > 0)
  }

  const isColorAvailableInSize = (color: string, size: string | null) => {
    if (!size) return true
    return variants.some((v) => v.size === size && v.color === color && v.stock > 0)
  }

  if (colors.length === 0 && sizes.length === 0) return null

  return (
    <div className="space-y-8">
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
              Color: <span className="text-text-primary ml-1">{selectedColor || 'Select'}</span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const hex = COLOR_MAP[color] || '#CCCCCC'
              const isAvailable = isColorAvailableInSize(color, selectedSize)
              const isSelected = selectedColor === color

              return (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={cn(
                    'relative w-10 h-10 rounded-full border transition-all duration-200',
                    isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-border hover:scale-110',
                    !isAvailable && 'opacity-40 grayscale-[0.5]'
                  )}
                  title={color}
                >
                  <span
                    className="absolute inset-0.5 rounded-full border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px] bg-neutral-400 rotate-45" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
              Size: <span className="text-text-primary ml-1">{selectedSize || 'Select'}</span>
            </h3>
            <button className="text-xs text-text-secondary underline underline-offset-4 hover:text-primary transition-colors">
              Size Guide
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map((size) => {
              const isAvailable = isSizeAvailableInColor(size, selectedColor)
              const isSelected = selectedSize === size

              return (
                <button
                  key={size}
                  onClick={() => onSizeChange(size)}
                  disabled={!isAvailable && !isSelected} // Allow selecting even if unavailable to show it's out of stock
                  className={cn(
                    'h-12 border text-sm font-medium transition-all duration-200 uppercase',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-text-primary border-border hover:border-text-primary',
                    !isAvailable && 'text-text-secondary relative overflow-hidden'
                  )}
                >
                  {size}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-neutral-300 -rotate-45" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
