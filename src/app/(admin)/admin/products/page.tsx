import { db } from '@/lib/db/client'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      variants: true,
    },
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-playfair text-3xl font-bold text-[#000000]">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[#000000] text-white px-4 py-2 hover:bg-[#262626] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-[#FAFAFA] border border-[#E5E5E5] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-white">
              <th className="p-4 text-sm font-medium text-[#737373]">Name</th>
              <th className="p-4 text-sm font-medium text-[#737373]">SKU</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Category</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Price</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Stock Total</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Status</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0)
              return (
                <tr key={product.id} className="border-b border-[#E5E5E5] hover:border-l-2 hover:border-l-[#E8D5B0] transition-all bg-white">
                  <td className="p-4 font-medium text-[#000000]">{product.name}</td>
                  <td className="p-4 text-[#737373] text-sm">{product.sku}</td>
                  <td className="p-4 text-[#737373] text-sm">{product.category.name}</td>
                  <td className="p-4 text-[#737373] text-sm">PKR {Number(product.basePrice).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-sm ${totalStock === 0 ? 'text-[#EF4444]' : totalStock < 5 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                      {totalStock}
                    </span>
                  </td>
                  <td className="p-4">
                    {product.isActive ? (
                      <span className="bg-[#10B981]/10 text-[#10B981] px-2 py-1 text-xs rounded-full">Active</span>
                    ) : (
                      <span className="bg-[#737373]/10 text-[#737373] px-2 py-1 text-xs rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-[#A3A3A3] hover:text-[#000000]">
                      <Edit className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-8 text-center text-[#737373]">No products found.</div>
        )}
      </div>
    </div>
  )
}
