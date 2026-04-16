'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function LookbookTeaser() {
  return (
    <section className="bg-black py-24 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-4 relative">
            <div className="aspect-[3/4] relative overflow-hidden mt-16 group cursor-pointer">
              <Image
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800"
                alt="Lookbook Model 1"
                fill
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              />
            </div>
            <div className="aspect-[3/4] relative overflow-hidden group cursor-pointer">
              <Image
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
                alt="Lookbook Model 2"
                fill
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              />
            </div>
            {/* Absolute detail element */}
            <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-64 border border-white/5 p-2 z-10 backdrop-blur-md bg-white/5 transition-all duration-700 hover:scale-105">
              <div className="relative w-full h-full grayscale hover:grayscale-0 transition-all duration-700">
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
              <div className="space-y-2">
                <p className="text-3xl font-medium font-display italic">12+</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Styles curated</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-medium font-display italic">Weekly</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">New Arrivals</p>
              </div>
              <div className="space-y-2">
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
