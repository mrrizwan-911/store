'use client'

import { useState } from 'react'
import { Plus, Minus, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

interface FilterState {
  minPrice: number
  maxPrice: number
  sizes: string[]
  colors: string[]
  minRating: number | null
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
}

const COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Navy', hex: '#001f54' },
  { name: 'Beige', hex: '#f5f0e8' },
  { name: 'Red', hex: '#CC0000' },
  { name: 'Green', hex: '#228B22' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']

export function ProductFilters({ onFilterChange, currentFilters }: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    price: true,
    size: true,
    color: true,
    rating: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handlePriceChange = (values: number | readonly number[]) => {
    if (Array.isArray(values)) {
      onFilterChange({ ...currentFilters, minPrice: values[0], maxPrice: values[1] })
    }
  }

  const handleSizeToggle = (size: string) => {
    const sizes = currentFilters.sizes.includes(size)
      ? currentFilters.sizes.filter(s => s !== size)
      : [...currentFilters.sizes, size]
    onFilterChange({ ...currentFilters, sizes })
  }

  const handleColorToggle = (color: string) => {
    const colors = currentFilters.colors.includes(color)
      ? currentFilters.colors.filter(c => c !== color)
      : [...currentFilters.colors, color]
    onFilterChange({ ...currentFilters, colors })
  }

  const handleRatingChange = (value: string) => {
    onFilterChange({ ...currentFilters, minRating: value === 'all' ? null : parseInt(value) })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Price Range */}
      <div className="border-b border-border pb-8">
        <button
          onClick={() => toggleSection('price')}
          className="flex w-full items-center justify-between font-display text-sm uppercase tracking-widest font-bold mb-6"
        >
          Price Range
          {openSections.price ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        {openSections.price && (
          <div className="px-2">
            <Slider
              defaultValue={[currentFilters.minPrice, currentFilters.maxPrice]}
              max={20000}
              step={100}
              onValueChange={handlePriceChange}
              className="mb-6"
            />
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              <span>PKR {currentFilters.minPrice.toLocaleString()}</span>
              <span>PKR {currentFilters.maxPrice.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Size */}
      <div className="border-b border-border pb-8">
        <button
          onClick={() => toggleSection('size')}
          className="flex w-full items-center justify-between font-display text-sm uppercase tracking-widest font-bold mb-6"
        >
          Size
          {openSections.size ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        {openSections.size && (
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map(size => (
              <button
                key={size}
                onClick={() => handleSizeToggle(size)}
                className={cn(
                  "h-10 flex items-center justify-center border text-[10px] font-bold transition-all",
                  currentFilters.sizes.includes(size)
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-border hover:border-black/30"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div className="border-b border-border pb-8">
        <button
          onClick={() => toggleSection('color')}
          className="flex w-full items-center justify-between font-display text-sm uppercase tracking-widest font-bold mb-6"
        >
          Color
          {openSections.color ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        {openSections.color && (
          <div className="flex flex-wrap gap-3">
            {COLORS.map(color => (
              <button
                key={color.name}
                onClick={() => handleColorToggle(color.name)}
                title={color.name}
                className={cn(
                  "w-8 h-8 rounded-full border border-border transition-all flex items-center justify-center",
                  currentFilters.colors.includes(color.name) && "ring-2 ring-black ring-offset-2"
                )}
                style={{ backgroundColor: color.hex }}
              >
                {color.name === 'White' && <div className="sr-only">White</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="pb-8">
        <button
          onClick={() => toggleSection('rating')}
          className="flex w-full items-center justify-between font-display text-sm uppercase tracking-widest font-bold mb-6"
        >
          Rating
          {openSections.rating ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        {openSections.rating && (
          <RadioGroup
            defaultValue={currentFilters.minRating?.toString() || 'all'}
            onValueChange={handleRatingChange}
            className="flex flex-col gap-3"
          >
            {[4, 3, 2].map(rating => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={rating.toString()} id={`r${rating}`} className="border-border text-black" />
                <Label htmlFor={`r${rating}`} className="text-xs font-medium uppercase tracking-widest text-neutral-600 cursor-pointer">
                  {rating} Stars & Above
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="r-all" className="border-border text-black" />
              <Label htmlFor="r-all" className="text-xs font-medium uppercase tracking-widest text-neutral-600 cursor-pointer">
                All Ratings
              </Label>
            </div>
          </RadioGroup>
        )}
      </div>
    </div>
  )
}
