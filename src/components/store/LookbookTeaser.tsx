'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function LookbookTeaser() {
  return (
    <section className="bg-black py-24 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-4 relative">
            <div className="aspect-[3/4] relative overflow-hidden mt-12">
              <Image
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800"
                alt="Lookbook Model 1"
                fill
                className="object-cover"
              />
            </div>
            <div className="aspect-[3/4] relative overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
                alt="Lookbook Model 2"
                fill
                className="object-cover"
              />
            </div>
            {/* Absolute element */}
            <div className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 w-48 h-64 border border-white/10 p-2 z-10 backdrop-blur-sm bg-black/20">
              <div className="relative w-full h-full">
                <Image
                  src="https://images.unsplash.com/photo-1485230895905-ec17ba36b580?auto=format&fit=crop&q=80&w=400"
                  alt="Detail"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-xl">
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold mb-6 block">
              Editorial Volume 01
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-medium leading-[1.1] mb-8 uppercase tracking-tighter">
              Complete the <br />
              <span className="italic">Luxury</span> Look
            </h2>
            <p className="text-white/60 text-base md:text-lg font-light leading-relaxed mb-12 max-w-lg">
              Our stylists have curated the season&apos;s most influential silhouettes. Discover outfits that redefine modern sophistication.
            </p>

            <Link
              href="/lookbook"
              className="inline-flex h-14 items-center justify-center px-10 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#E8D5B0] hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse Lookbook
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>

            <div className="mt-20 flex gap-12 border-t border-white/10 pt-10">
              <div>
                <p className="text-2xl font-bold mb-1">12+</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Styles curated</p>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">Weekly</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">New Arrivals</p>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">Pure</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Linen & Silk</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
