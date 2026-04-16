'use client'

import { ProductCard } from './ProductCard'
import { MOCK_PRODUCTS } from '@/lib/utils/mockData'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function FeaturedProducts() {
  const featured = MOCK_PRODUCTS.slice(0, 8)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block ml-1">
              Curated Selection
            </span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium text-black uppercase tracking-tight leading-[0.9]">
              Featured <br className="hidden md:block" /> This Week
            </h2>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] font-bold text-black border-b border-black pb-2 transition-all hover:opacity-70 w-fit ml-1"
          >
            Shop All Products
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Refined Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {featured.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  )
}
