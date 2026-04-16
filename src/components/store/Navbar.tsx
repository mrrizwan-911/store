'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart, User, Search, Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleCart } from '@/store/slices/cartSlice'
import { cn } from '@/lib/utils'

const NAV_CATEGORIES = [
  {
    label: 'Clothes',
    href: '/categories/clothes',
    sub: ['Tops', 'Bottoms', 'Outerwear', 'Formal', 'Casual'],
  },
  {
    label: 'Shoes',
    href: '/categories/shoes',
    sub: ['Sneakers', 'Formal', 'Sandals', 'Boots', 'Sports'],
  },
  {
    label: 'Apparel',
    href: '/categories/apparel',
    sub: ['Kurtas', 'Shalwar Kameez', 'Abayas', 'Sportswear'],
  },
  {
    label: 'Accessories',
    href: '/categories/accessories',
    sub: ['Bags', 'Belts', 'Wallets', 'Sunglasses', 'Watches'],
  },
]

export function Navbar() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(state => state.cart.items)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinkStyles = "relative text-[11px] font-medium uppercase tracking-[0.3em] text-gray-800 hover:text-black transition-colors font-sans after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-400 hover:after:scale-x-100"

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300 border-b border-gray-100 bg-white/95 backdrop-blur-xl",
      isScrolled ? "py-2" : "py-4"
    )}>
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex h-[74px] items-center gap-6">

          {/* Logo Area */}
          <Link href="/" className="shrink-0 group cursor-pointer flex flex-col">
            <span className="block font-serif text-2xl font-semibold tracking-[0.2em] text-black uppercase transition-all group-hover:tracking-[0.25em]">
              STORE
            </span>
            <span className="block text-[9px] uppercase tracking-[0.4em] text-gray-400 font-sans mt-0.5">
              Curated modern wardrobe
            </span>
          </Link>

          {/* Desktop Nav (Boxless & Minimalist) */}
          <div className="hidden flex-1 justify-center lg:flex">
            <nav className="flex items-center gap-12">
              {NAV_CATEGORIES.map(cat => (
                <div
                  key={cat.label}
                  className="relative group h-full flex items-center"
                  onMouseEnter={() => setActiveCategory(cat.label)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link href={cat.href} className={navLinkStyles}>
                    {cat.label}
                  </Link>

                  {activeCategory === cat.label && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50">
                      <div className="bg-white border border-gray-100 p-5 min-w-[200px] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col gap-3">
                          {cat.sub.map(sub => (
                            <Link
                              key={sub}
                              href={`${cat.href}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-[12px] text-neutral-500 hover:text-black hover:translate-x-1 transition-all"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right Icons (No Boxes, Increased Size) */}
          <div className="ml-auto flex items-center gap-6">
            <button className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gray-600 hover:text-black transition-all md:inline-flex font-sans" aria-label="Search">
              <Search className="h-5 w-5" />
              Search
            </button>
            <div className="flex items-center gap-5">
              <Link href="/wishlist" className="text-gray-600 hover:text-black transition-all" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
              <Link href={isAuthenticated ? '/account' : '/login'} className="text-gray-600 hover:text-black transition-all" aria-label="Account">
                <User className="h-5 w-5" />
              </Link>
              <button
                onClick={() => dispatch(toggleCart())}
                className="relative text-gray-600 hover:text-black transition-all"
                aria-label={`Cart with ${cartCount} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-3.5 w-3.5 items-center justify-center bg-black text-[8px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex lg:hidden">
              <Sheet>
                <SheetTrigger className="text-black">
                  <Menu className="h-6 w-6" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 bg-white">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex flex-col h-full py-8 px-6">
                    <Link href="/" className="font-display text-2xl font-bold tracking-tighter mb-8">
                      STORE
                    </Link>
                    <nav className="flex flex-col gap-6">
                      {NAV_CATEGORIES.map(cat => (
                        <div key={cat.label} className="flex flex-col gap-3">
                          <Link
                            href={cat.href}
                            className="text-sm font-medium uppercase tracking-widest text-black border-b border-black/5 pb-2"
                          >
                            {cat.label}
                          </Link>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-2">
                            {cat.sub.map(sub => (
                              <Link
                                key={sub}
                                href={`${cat.href}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-[12px] text-neutral-500 hover:text-black transition-colors"
                              >
                                {sub}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </nav>

                    <div className="mt-auto pt-8 border-t border-black/5 flex flex-col gap-4">
                      <Link href="/account" className="flex items-center gap-3 text-sm font-medium">
                        <User className="w-4 h-4" /> My Account
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-3 text-sm font-medium">
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
