import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'

export interface DataTableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render: (row: T) => ReactNode
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
  isLoading?: boolean
}

export function DataTable<T>({ columns, rows, rowKey, onSort, onRowClick, isLoading }: DataTableProps<T>) {
  if (isLoading) return <Skeleton rows={8} />
  if (rows.length === 0) return <EmptyState message="No data to show." />

  return (
    <>
      {/* Table layout: md and up */}
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th key={column.key} scope="col" className="py-2 pr-4 font-medium text-gray-700">
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort?.(column.key)}
                    className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {column.header}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-gray-100 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            >
              {columns.map((column) => (
                <td key={column.key} className="py-2 pr-4">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Card layout: below md */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`rounded border border-gray-200 p-3 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between gap-4 py-0.5 text-sm">
                <span className="text-gray-500">{column.header}</span>
                <span>{column.render(row)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  )
}
