import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import IrrBadge from './IrrBadge'

describe('IrrBadge', () => {
  it('renders formatted IRR value with 1 decimal place', () => {
    render(<IrrBadge value={14.5} />)
    expect(screen.getByText('14.5%')).toBeInTheDocument()
  })

  it('sets aria-label containing the formatted value', () => {
    render(<IrrBadge value={12} />)
    expect(screen.getByLabelText('Target IRR 12.0%')).toBeInTheDocument()
  })

  it('renders 0.0% for zero value', () => {
    render(<IrrBadge value={0} />)
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })
})
