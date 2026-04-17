'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface ProductImage {
  id: string
  url: string
  altText?: string | null
  isPrimary: boolean
}

interface ImageGalleryProps {
  images: ProductImage[]
  productName: string
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const mainImageRef = useRef<HTMLDivElement>(null)

  const activeImage = images[activeIndex] || images[0]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return
    const { left, top, width, height } = mainImageRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] w-full bg-neutral-100 flex items-center justify-center">
        <span className="text-neutral-400">No images available</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden group cursor-crosshair bg-surface"
        ref={mainImageRef}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.altText || productName}
          fill
          priority
          className={cn(
            "object-cover transition-transform duration-500",
            isZoomed ? "scale-[1.8]" : "scale-100"
          )}
          style={
            isZoomed
              ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
        />

        {/* Navigation Arrows (Desktop Hover) */}
        <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="p-2 bg-white/80 hover:bg-white text-black transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="p-2 bg-white/80 hover:bg-white text-black transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Indicator */}
        {!isZoomed && (
          <div className="absolute bottom-4 right-4 p-2 bg-white/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4 text-black" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-0 flex flex-col gap-2 pointer-events-none">
          {activeIndex === 0 && (
            <span className="bg-black text-white px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
              New Arrival
            </span>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-5 gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative aspect-[4/5] overflow-hidden border transition-all duration-300",
              activeIndex === index
                ? "border-primary ring-1 ring-primary"
                : "border-transparent hover:border-neutral-300"
            )}
          >
            <Image
              src={image.url}
              alt={image.altText || `${productName} thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 20vw, 10vw"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
