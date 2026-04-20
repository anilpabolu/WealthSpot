import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShieldDot } from '@/components/shield/ShieldDot'

describe('ShieldDot', () => {
  it('renders with an accessible role of status', () => {
    render(<ShieldDot status="passed" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('uses emerald colour for passed', () => {
    render(<ShieldDot status="passed" />)
    const dot = screen.getByRole('status')
    expect(dot.className).toMatch(/bg-emerald-500/)
  })

  it('uses amber colour for flagged', () => {
    render(<ShieldDot status="flagged" />)
    const dot = screen.getByRole('status')
    expect(dot.className).toMatch(/bg-amber-500/)
  })

  it('uses muted slate colour for not_started', () => {
    render(<ShieldDot status="not_started" />)
    const dot = screen.getByRole('status')
    expect(dot.className).toMatch(/bg-slate-500/)
  })

  it('falls back to the not_started colour for unknown statuses', () => {
    render(<ShieldDot status="mystery" />)
    const dot = screen.getByRole('status')
    expect(dot.className).toMatch(/bg-slate-500/)
  })

  it('animates pulse only when in_progress + pulse=true', () => {
    const { rerender } = render(
      <ShieldDot status="in_progress" pulse />,
    )
    expect(screen.getByRole('status').className).toMatch(/animate-pulse/)

    rerender(<ShieldDot status="passed" pulse />)
    expect(screen.getByRole('status').className).not.toMatch(/animate-pulse/)
  })

  it('exposes the custom title as aria-label', () => {
    render(<ShieldDot status="passed" title="All checks green" />)
    expect(
      screen.getByLabelText('All checks green'),
    ).toBeInTheDocument()
  })
})
