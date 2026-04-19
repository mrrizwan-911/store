import { cookies } from 'next/headers'
import { KpiCard } from '@/components/admin/KpiCard'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { OrderStatusChart } from '@/components/admin/OrderStatusChart'
import { PaymentMethodChart } from '@/components/admin/PaymentMethodChart'

async function fetchAnalyticsData(endpoint: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refreshToken')?.value

  // Use a relative or absolute URL based on environment. In server components, absolute is required.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/analytics/${endpoint}`, {
    headers: {
      ...(token ? { Cookie: `refreshToken=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) {
    return null
  }

  const json = await res.json()
  return json.data
}

export default async function AnalyticsPage() {
  const [revenueData, statusData, topProductsData] = await Promise.all([
    fetchAnalyticsData('revenue'),
    fetchAnalyticsData('orders-by-status'),
    fetchAnalyticsData('top-products')
  ])

  // Process data for charts
  // The daily revenue chart needs last 30 days data. The API returned aggregate.
  // Wait, the API for `revenue` didn't return a 30-day time series, it just returned today/month/ytd/activeOrders.
  // Let's create an empty time series for the RevenueChart as it wasn't specified in the API yet.
  const emptyRevenueSeries: { date: string; revenue: number }[] = []

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-black pb-4">
        <h1 className="text-3xl font-serif font-bold uppercase tracking-wide">Analytics Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Today's Revenue"
          value={`PKR ${revenueData?.today?.revenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="This Month"
          value={`PKR ${revenueData?.thisMonth?.revenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="YTD Revenue"
          value={`PKR ${revenueData?.ytd?.revenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="Active Orders"
          value={revenueData?.activeOrders || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase mb-4 text-neutral-500">Revenue (30 Days)</h2>
          <RevenueChart data={emptyRevenueSeries} />
        </div>
        <div>
          <OrderStatusChart data={statusData || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <PaymentMethodChart data={revenueData?.byPaymentMethod || []} />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase mb-4 text-center">Top Selling Products</h3>
          <div className="w-full h-80 overflow-y-auto border border-black bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 border-b border-black">
                <tr>
                  <th className="p-3 font-bold uppercase text-xs">Product</th>
                  <th className="p-3 font-bold uppercase text-xs text-center">Sold</th>
                  <th className="p-3 font-bold uppercase text-xs text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(!topProductsData || topProductsData.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-neutral-500">No product data available.</td>
                  </tr>
                ) : (
                  topProductsData.map((prod: any, idx: number) => (
                    <tr key={idx} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50">
                      <td className="p-3">
                        <div className="font-bold">{prod.name}</div>
                        <div className="text-xs text-neutral-500">{prod.category}</div>
                      </td>
                      <td className="p-3 text-center">{prod.unitsSold}</td>
                      <td className="p-3 text-right">PKR {prod.revenue?.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
