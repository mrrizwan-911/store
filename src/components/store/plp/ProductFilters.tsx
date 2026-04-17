'use client'

import { useState } from 'react'
import { Plus, Minus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FilterState {
  category?: string
  minPrice: number
  maxPrice: number
  sizes: string[]
  colors: string[]
  minRating: number | null
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
  categories?: { name: string; slug: string }[]
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

export function ProductFilters({ onFilterChange, currentFilters, categories = [] }: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    category: true,
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

  const handleCategoryChange = (slug: string) => {
    onFilterChange({ ...currentFilters, category: currentFilters.category === slug ? undefined : slug })
  }

  const hasActiveFilters =
    currentFilters.category ||
    currentFilters.minPrice > 0 ||
    currentFilters.maxPrice < 20000 ||
    currentFilters.sizes.length > 0 ||
    currentFilters.colors.length > 0 ||
    currentFilters.minRating !== null

  return (
    <div className="flex flex-col gap-8">
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-b border-black pb-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold">Active Filters</h2>
          <button
            onClick={() => onFilterChange({ minPrice: 0, maxPrice: 20000, sizes: [], colors: [], minRating: null })}
            className="text-[10px] uppercase tracking-widest font-bold underline hover:text-neutral-500"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="border-b border-neutral-100 pb-8">
          <button
            onClick={() => toggleSection('category')}
            className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.2em] font-bold mb-6"
          >
            Category
            {openSections.category ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
          <AnimatePresence initial={false}>
            {openSections.category && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                className="overflow-hidden space-y-3"
              >
                {categories.map((cat) => (
                  <div
                    key={cat.slug}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() => handleCategoryChange(cat.slug)}
                  >
                    <div className={cn(
                      "w-4 h-4 border border-black flex items-center justify-center transition-colors",
                      currentFilters.category === cat.slug ? "bg-black" : "bg-white group-hover:bg-neutral-50"
                    )}>
                      {currentFilters.category === cat.slug && <span className="text-[10px] text-white">✓</span>}
                    </div>
                    <span className={cn(
                      "text-xs uppercase tracking-wider transition-colors",
                      currentFilters.category === cat.slug ? "font-bold" : "text-neutral-600 group-hover:text-black"
                    )}>
                      {cat.name}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Price Range */}
      <div className="border-b border-neutral-100 pb-8">
        <button
          onClick={() => toggleSection('price')}
          className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.2em] font-bold mb-6"
        >
          Price Range
          {openSections.price ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-2"
            >
              <Slider
                value={[currentFilters.minPrice, currentFilters.maxPrice]}
                max={20000}
                step={100}
                onValueChange={handlePriceChange}
                className="mb-6"
              />
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter text-neutral-500">
                <span>PKR {currentFilters.minPrice.toLocaleString()}</span>
                <span>PKR {currentFilters.maxPrice.toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Size */}
      <div className="border-b border-neutral-100 pb-8">
        <button
          onClick={() => toggleSection('size')}
          className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.2em] font-bold mb-6"
        >
          Size
          {openSections.size ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.size && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden grid grid-cols-4 gap-2"
            >
              {SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={cn(
                    "h-10 flex items-center justify-center border text-[10px] font-bold transition-all",
                    currentFilters.sizes.includes(size)
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-neutral-200 hover:border-black"
                  )}
                >
                  {size}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Color */}
      <div className="border-b border-neutral-100 pb-8">
        <button
          onClick={() => toggleSection('color')}
          className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.2em] font-bold mb-6"
        >
          Color
          {openSections.color ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.color && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex flex-wrap gap-3"
            >
              {COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => handleColorToggle(color.name)}
                  title={color.name}
                  className={cn(
                    "w-6 h-6 border transition-all flex items-center justify-center",
                    currentFilters.colors.includes(color.name) ? "ring-1 ring-black ring-offset-2 border-black" : "border-neutral-200"
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating */}
      <div className="pb-8">
        <button
          onClick={() => toggleSection('rating')}
          className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.2em] font-bold mb-6"
        >
          Rating
          {openSections.rating ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.rating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <RadioGroup
                value={currentFilters.minRating?.toString() || 'all'}
                onValueChange={handleRatingChange}
                className="flex flex-col gap-3"
              >
                {[4, 3, 2].map(rating => (
                  <div key={rating} className="flex items-center space-x-3 group cursor-pointer">
                    <RadioGroupItem value={rating.toString()} id={`r${rating}`} className="border-black text-black" />
                    <Label htmlFor={`r${rating}`} className="text-[10px] uppercase tracking-[0.15em] font-bold text-neutral-600 group-hover:text-black cursor-pointer">
                      {rating} Stars & Above
                    </Label>
                  </div>
                ))}
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <RadioGroupItem value="all" id="r-all" className="border-black text-black" />
                  <Label htmlFor="r-all" className="text-[10px] uppercase tracking-[0.15em] font-bold text-neutral-600 group-hover:text-black cursor-pointer">
                    All Ratings
                  </Label>
                </div>
              </RadioGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
