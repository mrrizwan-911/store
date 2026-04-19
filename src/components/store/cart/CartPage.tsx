'use client'

import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updateQuantity, removeItem } from '@/store/slices/cartSlice'
import { addItem as addToWishlist } from '@/store/slices/wishlistSlice'
import { Minus, Plus, Trash2, ArrowLeft, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { CouponInput } from './CouponInput'
import { generateWhatsAppCartUrl } from '@/lib/utils/whatsapp'

export function CartPage() {
  const dispatch = useAppDispatch()
  const { items } = useAppSelector((state) => state.cart)

  const [discount, setDiscount] = useState<{ amount: number; code: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleQuantityChange = (productId: string, variantId: string | undefined, currentQty: number, change: number) => {
    const newQty = currentQty + change
    if (newQty < 1) return
    dispatch(updateQuantity({ productId, variantId, quantity: newQty }))
  }

  const handleRemove = (productId: string, variantId?: string) => {
    dispatch(removeItem({ productId, variantId }))
  }

  const handleCouponApply = (amount: number, code: string) => {
    setDiscount({ amount, code })
  }

  const handleMoveToWishlist = (item: { productId: string; variantId?: string; size?: string; color?: string }) => {
    dispatch(addToWishlist({ productId: item.productId, variantId: item.variantId, size: item.size, color: item.color }))
    dispatch(removeItem({ productId: item.productId, variantId: item.variantId }))
  }

  if (!mounted) return null

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Math.max(0, subtotal - (discount?.amount || 0))

  const handleWhatsAppOrder = () => {
    const url = generateWhatsAppCartUrl(
      items.map(i => ({
        name: i.name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        price: i.price,
      })),
      total
    )
    window.open(url, '_blank')
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-24 h-24 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-6 border border-[#E5E5E5]">
          <svg className="w-10 h-10 text-[#A3A3A3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-[#737373] mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Browse our collections to find your next favorite piece.</p>
        <Link
          href="/products"
          className="h-12 px-8 bg-black text-white hover:bg-[#262626] transition-colors uppercase text-xs font-bold tracking-widest rounded-md flex items-center justify-center"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Left: Item List */}
      <div className="flex-1 px-8 py-10 lg:px-16 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Account Banner */}
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-6 mb-8">
            <div>
              <h3 className="text-[15px] font-bold">Already have an account?</h3>
              <p className="text-[13px] text-[#737373] mt-1 font-medium">Sign in for a better experience.</p>
            </div>
            <Link
              href="/login"
              className="h-9 px-5 border border-[#E5E5E5] text-black hover:bg-[#FAFAFA] transition-colors uppercase text-[11px] font-bold tracking-widest rounded-md flex items-center"
            >
              Sign In
            </Link>
          </div>

          <h3 className="font-serif text-3xl mb-8 tracking-wide font-bold">Cart</h3>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-[#E5E5E5] text-[11px] uppercase tracking-widest text-[#737373] font-bold">
            <div className="col-span-6">Item</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="space-y-0">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId || 'base'}`} className="py-5 border-b border-[#E5E5E5] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="col-span-6 flex gap-5 items-center">
                  <div className="w-20 h-28 bg-[#FAFAFA] border border-[#E5E5E5] shrink-0 rounded-md overflow-hidden relative">
                    <Image
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=400&q=80'}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif text-[17px] leading-tight font-bold pr-2">{item.name}</h4>
                    {item.size || item.color ? (
                      <p className="text-[13px] text-[#737373] mt-1 font-medium">
                        Variant: {[item.size, item.color].filter(Boolean).join(' / ')}
                      </p>
                    ) : null}
                    <button
                      onClick={() => handleMoveToWishlist(item)}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] text-[#737373] hover:text-black transition-colors underline underline-offset-2"
                    >
                      <Heart className="w-3 h-3" />
                      Move to Wishlist
                    </button>
                  </div>
                </div>

                <div className="col-span-2 flex justify-center items-center gap-4">
                  <button
                    onClick={() => handleRemove(item.productId, item.variantId)}
                    className="text-[#737373] hover:text-[#EF4444] transition-colors md:hidden shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center border border-[#E5E5E5] w-24 h-9 rounded-md overflow-hidden shrink-0">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity, -1)}
                      className="w-8 h-full flex justify-center items-center text-[#737373] hover:text-black transition-colors hover:bg-[#FAFAFA]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="flex-1 text-center font-bold text-[13px]">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity, 1)}
                      className="w-8 h-full flex justify-center items-center text-[#737373] hover:text-black transition-colors hover:bg-[#FAFAFA]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 text-right text-[#737373] text-[13px] hidden md:block font-medium">
                  PKR {item.price.toLocaleString()}
                </div>

                <div className="col-span-2 text-right font-bold text-[13px] flex justify-between md:block items-center">
                  <button
                    onClick={() => handleRemove(item.productId, item.variantId)}
                    className="text-[#737373] hover:text-[#EF4444] transition-colors hidden md:inline-block md:float-left shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  PKR {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/products" className="inline-flex items-center gap-2 text-[13px] text-black hover:text-[#737373] transition-colors underline underline-offset-4 decoration-[#E5E5E5] font-bold">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Order Summary Sidebar */}
      <div className="w-full lg:w-[400px] xl:w-[480px] bg-[#FAFAFA] border-t lg:border-t-0 lg:border-l border-[#E5E5E5] px-8 py-10 lg:px-12 lg:py-16 shrink-0">
        <div className="sticky top-16">
          <h3 className="font-serif text-2xl mb-8 tracking-wide font-bold">Summary</h3>

          {/* Coupon Toggle / Input */}
          <CouponInput onApply={handleCouponApply} subtotal={subtotal} />

          <div className="space-y-4 mb-8 text-[13px] border-t border-[#E5E5E5] pt-6 font-medium">
            <div className="flex justify-between">
              <span className="text-[#737373]">Subtotal</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>

            {discount && (
              <div className="flex justify-between text-[#10B981]">
                <span>Discount ({discount.code})</span>
                <span>- PKR {discount.amount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[#737373]">Shipping</span>
              <span>PKR 0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Taxes</span>
              <span>PKR 0</span>
            </div>

            <hr className="border-[#E5E5E5] my-4" />

            <div className="flex justify-between items-center">
              <span className="font-bold text-[15px]">Total</span>
              <span className="font-serif text-2xl font-bold">PKR {total.toLocaleString()}</span>
            </div>
          </div>

          <Link href="/checkout" className="w-full h-12 bg-black text-white hover:bg-[#262626] transition-colors uppercase text-[11px] font-bold tracking-widest mb-3 shadow-sm rounded-md flex justify-center items-center">
            Proceed to Checkout
          </Link>

          <button
            onClick={handleWhatsAppOrder}
            className="w-full h-12 border border-[#E5E5E5] bg-white text-black hover:bg-[#FAFAFA] transition-colors flex items-center justify-center gap-2 uppercase text-[11px] font-bold tracking-widest rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" /><path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" /><path d="M9 15a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1Z" /><path d="M14 15a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1Z" /></svg>
            Order via WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
