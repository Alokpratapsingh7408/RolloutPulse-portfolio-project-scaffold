export interface SkeletonProps {
  rows: number
}

export function Skeleton({ rows }: SkeletonProps) {
  return (
    <div aria-hidden="true" className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200/70" />
      ))}
    </div>
  )
}
