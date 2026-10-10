export interface ProgressBarProps {
  value: number
  max: number
  label: string
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span className="tabular-nums text-slate-700">
          {value} / {max} <span className="text-slate-500">({percent}%)</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-400 to-brand-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
