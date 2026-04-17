'use client'

import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export function CategoryTiles() {
  const categories = [
    {
      name: 'Clothes',
      slug: 'clothes',
      image: '/images/clothes_category.jpg',
      gridClass: 'col-span-12 md:col-span-6 md:row-span-2',
      textClass: 'text-6xl md:text-8xl',
      showSubtitle: true,
      overlayClass: 'bg-black/10 group-hover:bg-black/20',
      contentClass: 'top-12 left-12 items-start justify-start',
    },
    {
      name: 'Shoes',
      slug: 'shoes',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
      gridClass: 'col-span-12 md:col-span-6 md:row-span-1',
      textClass: 'text-4xl italic',
      overlayClass: 'bg-black/20 group-hover:bg-black/30',
      contentClass: 'bottom-8 right-8 items-end justify-end text-right',
    },
    {
      name: 'Apparel',
      slug: 'apparel',
      image: '/images/apparel.webp',
      gridClass: 'col-span-6 md:col-span-3 md:row-span-1',
      textClass: 'text-2xl',
      overlayClass: 'bg-black/20 group-hover:bg-black/30',
      contentClass: 'bottom-6 left-6 items-start justify-end',
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      image: '/images/accessories.webp',
      gridClass: 'col-span-6 md:col-span-3 md:row-span-1',
      textClass: 'text-2xl',
      overlayClass: 'bg-black/20 group-hover:bg-black/30',
      contentClass: 'bottom-6 left-6 items-start justify-end',
    },
  ]

  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-4 md:gap-6 md:h-[630px]">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className={cn(
              "group relative overflow-hidden bg-neutral-100 border border-border rounded-none",
              cat.gridClass
            )}
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-[1200ms] ease-in-out group-hover:scale-110"
              priority={cat.name === 'Clothes'}
            />
            {/* Overlay */}
            <div
              className={cn(
                "absolute inset-0 transition-all duration-500",
                cat.overlayClass
              )}
            />

            {/* Content */}
            <div className={cn(
              "absolute inset-0 flex flex-col p-6 md:p-12",
              cat.contentClass
            )}>
              <h3
                className={cn(
                  "font-display text-white font-medium drop-shadow-2xl transition-transform duration-700",
                  cat.textClass
                )}
              >
                {cat.name}
              </h3>
              {cat.showSubtitle && (
                <p className="text-white/80 text-[10px] uppercase tracking-[0.3em] mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  Shop Collection &rarr;
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
