'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { flashSaleSchema, FlashSaleInput } from '@/lib/validations/admin'
import { useRouter } from 'next/navigation'

interface FlashSaleFormProps {
  initialData?: FlashSaleInput & { id: string }
  products: { id: string; name: string; price: number }[]
}

export function FlashSaleForm({ initialData, products }: FlashSaleFormProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FlashSaleInput>({
    resolver: zodResolver(flashSaleSchema),
    defaultValues: initialData || {
      name: '',
      discountPct: 10,
      startTime: '',
      endTime: '',
      productIds: [],
    },
  })

  const onSubmit = async (data: FlashSaleInput) => {
    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/admin/flash-sales/${initialData.id}` : '/api/admin/flash-sales'
      const method = isEditing ? 'PATCH' : 'POST'

      // Ensure proper UTC strings
      const payload = {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save flash sale')
      }

      router.push('/admin/flash-sales')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {error && <div className="p-4 bg-[#EF4444] text-white text-sm">{error}</div>}

      <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
        <div>
          <label className="block text-sm text-[#000000] mb-1">Sale Name</label>
          <input {...register('name')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
          {errors.name && <p className="text-sm text-[#EF4444] mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-[#000000] mb-1">Discount Percentage (%)</label>
          <input type="number" {...register('discountPct', { valueAsNumber: true })} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
          {errors.discountPct && <p className="text-sm text-[#EF4444] mt-1">{errors.discountPct.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#000000] mb-1">Start Time (UTC)</label>
            <input type="datetime-local" {...register('startTime')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            {errors.startTime && <p className="text-sm text-[#EF4444] mt-1">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[#000000] mb-1">End Time (UTC)</label>
            <input type="datetime-local" {...register('endTime')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            {errors.endTime && <p className="text-sm text-[#EF4444] mt-1">{errors.endTime.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#000000] mb-1">Products</label>
          <select multiple {...register('productIds')} className="w-full border border-[#E5E5E5] p-2 h-48 focus:ring-1 focus:ring-black outline-none bg-white">
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} - PKR {p.price}</option>
            ))}
          </select>
          <p className="text-xs text-[#737373] mt-1">Hold Ctrl/Cmd to select multiple</p>
          {errors.productIds && <p className="text-sm text-[#EF4444] mt-1">{errors.productIds.message}</p>}
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-[#000000] text-white py-3 font-medium uppercase tracking-wide hover:bg-[#262626] transition-colors disabled:opacity-50">
        {loading ? 'Saving...' : 'Save Flash Sale'}
      </button>
    </form>
  )
}
