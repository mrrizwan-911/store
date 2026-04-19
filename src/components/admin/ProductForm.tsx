'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, ProductInput } from '@/lib/validations/admin'
import { useRouter } from 'next/navigation'
import { ImageUploader } from './ImageUploader'

interface ProductFormProps {
  initialData?: ProductInput & { id: string; images?: any[] }
  categories: { id: string; name: string }[]
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<any[]>(initialData?.images || [])

  const { register, control, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData || {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      categoryId: '',
      basePrice: 0,
      salePrice: null,
      sku: '',
      isActive: true,
      isFeatured: false,
      tags: [],
      variants: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/admin/products/${initialData.id}` : '/api/admin/products'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save product')
      }

      if (!isEditing) {
        router.push(`/admin/products/${result.data.id}/edit`)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-8">
        {error && <div className="p-4 bg-[#EF4444] text-white text-sm">{error}</div>}

        {/* Basic Info */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Basic Info</h2>
          <div>
            <label className="block text-sm text-[#000000] mb-1">Name</label>
            <input {...register('name')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            {errors.name?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.name.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm text-[#000000] mb-1">Slug (auto-generated if empty)</label>
            <input {...register('slug')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
          </div>
          <div>
            <label className="block text-sm text-[#000000] mb-1">Short Description</label>
            <input {...register('shortDescription')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
          </div>
          <div>
            <label className="block text-sm text-[#000000] mb-1">Full Description</label>
            <textarea {...register('description')} rows={4} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            {errors.description?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.description.message as string}</p>}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Pricing & SKU</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#000000] mb-1">Base Price</label>
              <input type="number" {...register('basePrice', { valueAsNumber: true })} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
              {errors.basePrice?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.basePrice.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm text-[#000000] mb-1">Sale Price</label>
              <input type="number" {...register('salePrice', { setValueAs: v => v === "" || isNaN(parseFloat(v)) ? null : parseFloat(v) })} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[#000000] mb-1">SKU</label>
              <input {...register('sku')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
              {errors.sku?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.sku.message as string}</p>}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Category</h2>
          <select {...register('categoryId')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none bg-white">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.categoryId?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.categoryId.message as string}</p>}
        </div>

        {/* Variants */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-playfair text-xl text-[#000000]">Variants</h2>
            <button type="button" onClick={() => append({ sku: '', stock: 0 })} className="text-sm px-4 py-2 bg-black text-white rounded-none">
              + Add Variant
            </button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-6 gap-2 items-end border-b border-[#E5E5E5] pb-4">
              <div>
                <label className="block text-xs text-[#737373] mb-1">Size</label>
                <input {...register(`variants.${index}.size`)} className="w-full border border-[#E5E5E5] p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#737373] mb-1">Color</label>
                <input {...register(`variants.${index}.color`)} className="w-full border border-[#E5E5E5] p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#737373] mb-1">Stock</label>
                <input type="number" {...register(`variants.${index}.stock`, { valueAsNumber: true })} className="w-full border border-[#E5E5E5] p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#737373] mb-1">Price Override</label>
                <input type="number" {...register(`variants.${index}.price`, { setValueAs: v => v === "" || isNaN(parseFloat(v)) ? null : parseFloat(v) })} className="w-full border border-[#E5E5E5] p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#737373] mb-1">SKU</label>
                <input {...register(`variants.${index}.sku`)} className="w-full border border-[#E5E5E5] p-2 text-sm" />
              </div>
              <button type="button" onClick={() => remove(index)} className="px-2 py-2 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors">
                Remove
              </button>
            </div>
          ))}
          {errors.variants?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.variants.message as string}</p>}
        </div>

        {/* Status */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 flex gap-8">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="accent-black w-4 h-4" />
            <span className="text-[#000000]">Active</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" {...register('isFeatured')} className="accent-black w-4 h-4" />
            <span className="text-[#000000]">Featured</span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#000000] text-white py-3 font-medium uppercase tracking-wide hover:bg-[#262626] transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </form>

      {/* Images Sidebar */}
      <div className="w-full lg:w-96 space-y-4">
        {isEditing ? (
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
            <h2 className="font-playfair text-xl text-[#000000]">Images</h2>
            <ImageUploader
              productId={initialData.id}
              images={images}
              onUploadSuccess={(img) => setImages([...images, img])}
            />
          </div>
        ) : (
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 text-center text-[#737373] text-sm">
            Save the product first to upload images.
          </div>
        )}
      </div>
    </div>
  )
}
