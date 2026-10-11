import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useRealtimeBatchDevices } from '../hooks/useRealtimeBatchDevices'
import { AppHeader } from '../components/AppHeader'
import { DataTable } from '../components/DataTable'
import type { DataTableColumn } from '../components/DataTable'
import { FilterBar } from '../components/FilterBar'
import type { FilterBarValue } from '../components/FilterBar'
import { Modal } from '../components/Modal'
import { StatTile } from '../components/StatTile'
import { StatusPill } from '../components/StatusPill'
import type { Status } from '../components/StatusPill'
import { useGetBatchByIdQuery, useGetBatchDevicesQuery, useGetRolloutByIdQuery } from '../store/api'
import type { BatchDeviceWithDevice } from '../store/api'

type SortKey = 'serial' | 'model' | 'region' | 'status' | 'updated_at'

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: batch } = useGetBatchByIdQuery(id ?? '')
  const { data: rollout } = useGetRolloutByIdQuery(batch?.rollout_id ?? '', { skip: !batch })
  const { data: batchDevices, isLoading, isError } = useGetBatchDevicesQuery(id ?? '')

  // Count realtime updates and flush a single aria-live announcement at most
  // once a second, rather than announcing every individual status change -
  // with hundreds of devices updating in quick succession, reading each one
  // out would bury a screen-reader user in noise.
  const [announcement, setAnnouncement] = useState('')
  const pendingCountRef = useRef(0)
  useRealtimeBatchDevices(id ?? '', () => {
    pendingCountRef.current += 1
  })
  useEffect(() => {
    const interval = setInterval(() => {
      const count = pendingCountRef.current
      if (count > 0) {
        pendingCountRef.current = 0
        setAnnouncement(`${count} device${count === 1 ? '' : 's'} updated`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const [filter, setFilter] = useState<FilterBarValue>({ statusFilter: 'all', searchValue: '' })
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'serial',
    direction: 'asc',
  })
  const [selectedDevice, setSelectedDevice] = useState<BatchDeviceWithDevice | null>(null)

  const rows = useMemo(() => {
    if (!batchDevices) return []

    const search = filter.searchValue.trim().toLowerCase()
    const filtered = batchDevices.filter((row) => {
      if (filter.statusFilter !== 'all' && row.status !== filter.statusFilter) return false
      if (!search) return true
      const haystack = `${row.devices?.serial ?? ''} ${row.devices?.model ?? ''} ${row.devices?.region ?? ''}`.toLowerCase()
      return haystack.includes(search)
    })

    const sorted = [...filtered].sort((a, b) => {
      const getValue = (row: BatchDeviceWithDevice) =>
        sort.key === 'status' || sort.key === 'updated_at' ? row[sort.key] : (row.devices?.[sort.key] ?? '')
      const aVal = getValue(a)
      const bVal = getValue(b)
      const cmp = String(aVal).localeCompare(String(bVal))
      return sort.direction === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [batchDevices, filter, sort])

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSort({ key: key as SortKey, direction })
  }

  const columns: DataTableColumn<BatchDeviceWithDevice>[] = [
    { key: 'serial', header: 'Serial', sortable: true, render: (row) => row.devices?.serial ?? '—' },
    { key: 'model', header: 'Model', sortable: true, render: (row) => row.devices?.model ?? '—' },
    { key: 'region', header: 'Region', sortable: true, render: (row) => row.devices?.region ?? '—' },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusPill status={row.status as Status} /> },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      render: (row) => new Date(row.updated_at).toLocaleString(),
    },
  ]

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, in_progress: 0, success: 0, failed: 0 }
    for (const row of batchDevices ?? []) {
      if (row.status in counts) counts[row.status as keyof typeof counts]++
    }
    return counts
  }, [batchDevices])

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        breadcrumb={
          <span className="flex items-center gap-1.5">
            <Link to="/" className="text-slate-500 hover:text-slate-700">
              Rollouts
            </Link>
            <span aria-hidden="true">/</span>
            {rollout && (
              <>
                <Link to={`/rollouts/${rollout.id}`} className="text-slate-500 hover:text-slate-700">
                  {rollout.name}
                </Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span className="truncate text-slate-700">{batch?.name ?? '…'}</span>
          </span>
        }
      />
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-5">
          {rollout && (
            <Link to={`/rollouts/${rollout.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
              ← Back to {rollout.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{batch?.name ?? 'Devices'}</h1>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Pending" value={statusCounts.pending} tone="text-slate-600" />
          <StatTile label="In progress" value={statusCounts.in_progress} tone="text-indigo-600" />
          <StatTile label="Success" value={statusCounts.success} tone="text-emerald-600" />
          <StatTile label="Failed" value={statusCounts.failed} tone="text-rose-600" />
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <div className="mb-4">
          <FilterBar
            statusFilter={filter.statusFilter}
            searchValue={filter.searchValue}
            onChange={setFilter}
          />
        </div>

        {isError ? (
          <p className="text-status-failed">Couldn't load devices.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onSort={handleSort}
            onRowClick={setSelectedDevice}
            isLoading={isLoading}
          />
        )}

        <Modal
          isOpen={selectedDevice !== null}
          onClose={() => setSelectedDevice(null)}
          title={selectedDevice?.devices?.serial ?? 'Device'}
        >
          {selectedDevice && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Model</dt>
                <dd className="text-slate-800">{selectedDevice.devices?.model ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Region</dt>
                <dd className="text-slate-800">{selectedDevice.devices?.region ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <StatusPill status={selectedDevice.status as Status} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Updated</dt>
                <dd className="text-slate-800">{new Date(selectedDevice.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          )}
        </Modal>
      </main>
    </div>
  )
}
