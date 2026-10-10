import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { Skeleton } from '../components/Skeleton'
import { StatusPill } from '../components/StatusPill'
import type { Status } from '../components/StatusPill'
import { useGetBatchesByRolloutQuery, useGetRolloutsQuery } from '../store/api'
import type { Database } from '../types/database'

type Rollout = Database['public']['Tables']['rollouts']['Row']

function RolloutListItem({ rollout }: { rollout: Rollout }) {
  const { data: batches } = useGetBatchesByRolloutQuery(rollout.id)

  const target = batches?.reduce((sum, b) => sum + b.target_count, 0) ?? 0
  const done = batches?.reduce((sum, b) => sum + b.success_count + b.failed_count, 0) ?? 0

  return (
    <li>
      <Link
        to={`/rollouts/${rollout.id}`}
        className="block space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-slate-900">{rollout.name}</h2>
            {rollout.description && (
              <p className="mt-0.5 truncate text-sm text-slate-500">{rollout.description}</p>
            )}
          </div>
          <StatusPill status={rollout.status as Status} />
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span>{batches?.length ?? 0} batches</span>
          <span aria-hidden="true">·</span>
          <span>{target} devices</span>
        </div>
        <ProgressBar value={done} max={target} label="Overall progress" />
      </Link>
    </li>
  )
}

export function DashboardPage() {
  const { data: rollouts, isLoading, isError } = useGetRolloutsQuery()

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-slate-900">Rollouts</h1>

        {isLoading && <Skeleton rows={3} />}
        {isError && <EmptyState message="Couldn't load rollouts." />}
        {!isLoading && !isError && rollouts?.length === 0 && <EmptyState message="No rollouts yet." />}

        <ul className="space-y-3">
          {rollouts?.map((rollout) => (
            <RolloutListItem key={rollout.id} rollout={rollout} />
          ))}
        </ul>
      </main>
    </div>
  )
}
