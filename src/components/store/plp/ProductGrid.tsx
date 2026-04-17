'use client'

import { ProductCard } from '../shared/ProductCard'
import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface ProductSummary {
  id: string
  name: string
  slug: string
  basePrice: number
  salePrice?: number | null
  category: { name: string; slug: string }
  images: { url: string }[]
  avgRating: number | null
  reviewCount: number
  isLowStock?: boolean
  stockCount?: number
}

interface ProductGridProps {
  products: ProductSummary[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] } },
}

export function ProductGrid({
  products,
  isLoading,
  viewMode,
  onViewModeChange
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
          <Skeleton className="h-4 w-32 bg-neutral-100 rounded-none" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 bg-neutral-100 rounded-none" />
            <Skeleton className="h-10 w-10 bg-neutral-100 rounded-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full bg-neutral-50 rounded-none" />
              <Skeleton className="h-4 w-3/4 bg-neutral-50 rounded-none" />
              <Skeleton className="h-4 w-1/2 bg-neutral-50 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h3 className="font-display text-2xl italic text-neutral-400 mb-4">No products found</h3>
        <p className="text-neutral-400 text-sm max-w-xs mx-auto">
          Try adjusting your filters or search criteria to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Grid Controls */}
      <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
          Showing {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </p>
        <div className="flex items-center gap-1 border border-neutral-100 p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "w-9 h-9 flex items-center justify-center transition-all",
              viewMode === 'grid' ? "bg-black text-white" : "text-neutral-400 hover:text-black"
            )}
            aria-label="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "w-9 h-9 flex items-center justify-center transition-all",
              viewMode === 'list' ? "bg-black text-white" : "text-neutral-400 hover:text-black"
            )}
            aria-label="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid/List View */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16"
            : "flex flex-col gap-8"
        )}
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={itemVariants}>
            {viewMode === 'grid' ? (
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.basePrice}
                salePrice={product.salePrice ?? undefined}
                category={product.category.name}
                imageUrl={product.images[0]?.url || ''}
                avgRating={product.avgRating ?? undefined}
                reviewCount={product.reviewCount}
                isLowStock={product.isLowStock}
                stockCount={product.stockCount}
              />
            ) : (
              <div className="flex flex-col md:flex-row gap-8 p-6 bg-white border border-neutral-50 hover:border-black/10 transition-all group">
                <div className="w-full md:w-64 aspect-[4/5] relative overflow-hidden flex-shrink-0">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.basePrice}
                    salePrice={product.salePrice ?? undefined}
                    category={product.category.name}
                    imageUrl={product.images[0]?.url || ''}
                    avgRating={product.avgRating ?? undefined}
                    reviewCount={product.reviewCount}
                    isLowStock={product.isLowStock}
                    stockCount={product.stockCount}
                  />
                </div>
                <div className="flex flex-col justify-center gap-4 flex-1 py-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold">
                    {product.category.name}
                  </span>
                  <h3 className="font-display text-3xl md:text-4xl text-black">
                    {product.name}
                  </h3>
                  <p className="text-neutral-500 text-sm leading-relaxed max-w-xl font-light italic">
                    Refined essentials crafted with surgical precision for the modern connoisseur.
                  </p>
                  <div className="flex items-center gap-4 pt-4 mt-auto">
                    <Link
                      href={`/products/${product.slug}`}
                      className="bg-black text-white px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
