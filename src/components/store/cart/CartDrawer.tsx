'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { closeCart, updateQuantity, removeItem } from '@/store/slices/cartSlice'
import { addItem as addToWishlist } from '@/store/slices/wishlistSlice'
import { X, Minus, Plus, Trash2, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function CartDrawer() {
  const dispatch = useAppDispatch()
  const { items, isOpen } = useAppSelector((state) => state.cart)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for persisted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debounced quantity update wrapper
  const handleQuantityChange = (productId: string, variantId: string | undefined, currentQty: number, change: number) => {
    const newQty = currentQty + change
    if (newQty < 1) return
    dispatch(updateQuantity({ productId, variantId, quantity: newQty }))
    // Note: Debounced API call for logged-in users would go here
  }

  const handleRemove = (productId: string, variantId?: string) => {
    dispatch(removeItem({ productId, variantId }))
  }

  const handleMoveToWishlist = (item: { productId: string; variantId?: string; size?: string; color?: string }) => {
    dispatch(addToWishlist({ productId: item.productId, variantId: item.variantId, size: item.size, color: item.color }))
    dispatch(removeItem({ productId: item.productId, variantId: item.variantId }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (!mounted) return null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 transition-opacity" 
        onClick={() => dispatch(closeCart())}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white border-l border-[#E5E5E5] flex flex-col shadow-2xl h-full animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
          <h3 className="font-serif text-xl tracking-wide font-bold">Your Cart ({items.length} items)</h3>
          <button 
            onClick={() => dispatch(closeCart())}
            className="text-[#737373] hover:text-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <p className="text-[#737373]">Your cart is empty.</p>
              <button 
                onClick={() => dispatch(closeCart())}
                className="h-10 px-6 border border-black text-black hover:bg-[#FAFAFA] transition-colors uppercase text-xs font-bold tracking-widest rounded-md"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId || 'base'}`}>
                <div className="flex gap-5 items-center">
                  <div className="w-20 h-28 bg-[#FAFAFA] border border-[#E5E5E5] shrink-0 rounded-md overflow-hidden relative">
                    <Image 
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=400&q=80'} 
                      alt={item.name} 
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif text-base leading-tight font-bold pr-4">{item.name}</h4>
                      <button 
                        onClick={() => handleRemove(item.productId, item.variantId)}
                        className="text-[#737373] hover:text-[#EF4444] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.size || item.color ? (
                      <p className="text-[13px] text-[#737373] mt-1 font-medium">
                        Variant: {[item.size, item.color].filter(Boolean).join(' / ')}
                      </p>
                    ) : null}
                    <p className="mt-2 font-bold text-[13px]">PKR {item.price.toLocaleString()}</p>
                    <button
                      onClick={() => handleMoveToWishlist(item)}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] text-[#737373] hover:text-black transition-colors underline underline-offset-2"
                    >
                      <Heart className="w-3 h-3" />
                      Move to Wishlist
                    </button>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-[#E5E5E5] w-24 h-8 rounded-md overflow-hidden">
                        <button 
                          onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity, -1)}
                          className="w-8 h-full flex justify-center items-center text-[#737373] hover:text-black hover:bg-[#FAFAFA] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center font-bold text-[13px]">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity, 1)}
                          className="w-8 h-full flex justify-center items-center text-[#737373] hover:text-black hover:bg-[#FAFAFA] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="border-[#E5E5E5] mt-5" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E5E5E5] p-6 bg-[#FAFAFA]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[#737373] font-medium text-sm">Subtotal</span>
              <span className="font-serif text-xl font-bold">PKR {subtotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-[#737373] mb-6">Shipping & taxes calculated at checkout.</p>

            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/cart"
                onClick={() => dispatch(closeCart())}
                className="w-full h-12 border border-black text-black hover:bg-white transition-colors uppercase text-[11px] font-bold tracking-widest rounded-md flex items-center justify-center"
              >
                View Cart
              </Link>
              <Link 
                href="/checkout"
                onClick={() => dispatch(closeCart())}
                className="w-full h-12 bg-black text-white hover:bg-[#262626] transition-colors uppercase text-[11px] font-bold tracking-widest rounded-md flex items-center justify-center"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
