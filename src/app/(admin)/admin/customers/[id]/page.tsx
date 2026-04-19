import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function fetchCustomer(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refreshToken')?.value
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/customers/${id}`, {
    headers: {
      ...(token ? { Cookie: `refreshToken=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await fetchCustomer(id)

  if (!customer) {
    notFound()
  }

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
      <div className="flex items-center gap-4 border-b border-black pb-4">
        <Link href="/admin/customers" className="text-sm font-bold uppercase underline underline-offset-4 hover:text-neutral-600">
          &larr; Back
        </Link>
        <h1 className="text-3xl font-serif font-bold uppercase tracking-wide">
          Customer Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-black p-6">
            <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-bold mb-4">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold font-serif">{customer.name}</h2>
            <p className="text-neutral-600">{customer.email}</p>
            {customer.phone && <p className="text-neutral-600 mt-1">{customer.phone}</p>}

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-neutral-500 uppercase font-bold">Lifetime Value</span>
                <span className="font-bold">PKR {customer.ltv?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-neutral-500 uppercase font-bold">Total Orders</span>
                <span className="font-bold">{customer.orders?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 uppercase font-bold">Member Since</span>
                <span className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black p-6">
            <h3 className="text-sm font-bold uppercase text-neutral-500 mb-4">Loyalty Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">Tier</p>
                <p className="font-bold uppercase">{customer.loyalty?.tier || 'Bronze'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Points Balance</p>
                <p className="font-bold">{customer.loyalty?.points || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-black">
            <div className="p-6 border-b border-black">
              <h2 className="text-lg font-bold font-serif uppercase">Order History</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 border-b border-black">
                  <tr>
                    <th className="p-4 font-bold uppercase text-xs">Order #</th>
                    <th className="p-4 font-bold uppercase text-xs">Date</th>
                    <th className="p-4 font-bold uppercase text-xs text-center">Items</th>
                    <th className="p-4 font-bold uppercase text-xs text-right">Total</th>
                    <th className="p-4 font-bold uppercase text-xs text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!customer.orders || customer.orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-500">
                        No orders placed yet.
                      </td>
                    </tr>
                  ) : (
                    customer.orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50">
                        <td className="p-4 font-medium">
                          <Link href={`/admin/orders/${order.id}`} className="underline underline-offset-4 hover:text-neutral-600">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="p-4 text-neutral-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-center">{order.itemsCount || order._count?.items || 0}</td>
                        <td className="p-4 text-right font-medium">PKR {Number(order.total).toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
