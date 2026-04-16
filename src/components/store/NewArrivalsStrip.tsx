'use client'

import { useRef } from 'react'
import { ProductCard } from './ProductCard'
import { MOCK_PRODUCTS } from '@/lib/utils/mockData'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function NewArrivalsStrip() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const arrivals = MOCK_PRODUCTS.slice(0, 8)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="py-24 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-16 flex items-end justify-between">
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-[0.5em] text-neutral-400 font-bold block ml-1">
            Just In
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium text-black uppercase tracking-tight leading-[0.9]">
            New <br className="hidden md:block" /> Arrivals
          </h2>
        </div>

        <div className="flex gap-4 mb-2">
          <button
            onClick={() => scroll('left')}
            className="w-12 h-12 border border-neutral-100 flex items-center justify-center bg-white text-neutral-800 hover:bg-black hover:text-white transition-all duration-500 rounded-none shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 stroke-[1.25]" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-12 h-12 border border-neutral-100 flex items-center justify-center bg-white text-neutral-800 hover:bg-black hover:text-white transition-all duration-500 rounded-none shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 stroke-[1.25]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-8 md:gap-12 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-12 scroll-smooth"
      >
        {/* Padding Spacer for start */}
        <div className="min-w-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] h-1" />

        {arrivals.map((product) => (
          <div key={product.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] snap-start">
            <ProductCard {...product} />
          </div>
        ))}

        {/* Padding Spacer for end */}
        <div className="min-w-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] h-1" />
      </div>
    </section>
  )
}
