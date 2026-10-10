import { render, screen } from '@testing-library/react'
import { StatusPill } from './StatusPill'
import type { Status } from './StatusPill'

describe('StatusPill', () => {
  const cases: Array<{ status: Status; label: string; colorClass: string }> = [
    { status: 'pending', label: 'Pending', colorClass: 'bg-slate-100' },
    { status: 'in_progress', label: 'In progress', colorClass: 'bg-indigo-50' },
    { status: 'success', label: 'Success', colorClass: 'bg-emerald-50' },
    { status: 'failed', label: 'Failed', colorClass: 'bg-rose-50' },
  ]

  it.each(cases)('renders the correct text, icon, and color class for "%s"', ({ status, label, colorClass }) => {
    render(<StatusPill status={status} />)

    const pill = screen.getByText(label).closest('span')
    expect(pill).not.toBeNull()
    expect(pill).toHaveClass(colorClass)
    // icon is rendered as an aria-hidden span so it's decorative, not read aloud twice
    expect(pill?.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})
