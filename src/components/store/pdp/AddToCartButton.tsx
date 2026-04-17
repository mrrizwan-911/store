'use client'

import { useState } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { addItem, openCart } from '@/store/slices/cartSlice'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    basePrice: number
    salePrice?: number | null
    images: { url: string }[]
  }
  selectedVariant: {
    id: string
    size?: string | null
    color?: string | null
    stock: number
    price?: number | null
  } | null
  quantity: number
  className?: string
}

export default function AddToCartButton({
  product,
  selectedVariant,
  quantity,
  className,
}: AddToCartButtonProps) {
  const dispatch = useAppDispatch()
  const [isAdding, setIsAdding] = useState(false)

  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false
  const isDisabled = !selectedVariant || isOutOfStock || isAdding

  const handleAddToCart = () => {
    if (!selectedVariant) return

    setIsAdding(true)

    // Simulate a small delay for better UX
    setTimeout(() => {
      dispatch(
        addItem({
          productId: product.id,
          variantId: selectedVariant.id,
          name: product.name,
          price: Number(selectedVariant.price || product.salePrice || product.basePrice),
          quantity: quantity,
          imageUrl: product.images[0]?.url || '',
          size: selectedVariant.size || undefined,
          color: selectedVariant.color || undefined,
        })
      )
      dispatch(openCart())
      setIsAdding(false)
    }, 500)
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={cn(
        'w-full h-12 rounded-none text-base font-medium transition-all duration-300',
        !selectedVariant && 'bg-neutral-200 text-neutral-500 cursor-not-allowed',
        isOutOfStock && 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
        !isDisabled && 'hover:bg-primary-hover active:scale-[0.98]',
        className
      )}
    >
      <ShoppingBag className="mr-2 h-5 w-5" />
      {isAdding ? (
        'Adding...'
      ) : isOutOfStock ? (
        'Out of Stock'
      ) : !selectedVariant ? (
        'Select Size & Color'
      ) : (
        'Add to Cart'
      )}
    </Button>
  )
}
