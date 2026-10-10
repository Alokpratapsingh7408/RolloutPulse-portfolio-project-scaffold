export interface SkeletonProps {
  rows: number
}

export function Skeleton({ rows }: SkeletonProps) {
  return (
    <div aria-hidden="true" className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  )
}
