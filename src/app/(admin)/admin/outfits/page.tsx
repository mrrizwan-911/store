'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminOutfitsPage() {
  const [outfits, setOutfits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOutfits()
  }, [])

  const fetchOutfits = async () => {
    try {
      const res = await fetch('/api/admin/outfits')
      const json = await res.json()
      if (json.success) {
        setOutfits(json.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outfit?')) return
    try {
      const res = await fetch(`/api/admin/outfits/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setOutfits(outfits.filter(o => o.id !== id))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-playfair font-bold">Outfits / Lookbook</h1>
        <Link
          href="/admin/outfits/new"
          className="bg-[#000000] text-white px-4 py-2 rounded-none hover:bg-[#262626] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Look
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {outfits.map(outfit => (
            <div key={outfit.id} className="bg-white border border-[#E5E5E5] flex flex-col">
              <div className="relative aspect-[4/5] bg-[#FAFAFA]">
                {outfit.imageUrl ? (
                  <Image
                    src={outfit.imageUrl}
                    alt={outfit.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#A3A3A3]">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {outfit.isPublished ? (
                    <span className="bg-[#10B981] text-white text-xs px-2 py-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="bg-[#A3A3A3] text-white text-xs px-2 py-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Draft
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-playfair text-lg font-bold truncate">{outfit.title}</h3>
                <p className="text-sm text-[#737373] mt-1">{outfit.items.length} items</p>
                <div className="mt-4 flex gap-2 pt-4 border-t border-[#E5E5E5] mt-auto">
                  <Link
                    href={`/admin/outfits/${outfit.id}/edit`}
                    className="flex-1 text-center border border-[#E5E5E5] py-1 text-sm hover:bg-[#FAFAFA] transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(outfit.id)}
                    className="px-3 border border-[#E5E5E5] text-[#EF4444] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {outfits.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#737373]">
              No outfits created yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
