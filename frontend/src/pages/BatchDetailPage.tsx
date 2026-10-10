import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRealtimeBatchDevices } from '../hooks/useRealtimeBatchDevices'
import { DataTable } from '../components/DataTable'
import type { DataTableColumn } from '../components/DataTable'
import { FilterBar } from '../components/FilterBar'
import type { FilterBarValue } from '../components/FilterBar'
import { Modal } from '../components/Modal'
import { StatusPill } from '../components/StatusPill'
import type { Status } from '../components/StatusPill'
import { useGetBatchDevicesQuery } from '../store/api'
import type { BatchDeviceWithDevice } from '../store/api'

type SortKey = 'serial' | 'model' | 'region' | 'status' | 'updated_at'

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: batchDevices, isLoading, isError } = useGetBatchDevicesQuery(id ?? '')
  useRealtimeBatchDevices(id ?? '')

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

  function handleSort(key: string) {
    setSort((prev) =>
      prev.key === key
        ? { key: key as SortKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key: key as SortKey, direction: 'asc' },
    )
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

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Devices</h1>

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
              <dt className="text-gray-500">Model</dt>
              <dd>{selectedDevice.devices?.model ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Region</dt>
              <dd>{selectedDevice.devices?.region ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <StatusPill status={selectedDevice.status as Status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Updated</dt>
              <dd>{new Date(selectedDevice.updated_at).toLocaleString()}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </main>
  )
}
