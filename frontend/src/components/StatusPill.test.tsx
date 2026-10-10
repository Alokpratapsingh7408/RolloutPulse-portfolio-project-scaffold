import { render, screen } from '@testing-library/react'
import { StatusPill } from './StatusPill'
import type { Status } from './StatusPill'

describe('StatusPill', () => {
  const cases: Array<{ status: Status; label: string; colorClass: string }> = [
    { status: 'pending', label: 'Pending', colorClass: 'bg-gray-100' },
    { status: 'in_progress', label: 'In progress', colorClass: 'bg-blue-100' },
    { status: 'success', label: 'Success', colorClass: 'bg-green-100' },
    { status: 'failed', label: 'Failed', colorClass: 'bg-red-100' },
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
