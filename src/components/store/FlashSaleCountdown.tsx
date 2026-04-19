'use client'

import React, { useEffect, useState } from 'react'
import { useFlashSaleTimer } from '@/hooks/useFlashSaleTimer'

interface FlashSaleCountdownProps {
  saleEndTimeUTC: string
  saleName: string
  discountPct: number
}

export function FlashSaleCountdown({ saleEndTimeUTC, saleName, discountPct }: FlashSaleCountdownProps) {
  const { hours, minutes, seconds, isExpired } = useFlashSaleTimer(saleEndTimeUTC)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-24 w-full bg-[#FAFAFA] animate-pulse border border-[#E5E5E5]"></div>
  }

  if (isExpired) {
    return (
      <div className="bg-[#0A0A0A] p-4 text-center">
        <h3 className="font-playfair text-[#F5F5F5] text-lg font-bold uppercase tracking-wider">
          ⚡ {saleName} — Ended
        </h3>
        <p className="text-[#A3A3A3] text-sm mt-1">This flash sale has expired.</p>
      </div>
    )
  }

  const pad = (num: number) => num.toString().padStart(2, '0')

  return (
    <div className="bg-[#0A0A0A] p-6 text-center shadow-sm">
      <h3 className="font-playfair text-[#F5F5F5] text-xl font-bold uppercase tracking-wider mb-4">
        ⚡ {saleName} — {discountPct}% OFF
      </h3>
      <div className="flex items-center justify-center space-x-4">
        <div className="flex flex-col items-center">
          <span className="font-mono text-[#E8D5B0] text-3xl font-bold">{pad(hours)}</span>
          <span className="text-[#A3A3A3] text-xs uppercase mt-1">HH</span>
        </div>
        <span className="font-mono text-[#E8D5B0] text-2xl font-bold self-start mt-1">:</span>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[#E8D5B0] text-3xl font-bold">{pad(minutes)}</span>
          <span className="text-[#A3A3A3] text-xs uppercase mt-1">MM</span>
        </div>
        <span className="font-mono text-[#E8D5B0] text-2xl font-bold self-start mt-1">:</span>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[#E8D5B0] text-3xl font-bold">{pad(seconds)}</span>
          <span className="text-[#A3A3A3] text-xs uppercase mt-1">SS</span>
        </div>
      </div>
    </div>
  )
}
