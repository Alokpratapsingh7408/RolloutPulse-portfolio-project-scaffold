export interface StatTileProps {
  label: string
  value: string | number
  tone?: string
  hint?: string
}

export function StatTile({ label, value, tone = 'text-slate-900', hint }: StatTileProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
