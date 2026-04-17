'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductFilters } from './ProductFilters'
import { ProductGrid } from './ProductGrid'
import { SortDropdown } from './SortDropdown'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductListingClientProps {
  initialProducts: any[]
  initialTotal: number
  categories: { name: string; slug: string }[]
  title: string
  subtitle?: string
}

export function ProductListingClient({
  initialProducts,
  initialTotal,
  categories,
  title,
  subtitle,
}: ProductListingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState(initialProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const currentFilters = {
    category: searchParams.get('category') || undefined,
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 20000,
    sizes: searchParams.get('size')?.split(',').filter(Boolean) || [],
    colors: searchParams.get('color')?.split(',').filter(Boolean) || [],
    minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : null,
  }

  const currentSort = searchParams.get('sort') || 'createdAt_desc'

  const updateUrl = useCallback((newFilters: any, newSort?: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newFilters.category) params.set('category', newFilters.category)
    else params.delete('category')

    if (newFilters.minPrice > 0) params.set('minPrice', newFilters.minPrice.toString())
    else params.delete('minPrice')

    if (newFilters.maxPrice < 20000) params.set('maxPrice', newFilters.maxPrice.toString())
    else params.delete('maxPrice')

    if (newFilters.sizes.length > 0) params.set('size', newFilters.sizes.join(','))
    else params.delete('size')

    if (newFilters.colors.length > 0) params.set('color', newFilters.colors.join(','))
    else params.delete('color')

    if (newFilters.minRating) params.set('rating', newFilters.minRating.toString())
    else params.delete('minRating')

    if (newSort) params.set('sort', newSort)

    // Reset page on filter change
    params.delete('page')

    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Re-fetch products when URL changes
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/products?${searchParams.toString()}`)
        const result = await response.json()
        if (result.success) {
          setProducts(result.data.products)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Skip first render as we have initialProducts
    if (searchParams.toString() !== '') {
      fetchProducts()
    }
  }, [searchParams])

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:px-8">
      {/* Header */}
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
          Home / Shop / {title}
        </p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl mb-2 font-display">{title}</h1>
            {subtitle && <p className="text-neutral-500 text-sm">{subtitle}</p>}
          </motion.div>

          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile Filter Trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger className="inline-flex items-center justify-center border border-black px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-colors">
                  <SlidersHorizontal className="w-3 h-3 mr-2" />
                  Filters
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-white p-8">
                  <SheetTitle className="text-[14px] uppercase tracking-[0.2em] font-bold mb-8">Filters</SheetTitle>
                  <div className="overflow-y-auto h-full pb-20">
                    <ProductFilters
                      currentFilters={currentFilters}
                      onFilterChange={updateUrl}
                      categories={categories}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <SortDropdown
              value={currentSort}
              onChange={(val) => updateUrl(currentFilters, val)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <ProductFilters
            currentFilters={currentFilters}
            onFilterChange={updateUrl}
            categories={categories}
          />
        </aside>

        {/* Main Grid */}
        <div className="flex-1">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>
    </div>
  )
}
