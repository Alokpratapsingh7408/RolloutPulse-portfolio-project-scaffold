import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { Skeleton } from '../components/Skeleton'
import { StatusPill } from '../components/StatusPill'
import type { Status } from '../components/StatusPill'
import { useGetBatchesByRolloutQuery, useGetRolloutByIdQuery } from '../store/api'

export function RolloutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: rollout } = useGetRolloutByIdQuery(id ?? '')
  const { data: batches, isLoading, isError } = useGetBatchesByRolloutQuery(id ?? '')

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        breadcrumb={
          <span className="flex items-center gap-1.5">
            <Link to="/" className="text-slate-500 hover:text-slate-700">
              Rollouts
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-slate-700">{rollout?.name ?? '…'}</span>
          </span>
        }
      />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-5">
          <Link to="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Back to Rollouts
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {rollout?.name ?? 'Batches'}
          </h1>
          {rollout?.description && <p className="mt-1 text-sm text-slate-500">{rollout.description}</p>}
        </div>

        {isLoading && <Skeleton rows={4} />}
        {isError && <EmptyState message="Couldn't load batches." />}
        {!isLoading && !isError && batches?.length === 0 && <EmptyState message="No batches in this rollout yet." />}

        <ul className="space-y-3">
          {batches
            ?.slice()
            .sort((a, b) => a.sequence_order - b.sequence_order)
            .map((batch) => (
              <li key={batch.id}>
                <Link
                  to={`/batches/${batch.id}`}
                  className="block space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{batch.name}</span>
                    <StatusPill status={batch.status as Status} />
                  </div>
                  <ProgressBar
                    value={batch.success_count + batch.failed_count}
                    max={batch.target_count}
                    label="Progress"
                  />
                  <p className="text-xs text-slate-600">
                    <span className="text-emerald-700">{batch.success_count} succeeded</span>
                    {', '}
                    <span className="text-rose-700">{batch.failed_count} failed</span>
                  </p>
                </Link>
              </li>
            ))}
        </ul>
      </main>
    </div>
  )
}
