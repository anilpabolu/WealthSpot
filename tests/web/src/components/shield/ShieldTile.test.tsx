import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShieldTile } from '@/components/shield/ShieldTile'

describe('ShieldTile', () => {
  it('renders the short category name (strips "Assessment")', () => {
    render(<ShieldTile code="builder" status="passed" />)
    expect(screen.getByText('Builder')).toBeInTheDocument()
  })

  it('renders the hero short definition for non-compact tiles', () => {
    render(<ShieldTile code="legal" status="passed" />)
    expect(
      screen.getByText(/law firm|Title|Encumbrance/i),
    ).toBeInTheDocument()
  })

  it('omits the description in compact mode', () => {
    render(<ShieldTile code="legal" status="passed" compact />)
    expect(screen.queryByText(/law firm/i)).toBeNull()
  })

  it('fires onClick when pressed', () => {
    const onClick = vi.fn()
    render(<ShieldTile code="builder" status="passed" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('returns null for an unknown category code', () => {
    const { container } = render(
      <ShieldTile code={'mystery' as never} status="passed" />,
    )
    expect(container.firstChild).toBeNull()
  })
})
