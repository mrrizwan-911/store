'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface OrderStatusChartProps {
  data: { status: string; count: number }[]
}

const COLORS: Record<string, string> = {
  PENDING: '#A3A3A3',
  CONFIRMED: '#737373',
  PROCESSING: '#404040',
  SHIPPED: '#262626',
  DELIVERED: '#000000',
  CANCELLED: '#EF4444',
  REFUNDED: '#F59E0B'
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 border border-black flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans text-sm">
        No orders available.
      </div>
    )
  }

  return (
    <div className="w-full h-80 border border-black p-4 bg-white font-sans">
      <h3 className="text-sm font-bold uppercase mb-4 text-center">Orders by Status</h3>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="count"
            nameKey="status"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#000000'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #000',
              borderRadius: '0px',
              fontFamily: 'inherit',
              fontSize: '12px'
            }}
          />
          <Legend iconType="square" wrapperStyle={{ fontSize: '12px', color: '#000' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
