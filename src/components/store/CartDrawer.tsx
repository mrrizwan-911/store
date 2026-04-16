'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { closeCart, removeItem, updateQuantity } from '@/store/slices/cartSlice'
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function CartDrawer() {
  const dispatch = useAppDispatch()
  const { items, isOpen } = useAppSelector(state => state.cart)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && dispatch(closeCart())}>
      <SheetContent className="w-full sm:max-w-md p-0 bg-white flex flex-col">
        <SheetHeader className="px-6 py-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Your Cart ({itemCount})
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="font-display text-lg mb-2">Your cart is empty</h3>
            <p className="text-neutral-500 text-sm mb-8 max-w-[250px]">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Button
              variant="default"
              className="rounded-none px-8 uppercase tracking-widest text-xs h-12"
              onClick={() => dispatch(closeCart())}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="py-6 flex flex-col gap-6">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId || 'default'}`} className="flex gap-4">
                    <div className="relative w-24 h-32 flex-shrink-0 bg-neutral-100 border border-border">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-medium uppercase tracking-tight line-clamp-1">{item.name}</h4>
                        <button
                          onClick={() => dispatch(removeItem({ productId: item.productId, variantId: item.variantId }))}
                          className="text-neutral-400 hover:text-black transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-2">
                        {item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`}
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => dispatch(updateQuantity({ ...item, quantity: Math.max(1, item.quantity - 1) }))}
                            className="p-1.5 hover:bg-neutral-50 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ ...item, quantity: item.quantity + 1 }))}
                            className="p-1.5 hover:bg-neutral-50 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold">PKR {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 bg-neutral-50 border-t border-border">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500 uppercase tracking-widest">Subtotal</span>
                  <span className="text-lg font-bold">PKR {subtotal.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest leading-relaxed">
                  Shipping, taxes, and discounts calculated at checkout.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/checkout"
                  onClick={() => dispatch(closeCart())}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full h-14 rounded-none uppercase tracking-[0.2em] text-xs font-bold"
                  )}
                >
                  Checkout Now
                </Link>
                <Link
                  href="/cart"
                  onClick={() => dispatch(closeCart())}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full h-14 rounded-none uppercase tracking-[0.2em] text-xs font-bold border-black/10 hover:bg-black hover:text-white transition-all flex items-center justify-center"
                  )}
                >
                  View Shopping Bag
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
