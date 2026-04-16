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
    <footer className="bg-black text-white pt-24 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">

          {/* About */}
          <div>
            <Link href="/" className="font-display text-2xl font-bold tracking-tighter mb-8 block uppercase">
              STORE
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-xs font-light">
              Redefining luxury fashion for the modern era. Curated with surgical precision and ethical craftsmanship in Pakistan.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Camera className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Globe className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Share2 className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-8 text-white/40">Collections</h4>
            <ul className="flex flex-col gap-4">
              {FOOTER_LINKS.categories.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors font-light uppercase tracking-widest">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-8 text-white/40">Customer Care</h4>
            <ul className="flex flex-col gap-4">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors font-light uppercase tracking-widest">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-8 text-white/40">Get In Touch</h4>
            <ul className="flex flex-col gap-6">
              <li className="flex gap-3">
                <WhatsApp className="w-5 h-5 text-[#E8D5B0] flex-shrink-0" />
                <p className="text-sm text-white/60 font-light">+92 300 1234567</p>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-[#E8D5B0] flex-shrink-0" />
                <p className="text-sm text-white/60 font-light">concierge@store.pk</p>
              </li>
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-[#E8D5B0] flex-shrink-0" />
                <p className="text-sm text-white/60 font-light max-w-[200px]">DHA Phase 6, Lahore, Pakistan</p>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] uppercase tracking-widest text-white/30">
            © {new Date().getFullYear()} STORE E-COMMERCE. ALL RIGHTS RESERVED.
          </p>

          <div className="flex gap-6 items-center">
            {/* Payment Icons Placeholders */}
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">Secure Payments via</span>
            <div className="flex gap-3 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Replace with actual SVGs later */}
               <span className="text-[10px] font-bold">JAZZCASH</span>
               <span className="text-[10px] font-bold">EASYPAISA</span>
               <span className="text-[10px] font-bold">VISA</span>
               <span className="text-[10px] font-bold">MASTERCARD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
