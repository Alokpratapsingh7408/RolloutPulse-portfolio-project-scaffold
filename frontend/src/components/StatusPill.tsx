// Covers the status enums across all three domains that render a pill:
// rollouts.status, batches.status, and batch_devices.status (docs/BACKEND.md §1).
export type Status = 'draft' | 'pending' | 'active' | 'in_progress' | 'success' | 'completed' | 'paused' | 'failed'

export interface StatusPillProps {
  status: Status
}

const STATUS_CONFIG: Record<Status, { label: string; icon: string; classes: string }> = {
  draft: { label: 'Draft', icon: '○', classes: 'bg-slate-100 text-slate-700 ring-slate-600/10' },
  pending: { label: 'Pending', icon: '○', classes: 'bg-slate-100 text-slate-700 ring-slate-600/10' },
  paused: { label: 'Paused', icon: '⏸', classes: 'bg-slate-100 text-slate-700 ring-slate-600/10' },
  active: { label: 'Active', icon: '⟳', classes: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  in_progress: { label: 'In progress', icon: '⟳', classes: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  success: { label: 'Success', icon: '✓', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  completed: { label: 'Completed', icon: '✓', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  failed: { label: 'Failed', icon: '✕', classes: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
}

export function StatusPill({ status }: StatusPillProps) {
  const { label, icon, classes } = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}
