import { db } from '@/lib/db/client'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminFlashSalesPage() {
  const sales = await db.flashSale.findMany({
    orderBy: { startTime: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-playfair text-3xl font-bold text-[#000000]">Flash Sales</h1>
        <Link
          href="/admin/flash-sales/new"
          className="flex items-center gap-2 bg-[#000000] text-white px-4 py-2 hover:bg-[#262626] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Sale
        </Link>
      </div>

      <div className="bg-[#FAFAFA] border border-[#E5E5E5] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-white">
              <th className="p-4 text-sm font-medium text-[#737373]">Name</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Discount</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Start Time</th>
              <th className="p-4 text-sm font-medium text-[#737373]">End Time</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Products</th>
              <th className="p-4 text-sm font-medium text-[#737373]">Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className={`border-b border-[#E5E5E5] bg-white ${sale.isActive ? 'border-l-4 border-l-[#E8D5B0]' : ''}`}>
                <td className="p-4 font-medium text-[#000000]">{sale.name}</td>
                <td className="p-4 text-[#737373]">{sale.discountPct}%</td>
                <td className="p-4 text-[#737373] text-sm">{new Date(sale.startTime).toLocaleString()}</td>
                <td className="p-4 text-[#737373] text-sm">{new Date(sale.endTime).toLocaleString()}</td>
                <td className="p-4 text-[#737373]">{sale.productIds.length} items</td>
                <td className="p-4">
                  {sale.isActive ? (
                    <span className="bg-[#10B981]/10 text-[#10B981] px-2 py-1 text-xs rounded-full">Active</span>
                  ) : new Date(sale.endTime) < new Date() ? (
                    <span className="bg-[#EF4444]/10 text-[#EF4444] px-2 py-1 text-xs rounded-full">Expired</span>
                  ) : (
                    <span className="bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-1 text-xs rounded-full">Upcoming</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && (
          <div className="p-8 text-center text-[#737373]">No flash sales found.</div>
        )}
      </div>
    </div>
  )
}
