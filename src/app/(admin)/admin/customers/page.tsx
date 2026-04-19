import { cookies } from 'next/headers'
import Link from 'next/link'

async function fetchCustomers(page = 1) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refreshToken')?.value
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/customers?page=${page}`, {
    headers: {
      ...(token ? { Cookie: `refreshToken=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10)
  const data = await fetchCustomers(page)
  const customers = data?.customers || []

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-black pb-4">
        <h1 className="text-3xl font-serif font-bold uppercase tracking-wide">Customers</h1>
      </div>

      <div className="bg-white border border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 border-b border-black">
              <tr>
                <th className="p-4 font-bold uppercase text-xs">Name</th>
                <th className="p-4 font-bold uppercase text-xs">Email</th>
                <th className="p-4 font-bold uppercase text-xs text-center">Orders</th>
                <th className="p-4 font-bold uppercase text-xs text-right">LTV (Total Spent)</th>
                <th className="p-4 font-bold uppercase text-xs text-center">Tier</th>
                <th className="p-4 font-bold uppercase text-xs text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50">
                    <td className="p-4 font-medium">{customer.name}</td>
                    <td className="p-4 text-neutral-600">{customer.email}</td>
                    <td className="p-4 text-center">{customer.orderCount}</td>
                    <td className="p-4 text-right font-medium">PKR {customer.ltv.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider">
                        {customer.tier}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/customers/${customer.id}`}
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
