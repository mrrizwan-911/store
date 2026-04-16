'use client'

import Image from 'next/image'
import Link from 'next/link'

const CATEGORIES = [
  { name: 'Clothes', slug: 'clothes', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800' },
  { name: 'Shoes', slug: 'shoes', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800' },
  { name: 'Apparel', slug: 'apparel', image: 'https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?auto=format&fit=crop&q=80&w=800' },
  { name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' },
]

export function CategoryTiles() {
  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group relative aspect-square overflow-hidden bg-neutral-100 border border-border"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-all duration-500" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="h-px w-0 bg-white group-hover:w-12 transition-all duration-500 mb-4" />
              <h3 className="font-display text-2xl text-white font-medium uppercase tracking-[0.2em] drop-shadow-lg">
                {cat.name}
              </h3>
              <div className="h-px w-0 bg-white group-hover:w-12 transition-all duration-500 mt-4" />
            </div>

            {/* Bottom Border Accent */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-700" />
          </Link>
        ))}
      </div>
    </section>
  )
}
