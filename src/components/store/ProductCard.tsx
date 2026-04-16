'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addItem, openCart } from '@/store/slices/cartSlice'
import { toggleWishlist } from '@/store/slices/wishlistSlice'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  imageUrl: string
  secondaryImageUrl?: string
  price: number
  salePrice?: number
  category: string
  avgRating?: number
  reviewCount?: number
  isBadgeNew?: boolean
  isBadgeSale?: boolean
  isLowStock?: boolean
  stockCount?: number
}

export function ProductCard({
  id,
  name,
  slug,
  imageUrl,
  secondaryImageUrl,
  price,
  salePrice,
  category,
  avgRating,
  reviewCount,
  isBadgeNew,
  isBadgeSale,
  isLowStock,
  stockCount,
}: ProductCardProps) {
  const dispatch = useAppDispatch()
  const wishlist = useAppSelector(state => state.wishlist.productIds)
  const isInWishlist = wishlist.includes(id)
  const [isHovered, setIsHovered] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    dispatch(addItem({
      productId: id,
      name,
      price: salePrice || price,
      quantity: 1,
      imageUrl,
    }))
    dispatch(openCart())
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    dispatch(toggleWishlist(id))
  }

  return (
    <div
      className="group relative bg-white rounded-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#FAFAFA]">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          <Image
            src={(isHovered && secondaryImageUrl) ? secondaryImageUrl : imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {isBadgeNew && (
            <span className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">
              New
            </span>
          )}
          {isBadgeSale && (
            <span className="bg-[#E05252] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">
              Sale
            </span>
          )}
        </div>

        {/* Action Icons Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleWishlist}
            className={cn(
              "w-9 h-9 flex items-center justify-center bg-white/95 text-neutral-600 transition-all hover:bg-black hover:text-white shadow-sm border border-neutral-100",
              isInWishlist && "bg-black text-white border-black"
            )}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
          </button>
          <button
            onClick={handleAddToCart}
            className="w-9 h-9 flex items-center justify-center bg-white/95 text-neutral-600 transition-all hover:bg-black hover:text-white shadow-sm border border-neutral-100"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 bg-white text-black py-4 text-[10px] font-bold uppercase tracking-[0.15em] transition-transform duration-500 translate-y-full group-hover:translate-y-0 border-t border-neutral-100 hover:bg-black hover:text-white z-20 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]"
        >
          Quick Add — PKR {(salePrice || price).toLocaleString()}
        </button>
      </div>

      {/* Product Details */}
      <div className="pt-4 pb-4 px-4 flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">
            {category}
          </span>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-bold text-black">{avgRating}</span>
            </div>
          )}
        </div>

        <Link href={`/products/${slug}`} className="block">
          <h3 className="font-display text-lg md:text-xl font-medium tracking-tight group-hover:text-neutral-600 transition-colors">
            {name}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {salePrice ? (
              <>
                <span className="text-sm font-bold text-black font-sans">PKR {salePrice.toLocaleString()}</span>
                <span className="text-xs text-neutral-400 line-through font-sans">PKR {price.toLocaleString()}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-black font-sans">PKR {price.toLocaleString()}</span>
            )}
          </div>

          {/* Low Stock Indicator */}
          {isLowStock && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                Only {stockCount} left
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
