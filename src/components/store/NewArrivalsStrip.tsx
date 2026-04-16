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
    <section className="py-20 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-10 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold mb-3 block">
            Just In
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-medium text-black uppercase tracking-tight">
            New Arrivals
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 border border-border flex items-center justify-center hover:bg-black hover:text-white transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 border border-border flex items-center justify-center hover:bg-black hover:text-white transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 md:px-[calc((100vw-80rem)/2+1.5rem)]"
      >
        {arrivals.map((product) => (
          <div key={product.id} className="min-w-[280px] md:min-w-[320px] snap-start">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </section>
  )
}
