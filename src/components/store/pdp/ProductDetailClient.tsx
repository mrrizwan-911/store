'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ImageGallery from './ImageGallery'
import VariantSelector from './VariantSelector'
import AddToCartButton from './AddToCartButton'
import ReviewsSection from './ReviewsSection'
import { ProductCard } from '../shared/ProductCard'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  MessageCircle,
  Heart,
  RefreshCcw,
  Truck,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string | null
  basePrice: any // Decimal from Prisma
  salePrice?: any | null
  sku: string
  category: {
    name: string
    slug: string
  }
  images: {
    id: string
    url: string
    altText?: string | null
    isPrimary: boolean
  }[]
  variants: {
    id: string
    size?: string | null
    color?: string | null
    stock: number
    price?: any | null
    sku: string
  }[]
  reviews: any[]
  avgRating: number | null
  reviewCount: number
}

interface ProductDetailClientProps {
  product: Product
  relatedProducts: any[]
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.variants.find(v => v.color)?.color || null
  )
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description')

  const selectedVariant = useMemo(() => {
    return product.variants.find(
      (v) =>
        (!selectedColor || v.color === selectedColor) &&
        (!selectedSize || v.size === selectedSize)
    ) || null
  }, [product.variants, selectedColor, selectedSize])

  const currentPrice = Number(selectedVariant?.price || product.salePrice || product.basePrice)
  const originalPrice = product.salePrice ? Number(product.basePrice) : null

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      const maxStock = selectedVariant?.stock || 99
      if (quantity < maxStock) setQuantity(prev => prev + 1)
    } else {
      if (quantity > 1) setQuantity(prev => prev - 1)
    }
  }

  const handleWhatsAppOrder = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in the ${product.name}.\n` +
      `URL: ${window.location.origin}/products/${product.slug}\n` +
      (selectedColor ? `Color: ${selectedColor}\n` : '') +
      (selectedSize ? `Size: ${selectedSize}\n` : '') +
      `Quantity: ${quantity}`
    )
    window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+923000000000'}?text=${message}`, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-secondary mb-12">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/categories/${product.category.slug}`} className="hover:text-primary transition-colors">
          {product.category.name}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-text-primary truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-24">
        {/* Left: Image Gallery (7 cols on large screens) */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Product Details (5 cols on large screens) */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display uppercase leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={cn(
                      "text-sm",
                      i < Math.round(product.avgRating || 0) ? "opacity-100" : "opacity-20"
                    )}>★</span>
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                  ({product.reviewCount} Reviews)
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                SKU: {selectedVariant?.sku || product.sku}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-2xl font-light tracking-tight">
                PKR {currentPrice.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-lg text-text-secondary line-through opacity-50">
                  PKR {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <p className="text-text-secondary leading-relaxed">
            {product.shortDescription || product.description.substring(0, 160) + '...'}
          </p>

          <VariantSelector
            variants={product.variants}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onColorChange={setSelectedColor}
            onSizeChange={setSelectedSize}
          />

          <div className="space-y-6 pt-4">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Quantity</span>
              <div className="flex items-center border border-border">
                <button
                  onClick={() => handleQuantityChange('dec')}
                  className="p-3 hover:bg-neutral-50 transition-colors disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-12 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange('inc')}
                  className="p-3 hover:bg-neutral-50 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Stock Badge */}
              <div className="ml-auto">
                {selectedVariant && (
                  <div className={cn(
                    "flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold",
                    selectedVariant.stock > 10 ? "text-success" :
                    selectedVariant.stock > 0 ? "text-warning" : "text-error"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      selectedVariant.stock > 10 ? "bg-success" :
                      selectedVariant.stock > 0 ? "bg-warning" : "bg-error"
                    )} />
                    {selectedVariant.stock > 10 ? "In Stock" :
                     selectedVariant.stock > 0 ? `Only ${selectedVariant.stock} left!` : "Out of Stock"}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <AddToCartButton
                product={product}
                selectedVariant={selectedVariant}
                quantity={quantity}
              />
              <button
                onClick={handleWhatsAppOrder}
                className="w-full h-12 border border-black flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-bold hover:bg-neutral-50 transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                Order via WhatsApp
              </button>
            </div>

            <div className="flex justify-center gap-8 pt-2">
              <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">
                <Heart className="w-4 h-4" />
                Add to Wishlist
              </button>
              <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">
                <RefreshCcw className="w-4 h-4" />
                Compare
              </button>
            </div>
          </div>

          {/* Info Features */}
          <div className="grid grid-cols-2 gap-y-6 pt-10 border-t border-border">
            <div className="flex gap-3">
              <Truck className="w-5 h-5 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Free Delivery</h4>
                <p className="text-[11px] text-text-secondary">On orders over PKR 3,000</p>
              </div>
            </div>
            <div className="flex gap-3">
              <RefreshCcw className="w-5 h-5 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Easy Returns</h4>
                <p className="text-[11px] text-text-secondary">7-day hassle free returns</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Genuine Products</h4>
                <p className="text-[11px] text-text-secondary">100% authentic quality</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MessageCircle className="w-5 h-5 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Expert Support</h4>
                <p className="text-[11px] text-text-secondary">24/7 dedicated assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-32">
        <div className="flex justify-center border-b border-border mb-12">
          {['description', 'reviews', 'shipping'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-8 py-6 text-xs uppercase tracking-[0.3em] font-bold transition-all relative",
                activeTab === tab ? "text-primary" : "text-text-secondary hover:text-primary"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
              )}
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto py-8 min-h-[300px]">
          {activeTab === 'description' && (
            <div className="prose prose-neutral max-w-none text-text-primary">
              <div className="whitespace-pre-wrap leading-loose text-lg font-light">
                {product.description}
              </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <ReviewsSection
              reviews={product.reviews}
              avgRating={product.avgRating}
              reviewCount={product.reviewCount}
            />
          )}
          {activeTab === 'shipping' && (
            <div className="grid md:grid-cols-2 gap-12 text-sm">
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest">Shipping & Handling</h4>
                <p className="text-text-secondary leading-relaxed">
                  We currently offer delivery across all major cities in Pakistan. Orders are typically processed
                  within 24-48 hours. Standard delivery takes 3-5 business days. Express delivery (available
                  in selected cities) takes 1-2 business days.
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Free standard delivery is available on all orders exceeding PKR 3,000.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest">Returns & Exchanges</h4>
                <p className="text-text-secondary leading-relaxed">
                  We accept returns for items in their original condition (unworn, unwashed, with tags attached)
                  within 7 days of delivery. For hygiene reasons, certain categories like undergarments and
                  earrings are not eligible for return unless defective.
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Refunds are processed to your original payment method within 5-7 working days after we
                  receive and inspect the return.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-32 border-t border-border pt-24">
          <div className="flex justify-between items-end mb-12">
            <h3 className="text-3xl font-display uppercase tracking-tight">You Might Also Like</h3>
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-black pb-1 hover:opacity-50 transition-opacity"
            >
              View All {product.category.name}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.basePrice)}
                salePrice={p.salePrice ? Number(p.salePrice) : undefined}
                category={p.category.name}
                imageUrl={p.images[0]?.url || ''}
                avgRating={p.avgRating || undefined}
                reviewCount={p.reviewCount}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
