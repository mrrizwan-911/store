'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

import heroBoutique from '@/assets/images/hero-boutique.jpg'
import heroAccessories from '@/assets/images/hero-accessories.jpg'

const SLIDES = [
  {
    image: heroBoutique,
    title: 'Boutique',
  },
  {
    image: heroAccessories,
    title: 'Accessories',
  },
]

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6400)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-[calc(100vh-70px)] min-h-[600px] w-full overflow-hidden bg-white">
      {/* Slider Background */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 z-0"
        >
          <div className="relative h-full w-full overflow-hidden">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1.02 }}
              transition={{ duration: 6.4, ease: "linear" }}
              className="absolute inset-0"
            >
              <Image
                src={SLIDES[currentSlide].image}
                alt={SLIDES[currentSlide].title}
                fill
                priority
                className="object-cover"
              />
            </motion.div>
            {/* Triple Overlays for Premium Look */}
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-4xl"
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.4em] text-white/70 font-sans">
            Modern Boutique Essentials
          </p>

          <h1 className="mb-8 font-display text-5xl font-bold leading-[0.9] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[7.5rem]">
            Dress for
            <br />
            <span className="italic font-normal">the life</span>
            <br />
            you want
          </h1>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/products"
              className="inline-flex min-w-[180px] items-center justify-center bg-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-all hover:bg-neutral-200 font-sans"
            >
              Shop Now
            </Link>
            <Link
              href="/lookbook"
              className="inline-flex min-w-[180px] items-center justify-center border border-white/60 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-white hover:text-black font-sans"
            >
              View Lookbook
            </Link>
          </div>

          {/* Slide indicators / Progress Bars */}
          <div className="mt-16 flex gap-4">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className="relative h-[2px] w-16 bg-white/20 cursor-pointer overflow-hidden"
                onClick={() => setCurrentSlide(index)}
              >
                {currentSlide === index && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 6.4, ease: "linear" }}
                    className="absolute inset-0 bg-white"
                  />
                )}
                {currentSlide > index && (
                  <div className="absolute inset-0 bg-white" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right-side Vertical Text */}
      <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 md:right-12 md:block">
        <p className="font-sans text-[10px] uppercase tracking-[0.6em] text-white/30 [writing-mode:vertical-rl] rotate-180">
          Curated Essentials — Est. 2026
        </p>
      </div>

      {/* Decorative vertical line */}
      <div className="absolute right-8 bottom-0 z-20 hidden h-24 w-[1px] bg-gradient-to-t from-white/20 to-transparent md:block" />
    </section>
  )
}
