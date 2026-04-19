'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SimpleImageUploader } from './SimpleImageUploader'
import { GripVertical, X, CheckCircle2 } from 'lucide-react'

export function OutfitBuilder({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [season, setSeason] = useState(initialData?.season || 'All Season')
  const [occasion, setOccasion] = useState(initialData?.occasion || 'Casual')
  const [gender, setGender] = useState(initialData?.gender || 'Unisex')
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Transform initialData.items to array of products
  const initialProducts = initialData?.items?.map((item: any) => item.product) || []
  const [selectedProducts, setSelectedProducts] = useState<any[]>(initialProducts)

  // Search products
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([])
      return
    }
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=8`)
        const data = await res.json()
        if (data.success) {
          setSearchResults(data.data.products)
        }
      } catch (err) {
        console.error('Failed to search products', err)
      }
    }
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSelectProduct = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      // Remove if already selected
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id))
      return
    }
    if (selectedProducts.length >= 5) {
      alert('You can only select up to 5 products.')
      return
    }
    setSelectedProducts(prev => [...prev, product])
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newProducts = [...selectedProducts]
    const temp = newProducts[index - 1]
    newProducts[index - 1] = newProducts[index]
    newProducts[index] = temp
    setSelectedProducts(newProducts)
  }

  const moveDown = (index: number) => {
    if (index === selectedProducts.length - 1) return
    const newProducts = [...selectedProducts]
    const temp = newProducts[index + 1]
    newProducts[index + 1] = newProducts[index]
    newProducts[index] = temp
    setSelectedProducts(newProducts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (selectedProducts.length < 2) {
      setError('You must select at least 2 products.')
      setLoading(false)
      return
    }

    try {
      const payload = {
        title,
        description,
        imageUrl,
        season,
        occasion,
        gender,
        isPublished,
        productIds: selectedProducts.map(p => p.id)
      }

      const url = initialData ? `/api/admin/outfits/${initialData.id}` : '/api/admin/outfits'
      const method = initialData ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save outfit')
      }

      router.push('/admin/outfits')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Details */}
      <div className="space-y-6 bg-white border border-[#E5E5E5] p-6">
        <h2 className="text-xl font-playfair font-bold border-b border-[#E5E5E5] pb-4">Outfit Details</h2>

        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-[#E5E5E5] p-2 focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border border-[#E5E5E5] p-2 focus:outline-none focus:border-black min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Season</label>
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              className="w-full border border-[#E5E5E5] p-2 focus:outline-none focus:border-black bg-white"
            >
              <option>All Season</option>
              <option>Summer</option>
              <option>Winter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Occasion</label>
            <select
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              className="w-full border border-[#E5E5E5] p-2 focus:outline-none focus:border-black bg-white"
            >
              <option>Casual</option>
              <option>Formal</option>
              <option>Festive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full border border-[#E5E5E5] p-2 focus:outline-none focus:border-black bg-white"
            >
              <option>Men</option>
              <option>Women</option>
              <option>Unisex</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Hero Image</label>
          <SimpleImageUploader imageUrl={imageUrl} onUploadSuccess={setImageUrl} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isPublished" className="text-sm">Publish this outfit</label>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 mt-4 hover:bg-[#262626] transition-colors"
        >
          {loading ? 'Saving...' : 'Save Outfit'}
        </button>
      </div>

      {/* Right Column: Product Selection */}
      <div className="space-y-6 bg-white border border-[#E5E5E5] p-6">
        <h2 className="text-xl font-playfair font-bold border-b border-[#E5E5E5] pb-4">Select Products (2-5)</h2>

        <div>
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#E5E5E5] p-2 focus:outline-none focus:border-black mb-4"
          />

          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-6 max-h-[300px] overflow-y-auto">
              {searchResults.map(product => {
                const isSelected = selectedProducts.find(p => p.id === product.id)
                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`border p-2 flex items-center gap-2 cursor-pointer transition-colors ${
                      isSelected ? 'border-green-500 bg-green-50' : 'border-[#E5E5E5] hover:border-black'
                    }`}
                  >
                    <div className="relative w-10 h-10 bg-gray-100 flex-shrink-0">
                      {product.images?.[0]?.url && (
                        <Image src={product.images[0].url} alt="" fill className="object-cover" />
                      )}
                    </div>
                    <div className="text-sm truncate flex-1">{product.name}</div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold mb-4">Selected Products ({selectedProducts.length}/5)</h3>
          <div className="space-y-2">
            {selectedProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 border border-[#E5E5E5] p-3 bg-[#FAFAFA]">
                <div className="flex flex-col gap-1 cursor-pointer text-gray-400">
                  <GripVertical className="w-4 h-4 hover:text-black" onClick={() => moveUp(index)} />
                  <GripVertical className="w-4 h-4 hover:text-black" onClick={() => moveDown(index)} />
                </div>
                <div className="relative w-12 h-12 bg-gray-100 flex-shrink-0">
                  {product.images?.[0]?.url ? (
                    <Image src={product.images[0].url} alt="" fill className="object-cover" />
                  ) : product.imageUrl ? (
                    <Image src={product.imageUrl} alt="" fill className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm truncate">{product.name}</div>
                  <div className="text-xs text-gray-500">PKR {product.basePrice}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedProducts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No products selected.</p>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
