import { useState } from 'react'
import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'

export interface DataTableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render: (row: T) => ReactNode
}

export type SortDirection = 'asc' | 'desc'

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onSort?: (key: string, direction: SortDirection) => void
  onRowClick?: (row: T) => void
  isLoading?: boolean
}

export function DataTable<T>({ columns, rows, rowKey, onSort, onRowClick, isLoading }: DataTableProps<T>) {
  // DataTable owns which column/direction is active (and toggles it on
  // repeated clicks); the caller just receives (key, direction) and re-sorts
  // its rows - this is what TESTING.md means by "sort toggles asc/desc".
  const [activeSort, setActiveSort] = useState<{ key: string; direction: SortDirection } | null>(null)

  if (isLoading) return <Skeleton rows={8} />
  if (rows.length === 0) return <EmptyState message="No data to show." />

  function handleHeaderClick(key: string) {
    const direction: SortDirection =
      activeSort?.key === key && activeSort.direction === 'asc' ? 'desc' : 'asc'
    setActiveSort({ key, direction })
    onSort?.(key, direction)
  }

  return (
    <>
      {/* Table layout: md and up */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-4 py-3 font-semibold text-slate-600">
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleHeaderClick(column.key)}
                      className="flex items-center gap-1 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {column.header}
                      {activeSort?.key === column.key && (
                        <span aria-hidden="true" className="text-brand-600">
                          {activeSort.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick ? 'View details' : undefined}
                className={onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-700">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card layout: below md */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row)
                    }
                  }
                : undefined
            }
            tabIndex={onRowClick ? 0 : undefined}
            role={onRowClick ? 'button' : undefined}
            className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500' : ''}`}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between gap-4 py-0.5 text-sm">
                <span className="text-slate-500">{column.header}</span>
                <span className="text-slate-800">{column.render(row)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  )
}
