'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface CouponInputProps {
  onApply: (discountAmount: number, code: string) => void
  subtotal: number
}

export function CouponInput({ onApply, subtotal }: CouponInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), orderValue: subtotal }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', message: data.error || 'Invalid coupon' })
      } else {
        setFeedback({ type: 'success', message: `${data.data.code} applied successfully` })
        onApply(data.data.discountAmount, data.data.code)
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Something went wrong. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8">
      <button
        type="button"
        className="text-[13px] font-bold underline underline-offset-4 decoration-[#E5E5E5] hover:decoration-black transition-colors text-black mb-4 block"
      >
        Add Promotion Code(s)
      </button>

      <div className="flex">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-10 text-[13px] border border-[#E5E5E5] border-r-0 px-3 w-full focus:outline-none focus:border-black transition-colors bg-white font-medium rounded-l-md"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="h-10 border border-black bg-black text-white px-5 uppercase text-[11px] font-bold tracking-widest hover:bg-[#262626] transition-colors rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Apply'}
        </button>
      </div>

      {feedback && (
        <p className={`text-xs mt-2 flex items-center gap-1 ${feedback.type === 'success' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {feedback.message}
        </p>
      )}
    </div>
  )
}
