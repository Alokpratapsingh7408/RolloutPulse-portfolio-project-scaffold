import { useEffect, useRef, useState } from 'react'
import type { Status } from './StatusPill'

export type StatusFilter = Status | 'all'

export interface FilterBarValue {
  statusFilter: StatusFilter
  searchValue: string
}

export interface FilterBarProps {
  statusFilter: StatusFilter
  searchValue: string
  onChange: (value: FilterBarValue) => void
}

const STATUS_OPTIONS: StatusFilter[] = ['all', 'pending', 'in_progress', 'success', 'failed']
const DEBOUNCE_MS = 300

export function FilterBar({ statusFilter, searchValue, onChange }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(searchValue)

  // Keep latest statusFilter/onChange in refs so the debounce timer below only
  // ever needs to re-run when the user actually types (searchInput changes).
  const statusFilterRef = useRef(statusFilter)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    statusFilterRef.current = statusFilter
    onChangeRef.current = onChange
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeRef.current({ statusFilter: statusFilterRef.current, searchValue: searchInput })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => onChange({ statusFilter: e.target.value as StatusFilter, searchValue: searchInput })}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? 'All' : option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700">
          Search (serial, model, region)
        </label>
        <input
          id="filter-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
