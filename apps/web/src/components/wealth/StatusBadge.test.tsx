import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renders "Active" for active status', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders "Fully Funded" for funded status', () => {
    render(<StatusBadge status="funded" />)
    expect(screen.getByText('Fully Funded')).toBeInTheDocument()
  })

  it('renders "Under Review" for under_review status', () => {
    render(<StatusBadge status="under_review" />)
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })

  it('renders "Rejected" for rejected status', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('falls back to "Unknown" for unrecognised status', () => {
    render(<StatusBadge status={'mystery' as never} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('sets aria-label containing the status label', () => {
    render(<StatusBadge status="funding" />)
    expect(screen.getByLabelText('Status: Funding')).toBeInTheDocument()
  })
})
