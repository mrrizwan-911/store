'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function LookbookTeaser() {
  const lookbook1 = '/images/lookbook1.webp'
  const lookbook2 = '/images/lookbook2.jpg'
  const lookbook3 = '/images/lookbook3.jpg'

  return (
    <section className="bg-black py-32 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">

          {/* Abstract Editorial Images Grid */}
          <div className="relative h-[550px] md:h-[750px] flex items-center">
            {/* Image 1 - Top Staggered */}
            <div className="absolute left-0 top-0 w-1/2 aspect-[3/4] z-10 group overflow-hidden border border-white/5 shadow-2xl">
              <Image
                src={lookbook1}
                alt="Lookbook Editorial 1"
                fill
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/10 transition-all group-hover:bg-black/0" />
            </div>

            {/* Image 2 - Middle Staggered (Down) */}
            <div className="absolute left-[20%] top-[20%] w-1/2 aspect-[3/4] z-20 group overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={lookbook2}
                alt="Lookbook Editorial 2"
                fill
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 transition-all group-hover:bg-black/5" />
            </div>

            {/* Image 3 - Bottom Staggered (Up) */}
            <div className="absolute right-0 bottom-0 w-1/2 aspect-[3/4] z-30 group overflow-hidden border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000">
              <Image
                src={lookbook3}
                alt="Lookbook Editorial 3"
                fill
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/30 transition-all group-hover:bg-black/10" />
            </div>
          </div>

          {/* Content */}
          <div className="max-w-xl">
            <span className="text-[10px] uppercase tracking-[0.6em] text-white/40 font-bold mb-8 block">
              Editorial Vol. 01 — Style Guide
            </span>
            <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.85] mb-10 uppercase tracking-tighter">
              Complete the <br />
              <span className="italic font-light opacity-80">Luxury</span> Look
            </h2>
            <p className="text-white/50 text-base md:text-lg font-light leading-relaxed mb-12 max-w-lg font-sans">
              Our stylists have curated the season&apos;s most influential silhouettes. Discover outfits that redefine modern sophistication and timeless elegance.
            </p>

            <Link
              href="/lookbook"
              className="inline-flex h-16 items-center justify-center px-12 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:bg-black hover:text-white hover:border hover:border-white group"
            >
              Browse Lookbook
              <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="mt-24 flex gap-12 border-t border-white/10 pt-12">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-3xl font-medium font-display italic">12+</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Styles curated</p>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <p className="text-3xl font-medium font-display italic">Weekly</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">New Arrivals</p>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <p className="text-3xl font-medium font-display italic">Pure</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Linen & Silk</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
