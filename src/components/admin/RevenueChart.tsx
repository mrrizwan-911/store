'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: { date: string; revenue: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 border border-black flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans text-sm">
        No revenue data available for this period.
      </div>
    )
  }

  return (
    <div className="w-full h-80 border border-black p-4 bg-white font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 12 }}
            tickFormatter={(value) => `PKR ${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #000',
              borderRadius: '0px',
              fontFamily: 'inherit',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#000' }}
            formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, 'Revenue']}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#000000"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#000' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
