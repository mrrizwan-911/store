'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2, Package, ShoppingBag, Users, FileText,
  Archive, Tag, Zap, Shirt, Star, Mail, Settings, LogOut
} from 'lucide-react'

const navItems = [
  { icon: BarChart2, label: 'Analytics', route: '/admin/analytics' },
  { icon: Package, label: 'Products', route: '/admin/products' },
  { icon: ShoppingBag, label: 'Orders', route: '/admin/orders' },
  { icon: Users, label: 'Customers', route: '/admin/customers' },
  { icon: FileText, label: 'Quotations', route: '/admin/quotations' },
  { icon: Archive, label: 'Inventory', route: '/admin/inventory' },
  { icon: Tag, label: 'Coupons', route: '/admin/coupons' },
  { icon: Zap, label: 'Flash Sales', route: '/admin/flash-sales' },
  { icon: Shirt, label: 'Outfits', route: '/admin/outfits' },
  { icon: Star, label: 'Loyalty', route: '/admin/loyalty' },
  { icon: Mail, label: 'Notifications', route: '/admin/notifications' },
  { icon: Settings, label: 'Settings', route: '/admin/settings' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-white border-r border-black flex flex-col h-full font-sans">
      <div className="p-6 border-b border-black">
        <h1 className="text-xl font-bold font-serif tracking-wide uppercase">Admin</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.route)
            const Icon = item.icon
            return (
              <li key={item.route}>
                <Link
                  href={item.route}
                  className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                    isActive
                      ? 'border-l-2 border-black bg-neutral-100 text-black font-medium'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-black border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-black mt-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-bold">Admin User</p>
            <p className="text-xs text-neutral-500">admin@store.com</p>
          </div>
        </div>
        <button
          onClick={() => {
            // Logout logic will be hooked up later
            window.location.href = '/login'
          }}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
