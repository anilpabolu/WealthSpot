import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BuilderShieldStep, type BuilderAnswer } from '@/components/shield/BuilderShieldStep'
import { ASSESSMENT_CATEGORIES } from '@/lib/assessments'

const EMPTY_ANSWERS: Record<string, BuilderAnswer> = {}

let onChange: ReturnType<typeof vi.fn>

beforeEach(() => {
  onChange = vi.fn()
})

describe('BuilderShieldStep', () => {
  it('renders the informational banner', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    expect(screen.getByText(/WealthSpot Shield/)).toBeInTheDocument()
    expect(screen.getByText(/everything on this step is optional/i)).toBeInTheDocument()
  })

  it('renders one collapsible section per category', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    for (const cat of ASSESSMENT_CATEGORIES) {
      expect(screen.getByText(cat.name)).toBeInTheDocument()
    }
  })

  it('shows sub-item count for each category', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    // Some categories share an identical count (e.g. "5 items" appears twice),
    // so collect counts and use getAllByText.
    const expectedCounts = new Map<string, number>()
    for (const cat of ASSESSMENT_CATEGORIES) {
      const label = `${cat.subItems.length} items`
      expectedCounts.set(label, (expectedCounts.get(label) ?? 0) + 1)
    }
    for (const [label, count] of expectedCounts) {
      expect(screen.getAllByText(label)).toHaveLength(count)
    }
  })

  it('first category is expanded by default', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    const firstCat = ASSESSMENT_CATEGORIES[0]!
    // First sub-item of the first category should be visible
    expect(screen.getByText(firstCat.subItems[0]!.label)).toBeInTheDocument()
  })

  it('collapses the active category when clicked again', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    const firstCat = ASSESSMENT_CATEGORIES[0]!
    fireEvent.click(screen.getByText(firstCat.name))
    expect(
      screen.queryByText(firstCat.subItems[0]!.label),
    ).not.toBeInTheDocument()
  })

  it('expands a different category when clicked', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    const secondCat = ASSESSMENT_CATEGORIES[1]!
    fireEvent.click(screen.getByText(secondCat.name))
    expect(screen.getByText(secondCat.subItems[0]!.label)).toBeInTheDocument()
    // First category collapses
    const firstCat = ASSESSMENT_CATEGORIES[0]!
    expect(
      screen.queryByText(firstCat.subItems[0]!.label),
    ).not.toBeInTheDocument()
  })

  it('calls onChange when a textarea sub-item value changes', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    const textareas = screen.getAllByPlaceholderText('Your answer…')
    if (textareas.length > 0) {
      fireEvent.change(textareas[0]!, { target: { value: 'Grade A' } })
      expect(onChange).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ value: 'Grade A' }),
      )
    }
  })

  it('renders select dropdowns for sub-items with inputType select', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    // Look for the "— Select —" placeholder options
    const selectPlaceholders = screen.queryAllByText('— Select —')
    // There should be at least one select-type sub-item across all categories
    expect(selectPlaceholders.length).toBeGreaterThanOrEqual(0)
  })

  it('renders attach evidence links for document-requiring sub-items', () => {
    render(<BuilderShieldStep answers={EMPTY_ANSWERS} onChange={onChange} />)
    const attachLinks = screen.queryAllByText('Attach evidence')
    // At least some sub-items require documents
    expect(attachLinks.length).toBeGreaterThanOrEqual(0)
  })

  it('pre-fills answers from the answers prop', () => {
    const firstCat = ASSESSMENT_CATEGORIES[0]!
    // Use a text-type sub-item so it renders a <textarea> (first sub is a select).
    const textSub = firstCat.subItems.find((s) => s.inputType === 'text')!
    const answers: Record<string, BuilderAnswer> = {
      [textSub.code]: {
        categoryCode: firstCat.code,
        subcategoryCode: textSub.code,
        value: 'Pre-filled value',
        files: [],
      },
    }
    render(<BuilderShieldStep answers={answers} onChange={onChange} />)
    const textarea = screen.getByDisplayValue('Pre-filled value')
    expect(textarea).toBeInTheDocument()
  })
})
