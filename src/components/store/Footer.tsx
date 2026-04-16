'use client'

import Link from 'next/link'
import { Camera, Globe, Share2, Phone as WhatsApp, Mail, MapPin } from 'lucide-react'

const FOOTER_LINKS = {
  about: [
    { label: 'Our Story', href: '/story' },
    { label: 'Craftsmanship', href: '/craftsmanship' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Journal', href: '/journal' },
  ],
  categories: [
    { label: 'Clothes', href: '/categories/clothes' },
    { label: 'Shoes', href: '/categories/shoes' },
    { label: 'Apparel', href: '/categories/apparel' },
    { label: 'Accessories', href: '/categories/accessories' },
  ],
  help: [
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Track Order', href: '/track' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-black text-white pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12 mb-24">

          {/* About */}
          <div className="space-y-8">
            <Link href="/" className="shrink-0 group cursor-pointer flex flex-col items-start gap-1">
              <span className="font-serif text-2xl font-medium tracking-[0.2em] text-white uppercase transition-all group-hover:tracking-[0.25em] leading-tight">
                STORE
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-sans font-medium">
                Curated modern wardrobe
              </span>
            </Link>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-xs font-light font-sans">
              Redefining luxury fashion for the modern era. Curated with surgical precision and ethical craftsmanship in Pakistan.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                <Camera className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                <Globe className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                <Share2 className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-10 text-white/30">Collections</h4>
            <ul className="flex flex-col gap-5">
              {FOOTER_LINKS.categories.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors font-medium uppercase tracking-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-10 text-white/30">Customer Care</h4>
            <ul className="flex flex-col gap-5">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors font-medium uppercase tracking-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-10 text-white/30">Get In Touch</h4>
            <ul className="flex flex-col gap-8">
              <li className="flex gap-4 items-start">
                <WhatsApp className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">WhatsApp</p>
                   <p className="text-[13px] text-white/60 font-light">+92 300 1234567</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <Mail className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">Concierge</p>
                   <p className="text-[13px] text-white/60 font-light">concierge@store.pk</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">Studio</p>
                   <p className="text-[13px] text-white/60 font-light max-w-[200px]">DHA Phase 6, Lahore, Pakistan</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-medium">
            © {new Date().getFullYear()} STORE E-COMMERCE. ALL RIGHTS RESERVED.
          </p>

          <div className="flex gap-8 items-center">
            <div className="flex gap-6 opacity-20 grayscale hover:grayscale-0 transition-all duration-700 items-center">
               <span className="text-[10px] font-bold tracking-widest">JAZZCASH</span>
               <span className="text-[10px] font-bold tracking-widest">EASYPAISA</span>
               <span className="text-[10px] font-bold tracking-widest">VISA</span>
               <span className="text-[10px] font-bold tracking-widest">MASTERCARD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
