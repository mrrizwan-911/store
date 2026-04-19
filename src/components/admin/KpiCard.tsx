export interface KpiCardProps {
  label: string
  value: string | number
  trend?: { pct: number; label: string }
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  const trendPositive = (trend?.pct ?? 0) >= 0

  return (
    <div className="bg-white border border-black p-6 rounded-none flex flex-col justify-between h-32">
      <p className="text-sm text-neutral-500 mb-1 font-sans">{label}</p>
      <p className="text-2xl font-bold text-black font-serif">{value}</p>
      {trend && (
        <p className={`text-xs mt-2 font-sans ${trendPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trendPositive ? '▲' : '▼'} {Math.abs(trend.pct)}% {trend.label}
        </p>
      )}
    </div>
  )
}
