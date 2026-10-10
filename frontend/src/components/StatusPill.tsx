// Covers the status enums across all three domains that render a pill:
// rollouts.status, batches.status, and batch_devices.status (docs/BACKEND.md §1).
export type Status = 'draft' | 'pending' | 'active' | 'in_progress' | 'success' | 'completed' | 'paused' | 'failed'

export interface StatusPillProps {
  status: Status
}

const STATUS_CONFIG: Record<Status, { label: string; icon: string; classes: string }> = {
  draft: { label: 'Draft', icon: '○', classes: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Pending', icon: '○', classes: 'bg-gray-100 text-gray-700' },
  paused: { label: 'Paused', icon: '⏸', classes: 'bg-gray-100 text-gray-700' },
  active: { label: 'Active', icon: '⟳', classes: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In progress', icon: '⟳', classes: 'bg-blue-100 text-blue-800' },
  success: { label: 'Success', icon: '✓', classes: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', icon: '✓', classes: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', icon: '✕', classes: 'bg-red-100 text-red-800' },
}

export function StatusPill({ status }: StatusPillProps) {
  const { label, icon, classes } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}
