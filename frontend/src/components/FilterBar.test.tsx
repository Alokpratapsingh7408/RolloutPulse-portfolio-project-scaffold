import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from './FilterBar'

describe('FilterBar', () => {
  it('calls onChange with the debounced search value after typing stops', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime })
    const onChange = jest.fn()

    render(<FilterBar statusFilter="all" searchValue="" onChange={onChange} />)

    const search = screen.getByLabelText(/search/i)
    await user.type(search, 'DEV-001')

    // Not yet called before the 300ms debounce elapses
    expect(onChange).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)

    expect(onChange).toHaveBeenCalledWith({ statusFilter: 'all', searchValue: 'DEV-001' })

    jest.useRealTimers()
  })

  it('calls onChange with the selected status immediately', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()

    render(<FilterBar statusFilter="all" searchValue="" onChange={onChange} />)

    const select = screen.getByLabelText(/status/i)
    await user.selectOptions(select, 'failed')

    expect(onChange).toHaveBeenCalledWith({ statusFilter: 'failed', searchValue: '' })
  })
})
