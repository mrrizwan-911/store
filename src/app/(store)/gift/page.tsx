import Link from 'next/link'
import { Gift, Heart, Package } from 'lucide-react'

export const metadata = {
  title: 'Gift Mode | E-Commerce Platform',
  description: 'Learn about our premium gift wrapping and personalized messaging service.',
}

export default function GiftModePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
      <div className="mb-8 flex justify-center">
        <div className="w-20 h-20 bg-[#FAFAFA] border border-[#E5E5E5] rounded-full flex items-center justify-center">
          <Gift className="w-10 h-10 text-black" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-6">Give the Perfect Gift</h1>
      <p className="text-lg text-[#737373] max-w-2xl mx-auto mb-12">
        Make their day extra special with our premium gift wrapping service. Simply select "This is a gift" at checkout to add a personal touch to your order.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-left">
        <div className="p-6 border border-[#E5E5E5] bg-[#FAFAFA]">
          <Package className="w-8 h-8 mb-4 text-[#000000]" />
          <h3 className="font-playfair text-xl font-bold mb-2">Premium Wrapping</h3>
          <p className="text-[#737373] text-sm">
            Your items are carefully folded and placed in our signature black box, tied with a luxury ribbon.
          </p>
        </div>
        <div className="p-6 border border-[#E5E5E5] bg-[#FAFAFA]">
          <Heart className="w-8 h-8 mb-4 text-[#000000]" />
          <h3 className="font-playfair text-xl font-bold mb-2">Personal Message</h3>
          <p className="text-[#737373] text-sm">
            Add a heartfelt note. We'll hand-write your message on a premium card included with the package.
          </p>
        </div>
        <div className="p-6 border border-[#E5E5E5] bg-[#FAFAFA]">
          <div className="w-8 h-8 flex items-center justify-center font-bold text-xl mb-4 text-[#000000] border-2 border-black rounded-full">
            $
          </div>
          <h3 className="font-playfair text-xl font-bold mb-2">Hidden Prices</h3>
          <p className="text-[#737373] text-sm">
            We automatically remove all price tags and exclude pricing from the packing slip when Gift Mode is on.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/products"
          className="w-full sm:w-auto px-8 py-4 bg-black text-white uppercase tracking-widest font-medium hover:bg-[#262626] transition-colors"
        >
          Shop Now
        </Link>
        <Link
          href="/lookbook"
          className="w-full sm:w-auto px-8 py-4 bg-white text-black border border-black uppercase tracking-widest font-medium hover:bg-[#FAFAFA] transition-colors"
        >
          View Lookbook
        </Link>
      </div>
    </div>
  )
}
