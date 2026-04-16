'use client'

import { ProductCard } from './ProductCard'
import { MOCK_PRODUCTS } from '@/lib/utils/mockData'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function FeaturedProducts() {
  const featured = MOCK_PRODUCTS.slice(0, 8)

  return (
    <section className="py-20 bg-[#FAFAFA] border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold mb-3 block">
              Curated Selection
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-medium text-black uppercase tracking-tight">
              Featured This Week
            </h2>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-bold text-black border-b border-black pb-1 transition-all hover:opacity-70"
          >
            Shop All Products
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
          {featured.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  )
}
