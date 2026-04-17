'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SortOption {
  label: string
  value: string
}

const SORT_OPTIONS: SortOption[] = [
  { label: 'Newest First', value: 'createdAt_desc' },
  { label: 'Price: Low to High', value: 'basePrice_asc' },
  { label: 'Price: High to Low', value: 'basePrice_desc' },
  { label: 'Name: A to Z', value: 'name_asc' },
]

interface SortDropdownProps {
  value: string
  onChange: (value: string) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0]

  return (
    <div
      className="relative z-20"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-black pb-1 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        Sort By: {selectedOption.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="absolute top-full right-0 mt-0 w-48 bg-white border border-black z-50 shadow-xl"
          >
            <ul className="py-1" role="listbox">
              {SORT_OPTIONS.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "px-5 py-3 text-[10px] uppercase tracking-widest cursor-pointer transition-colors",
                    option.value === value ? "bg-neutral-50 font-bold" : "text-neutral-500 hover:bg-neutral-50 hover:text-black"
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
