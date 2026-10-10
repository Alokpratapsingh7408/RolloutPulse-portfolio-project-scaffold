import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from './DataTable'
import type { DataTableColumn } from './DataTable'

interface Row {
  id: string
  name: string
}

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true, render: (row) => row.name },
]

const rows: Row[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
]

describe('DataTable', () => {
  it('renders the empty state when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} />)
    expect(screen.getByText(/no data to show/i)).toBeInTheDocument()
  })

  it('toggles sort direction ascending/descending on repeated header clicks', async () => {
    const user = userEvent.setup()
    const onSort = jest.fn()

    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onSort={onSort} />)

    const header = screen.getByRole('button', { name: /name/i })
    await user.click(header)
    expect(onSort).toHaveBeenNthCalledWith(1, 'name', 'asc')

    await user.click(header)
    expect(onSort).toHaveBeenNthCalledWith(2, 'name', 'desc')

    await user.click(header)
    expect(onSort).toHaveBeenNthCalledWith(3, 'name', 'asc')
  })
})
