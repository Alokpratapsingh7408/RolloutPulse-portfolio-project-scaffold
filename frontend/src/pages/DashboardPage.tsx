import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { Skeleton } from '../components/Skeleton'
import { StatusPill } from '../components/StatusPill'
import type { Status } from '../components/StatusPill'
import { supabase } from '../lib/supabase'
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
        className="block space-y-2 rounded border border-gray-200 p-3 hover:bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{rollout.name}</span>
          <StatusPill status={rollout.status as Status} />
        </div>
        <ProgressBar value={done} max={target} label="Overall progress" />
      </Link>
    </li>
  )
}

export function DashboardPage() {
  const { data: rollouts, isLoading, isError } = useGetRolloutsQuery()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Rollouts</h1>
        <Button variant="secondary" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      {isLoading && <Skeleton rows={3} />}
      {isError && <EmptyState message="Couldn't load rollouts." />}
      {!isLoading && !isError && rollouts?.length === 0 && <EmptyState message="No rollouts yet." />}

      <ul className="space-y-3">
        {rollouts?.map((rollout) => (
          <RolloutListItem key={rollout.id} rollout={rollout} />
        ))}
      </ul>
    </main>
  )
}
