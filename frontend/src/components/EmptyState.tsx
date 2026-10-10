import type { ReactNode } from 'react'

export interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-dashed border-gray-300 p-8 text-center">
      <p className="text-gray-500">{message}</p>
      {action}
    </div>
  )
}
