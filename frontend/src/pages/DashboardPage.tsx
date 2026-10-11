import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { Skeleton } from '../components/Skeleton'
import { StatTile } from '../components/StatTile'
import { StatusPill } from '../components/StatusPill'
import type { Status } from '../components/StatusPill'
import { formatRelativeTime } from '../lib/time'
import {
  useGetAllBatchesQuery,
  useGetBatchesByRolloutQuery,
  useGetRecentEventsQuery,
  useGetRolloutsQuery,
} from '../store/api'
import type { RolloutEventWithDetails } from '../store/api'
import type { Database } from '../types/database'

type Rollout = Database['public']['Tables']['rollouts']['Row']

// Dashboard-level freshness is handled by polling rather than a realtime
// subscription: the aggregates below (KPIs, per-rollout progress, recent
// activity) span the whole account, not one batch, so a cheap periodic
// refetch is simpler than wiring per-row cache patches for every table
// involved - true realtime stays reserved for BatchDetailPage, where an
// exact live feed actually matters for the demo.
const POLL_MS = 4000

function RolloutListItem({ rollout }: { rollout: Rollout }) {
  const { data: batches } = useGetBatchesByRolloutQuery(rollout.id, { pollingInterval: POLL_MS })

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

function ActivityItem({ event }: { event: RolloutEventWithDetails }) {
  const serial = event.batch_devices?.devices?.serial ?? 'Unknown device'
  const batchName = event.batch_devices?.batches?.name
  const rolloutId = event.batch_devices?.batches?.rollout_id
  const batchId = event.batch_devices?.batch_id

  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{serial}</p>
        {batchName && <p className="truncate text-xs text-slate-500">{batchName}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusPill status={event.new_status as Status} />
        <span className="text-[11px] text-slate-600">{formatRelativeTime(event.changed_at)}</span>
      </div>
    </>
  )

  if (rolloutId && batchId) {
    return (
      <li>
        <Link
          to={`/batches/${batchId}`}
          className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"
        >
          {content}
        </Link>
      </li>
    )
  }
  return (
    <li className="flex items-start justify-between gap-3 px-2 py-2.5">{content}</li>
  )
}

export function DashboardPage() {
  const { data: rollouts, isLoading, isError } = useGetRolloutsQuery(undefined, { pollingInterval: 10000 })
  const { data: allBatches } = useGetAllBatchesQuery(undefined, { pollingInterval: POLL_MS })
  const { data: recentEvents, isLoading: eventsLoading } = useGetRecentEventsQuery(15, { pollingInterval: POLL_MS })

  const activeCount = rollouts?.filter((r) => r.status === 'active').length ?? 0
  const totalDevices = allBatches?.reduce((sum, b) => sum + b.target_count, 0) ?? 0
  const successSum = allBatches?.reduce((sum, b) => sum + b.success_count, 0) ?? 0
  const failedSum = allBatches?.reduce((sum, b) => sum + b.failed_count, 0) ?? 0
  const attempted = successSum + failedSum
  const successRate = attempted > 0 ? Math.round((successSum / attempted) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-slate-900">Rollouts</h1>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Rollouts" value={rollouts?.length ?? 0} hint={`${activeCount} active`} />
          <StatTile
            label="Devices tracked"
            value={totalDevices}
            hint={`${allBatches?.length ?? 0} batches`}
          />
          <StatTile
            label="Success rate"
            value={`${successRate}%`}
            tone="text-emerald-600"
            hint={`${successSum} succeeded`}
          />
          <StatTile label="Failed" value={failedSum} tone="text-rose-600" hint="of attempted devices" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isLoading && <Skeleton rows={3} />}
            {isError && <EmptyState message="Couldn't load rollouts." />}
            {!isLoading && !isError && rollouts?.length === 0 && <EmptyState message="No rollouts yet." />}

            <ul className="space-y-3">
              {rollouts?.map((rollout) => (
                <RolloutListItem key={rollout.id} rollout={rollout} />
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">Recent activity</h2>
            <p className="mb-2 text-xs text-slate-500">Live device status changes across all rollouts.</p>
            {eventsLoading && <Skeleton rows={5} />}
            {!eventsLoading && recentEvents?.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No activity yet.</p>
            )}
            <ul className="divide-y divide-slate-100">
              {recentEvents?.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
