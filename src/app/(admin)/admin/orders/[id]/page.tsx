import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater'

async function fetchOrder(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refreshToken')?.value
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/orders/${id}`, {
    headers: {
      ...(token ? { Cookie: `refreshToken=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await fetchOrder(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center gap-4 border-b border-black pb-4">
        <Link href="/admin/orders" className="text-sm font-bold uppercase underline underline-offset-4 hover:text-neutral-600">
          &larr; Back
        </Link>
        <h1 className="text-3xl font-serif font-bold uppercase tracking-wide">
          Order #{order.orderNumber}
        </h1>
        <span className="ml-auto text-sm text-neutral-500">
          {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-bold font-serif uppercase mb-4">Items</h2>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 border-b border-neutral-200 pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-20 bg-neutral-100 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-bold">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-medium text-right">
                    PKR {Number(item.price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-black p-6">
              <h2 className="text-sm font-bold uppercase mb-3 text-neutral-500">Shipping Details</h2>
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p className="text-sm text-neutral-600 mt-1">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p className="text-sm text-neutral-600">{order.shippingAddress.addressLine2}</p>}
              <p className="text-sm text-neutral-600">{order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}</p>
              <p className="text-sm text-neutral-600 mt-2">Phone: {order.shippingAddress?.phone}</p>
            </div>

            <div className="bg-white border border-black p-6">
              <h2 className="text-sm font-bold uppercase mb-3 text-neutral-500">Payment</h2>
              <p className="text-sm">Method: <span className="font-bold uppercase">{order.payment?.method || 'N/A'}</span></p>
              <p className="text-sm mt-1">Status: <span className="font-bold uppercase">{order.payment?.status || 'N/A'}</span></p>

              <div className="mt-4 pt-4 border-t border-black space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>PKR {Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Shipping</span>
                  <span>PKR {Number(order.shippingCost).toLocaleString()}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Discount</span>
                    <span className="text-red-600">-PKR {Number(order.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2">
                  <span>Total</span>
                  <span>PKR {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.status}
            trackingNumber={order.trackingNumber}
            notes={order.notes}
          />

          <div className="bg-white border border-black p-6">
            <h2 className="text-sm font-bold uppercase mb-3 text-neutral-500">Customer Info</h2>
            <p className="font-bold">{order.user?.name || 'Guest'}</p>
            <p className="text-sm text-neutral-600 mt-1">{order.user?.email}</p>
            {order.user?.phone && <p className="text-sm text-neutral-600 mt-1">{order.user.phone}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
