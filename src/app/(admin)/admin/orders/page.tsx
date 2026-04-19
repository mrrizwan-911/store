import { cookies } from 'next/headers'
import Link from 'next/link'

async function fetchOrders(page = 1) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refreshToken')?.value
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/orders?page=${page}`, {
    headers: {
      ...(token ? { Cookie: `refreshToken=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10)
  const data = await fetchOrders(page)
  const orders = data?.orders || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-neutral-200 text-neutral-800'
      case 'CONFIRMED': return 'bg-neutral-800 text-white'
      case 'PROCESSING': return 'bg-neutral-600 text-white'
      case 'SHIPPED': return 'bg-neutral-900 text-white'
      case 'DELIVERED': return 'bg-black text-white'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-neutral-100 text-neutral-800'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-black pb-4">
        <h1 className="text-3xl font-serif font-bold uppercase tracking-wide">Orders</h1>
      </div>

      <div className="bg-white border border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 border-b border-black">
              <tr>
                <th className="p-4 font-bold uppercase text-xs">Order #</th>
                <th className="p-4 font-bold uppercase text-xs">Date</th>
                <th className="p-4 font-bold uppercase text-xs">Customer</th>
                <th className="p-4 font-bold uppercase text-xs text-center">Items</th>
                <th className="p-4 font-bold uppercase text-xs text-right">Total</th>
                <th className="p-4 font-bold uppercase text-xs text-center">Status</th>
                <th className="p-4 font-bold uppercase text-xs text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50">
                    <td className="p-4 font-medium">{order.orderNumber}</td>
                    <td className="p-4 text-neutral-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{order.user?.name || 'Guest'}</div>
                      <div className="text-xs text-neutral-500">{order.user?.email || ''}</div>
                    </td>
                    <td className="p-4 text-center">{order.itemCount}</td>
                    <td className="p-4 text-right font-medium">PKR {Number(order.total).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-bold uppercase underline underline-offset-4 hover:text-neutral-600 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
