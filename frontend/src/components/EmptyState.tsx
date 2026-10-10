import type { ReactNode } from 'react'

export interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      {action}
    </div>
  )
}
