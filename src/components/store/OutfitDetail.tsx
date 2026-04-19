'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { addItem, openCart } from '@/store/slices/cartSlice'
import { MessageCircle, Share2, Link as LinkIcon } from 'lucide-react'

interface OutfitDetailProps {
  outfit: any
}

export function OutfitDetail({ outfit }: OutfitDetailProps) {
  const dispatch = useDispatch()

  const handleAddAllToCart = () => {
    outfit.items.forEach((item: any) => {
      const product = item.product
      const price = product.salePrice ?? product.basePrice
      dispatch(
        addItem({
          productId: product.id,
          name: product.name,
          price: Number(price),
          quantity: 1,
          imageUrl: product.images?.[0]?.url ?? '',
        })
      )
    })
    dispatch(openCart())
  }

  const handleAddSingleToCart = (product: any) => {
    const price = product.salePrice ?? product.basePrice
    dispatch(
      addItem({
        productId: product.id,
        name: product.name,
        price: Number(price),
        quantity: 1,
        imageUrl: product.images?.[0]?.url ?? '',
      })
    )
    dispatch(openCart())
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Hero Image */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[3/4] w-full bg-[#FAFAFA]">
            {outfit.imageUrl ? (
              <Image src={outfit.imageUrl} alt={outfit.title} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#A3A3A3]">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Right: Details & Items */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="border-b border-[#E5E5E5] pb-6 mb-6">
            <h1 className="text-4xl font-playfair font-bold mb-4">{outfit.title}</h1>
            <div className="flex gap-2 text-xs uppercase tracking-widest text-[#737373] mb-4">
              <span className="px-2 py-1 bg-[#FAFAFA] border border-[#E5E5E5]">{outfit.gender}</span>
              <span className="px-2 py-1 bg-[#FAFAFA] border border-[#E5E5E5]">{outfit.season}</span>
              <span className="px-2 py-1 bg-[#FAFAFA] border border-[#E5E5E5]">{outfit.occasion}</span>
            </div>
            {outfit.description && <p className="text-[#000000] leading-relaxed">{outfit.description}</p>}
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-playfair font-bold mb-4">Items in this look ({outfit.itemCount})</h2>
            <div className="space-y-4">
              {outfit.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 border border-[#E5E5E5] p-3 bg-white hover:border-[#000000] transition-colors">
                  <Link href={`/products/${item.product.slug}`} className="relative w-24 h-32 bg-[#FAFAFA] flex-shrink-0">
                    {item.product.images?.[0]?.url && (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                    )}
                  </Link>
                  <div className="flex-1 flex flex-col justify-center">
                    <Link href={`/products/${item.product.slug}`} className="font-medium hover:underline text-lg">
                      {item.product.name}
                    </Link>
                    <div className="text-[#737373] mt-1 mb-3">
                      {item.product.salePrice ? (
                        <>
                          <span className="line-through mr-2">PKR {item.product.basePrice}</span>
                          <span className="text-[#000000]">PKR {item.product.salePrice}</span>
                        </>
                      ) : (
                        <span>PKR {item.product.basePrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddSingleToCart(item.product)}
                      className="mt-auto self-start text-sm uppercase tracking-wider font-medium border-b border-black pb-0.5 hover:text-[#737373] hover:border-[#737373] transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-[#E5E5E5]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg text-[#737373]">Complete look</span>
              <span className="text-2xl font-bold">PKR {outfit.totalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={handleAddAllToCart}
              className="w-full bg-[#000000] text-white py-4 font-medium uppercase tracking-widest hover:bg-[#262626] transition-colors mb-6"
            >
              Add All to Cart
            </button>

            <div className="flex items-center justify-center gap-4 text-[#A3A3A3]">
              <span className="text-sm">Share:</span>
              <button className="hover:text-black transition-colors"><MessageCircle className="w-5 h-5" /></button>
              <button className="hover:text-black transition-colors"><Share2 className="w-5 h-5" /></button>
              <button className="hover:text-black transition-colors"><LinkIcon className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
