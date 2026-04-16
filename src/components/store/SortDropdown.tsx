'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SortDropdownProps {
  value: string
  onChange: (value: string) => void
}

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt_desc' },
  { label: 'Oldest First', value: 'createdAt_asc' },
  { label: 'Price: Low to High', value: 'basePrice_asc' },
  { label: 'Price: High to Low', value: 'basePrice_desc' },
  { label: 'Alphabetical: A-Z', value: 'name_asc' },
]

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold hidden sm:block">
        Sort By
      </span>
      <Select value={value} onValueChange={(val) => val && onChange(val)}>
        <SelectTrigger className="w-[180px] h-10 rounded-none border-neutral-200 bg-white text-[11px] uppercase tracking-widest font-medium focus:ring-black">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="rounded-none border-neutral-200">
          {SORT_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-[11px] uppercase tracking-widest focus:bg-black focus:text-white rounded-none cursor-pointer py-3"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
