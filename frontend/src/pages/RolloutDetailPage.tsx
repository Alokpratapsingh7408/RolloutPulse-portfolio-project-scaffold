import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { Skeleton } from '../components/Skeleton'
import { StatusPill } from '../components/StatusPill'
import type { Status } from '../components/StatusPill'
import { useGetBatchesByRolloutQuery } from '../store/api'

export function RolloutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: batches, isLoading, isError } = useGetBatchesByRolloutQuery(id ?? '')

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Batches</h1>

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
                className="block space-y-2 rounded border border-gray-200 p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{batch.name}</span>
                  <StatusPill status={batch.status as Status} />
                </div>
                <ProgressBar
                  value={batch.success_count + batch.failed_count}
                  max={batch.target_count}
                  label="Progress"
                />
                <p className="text-xs text-gray-500">
                  {batch.success_count} succeeded, {batch.failed_count} failed
                </p>
              </Link>
            </li>
          ))}
      </ul>
    </main>
  )
}
