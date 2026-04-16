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
      className="group relative bg-white border border-border hover:border-black/20 transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link href={`/products/${slug}`} className="relative block aspect-[4/5] overflow-hidden">
        <Image
          src={(isHovered && secondaryImageUrl) ? secondaryImageUrl : imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
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
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlist}
            className={cn(
              "w-9 h-9 flex items-center justify-center bg-white border border-border hover:bg-black hover:text-white transition-all",
              isInWishlist && "bg-black text-white border-black"
            )}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
          </button>
          <button
            onClick={handleAddToCart}
            className="w-9 h-9 flex items-center justify-center bg-white border border-border hover:bg-black hover:text-white transition-all"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

        {/* Low Stock Indicator */}
        {isLowStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#E8A838]/90 py-1 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white">
              Only {stockCount} left!
            </p>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
            {category}
          </span>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-[#E8D5B0] text-[#E8D5B0]" />
              <span className="text-[10px] font-medium">{avgRating}</span>
            </div>
          )}
        </div>

        <Link href={`/products/${slug}`} className="block">
          <h3 className="font-display text-sm font-semibold uppercase tracking-tight group-hover:text-neutral-600 transition-colors">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-1">
          {salePrice ? (
            <>
              <span className="text-sm font-bold text-black">PKR {salePrice.toLocaleString()}</span>
              <span className="text-xs text-neutral-400 line-through">PKR {price.toLocaleString()}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-black">PKR {price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  )
}
