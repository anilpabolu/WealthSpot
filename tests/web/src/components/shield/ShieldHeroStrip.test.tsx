import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShieldHeroStrip } from '@/components/shield/ShieldHeroStrip'
import { ASSESSMENT_CATEGORIES } from '@/lib/assessments'

describe('ShieldHeroStrip', () => {
  it('renders one row per category (7 layers)', () => {
    render(<ShieldHeroStrip />)
    for (const cat of ASSESSMENT_CATEGORIES) {
      expect(
        screen.getByText(cat.name.replace(' Assessment', '')),
      ).toBeInTheDocument()
    }
  })

  it('wears the Shield Certified badge', () => {
    render(<ShieldHeroStrip />)
    expect(
      screen.getByText(/Shield Certified/i),
    ).toBeInTheDocument()
  })

  it('opens the info modal via the "Learn more" link', () => {
    render(<ShieldHeroStrip />)
    fireEvent.click(screen.getByText(/Learn more/i))
    expect(
      screen.getByText(/7 layers of trust between you/i),
    ).toBeInTheDocument()
  })

  it('closes the modal when the X is pressed', () => {
    render(<ShieldHeroStrip />)
    fireEvent.click(screen.getByText(/Learn more/i))
    expect(screen.getByText(/7 layers of trust between you/i)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(
      screen.queryByText(/7 layers of trust between you/i),
    ).toBeNull()
  })
})
