import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShieldInfoModal } from '@/components/shield/ShieldInfoModal'
import { ASSESSMENT_CATEGORIES } from '@/lib/assessments'

describe('ShieldInfoModal', () => {
  it('returns null when open is false', () => {
    const { container } = render(
      <ShieldInfoModal open={false} onClose={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the header text when open', () => {
    render(<ShieldInfoModal open onClose={vi.fn()} />)
    expect(
      screen.getByText(/7 layers of trust between you/i),
    ).toBeInTheDocument()
    expect(screen.getByText('WealthSpot Shield')).toBeInTheDocument()
  })

  it('renders one card per assessment category', () => {
    render(<ShieldInfoModal open onClose={vi.fn()} />)
    for (const cat of ASSESSMENT_CATEGORIES) {
      expect(screen.getByText(cat.name)).toBeInTheDocument()
    }
  })

  it('shows numbered badges (1-7)', () => {
    render(<ShieldInfoModal open onClose={vi.fn()} />)
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('renders sub-item chips for each category', () => {
    render(<ShieldInfoModal open onClose={vi.fn()} />)
    // Check a known sub-item from the first category (builder)
    const firstSub = ASSESSMENT_CATEGORIES[0]?.subItems[0]
    if (firstSub) {
      expect(screen.getByText(firstSub.label)).toBeInTheDocument()
    }
  })

  it('renders the "Verified by" attribution for each layer', () => {
    render(<ShieldInfoModal open onClose={vi.fn()} />)
    // law_firm → "Empanelled Law Firm"
    expect(screen.getByText(/Empanelled Law Firm/)).toBeInTheDocument()
    // At least one "WealthSpot Team" attribution
    expect(screen.getAllByText(/WealthSpot Team/).length).toBeGreaterThan(0)
  })

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn()
    render(<ShieldInfoModal open onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when clicking the backdrop', () => {
    const onClose = vi.fn()
    render(<ShieldInfoModal open onClose={onClose} />)
    // The outer backdrop div fires onClose
    const backdrop = screen.getByText(/7 layers of trust/).closest('.fixed')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does NOT close when clicking inside the modal content', () => {
    const onClose = vi.fn()
    render(<ShieldInfoModal open onClose={onClose} />)
    fireEvent.click(screen.getByText(/7 layers of trust/))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders the footer text', () => {
    render(<ShieldInfoModal open onClose={vi.fn()} />)
    expect(
      screen.getByText(/assessments are refreshed quarterly/i),
    ).toBeInTheDocument()
  })
})
