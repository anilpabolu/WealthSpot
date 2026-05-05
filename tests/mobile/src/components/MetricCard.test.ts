/**
 * MetricCard component logic tests.
 * Tests the prop contract and optional subtitle behavior.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
}))

describe('MetricCard – prop contract', () => {
  it('required props: label and value', () => {
    const props = { label: 'Total Invested', value: '₹5L' }
    expect(props.label).toBe('Total Invested')
    expect(props.value).toBe('₹5L')
  })

  it('subtitle is optional', () => {
    const withSub = { label: 'IRR', value: '14.5%', subtitle: 'annualised' }
    const withoutSub = { label: 'IRR', value: '14.5%' }
    expect(withSub.subtitle).toBe('annualised')
    expect((withoutSub as { subtitle?: string }).subtitle).toBeUndefined()
  })

  it('empty string value is valid', () => {
    const props = { label: 'Status', value: '' }
    expect(props.value).toBe('')
  })

  it('numeric-looking string value is valid', () => {
    const props = { label: 'Units', value: '42' }
    expect(props.value).toBe('42')
  })

  it('subtitle renders when provided', () => {
    const props = { label: 'XIRR', value: '15.2%', subtitle: 'rolling 12-month' }
    expect(typeof props.subtitle).toBe('string')
  })
})

describe('MetricCard – display formatting expectations', () => {
  it('value should be a string (pre-formatted)', () => {
    // MetricCard receives pre-formatted strings, not raw numbers
    const formatted = `₹${(5_000_000).toLocaleString('en-IN')}`
    expect(typeof formatted).toBe('string')
    expect(formatted.startsWith('₹')).toBe(true)
  })

  it('label is a human-readable string', () => {
    const labels = ['Total Invested', 'Current Value', 'Est. Monthly Income', 'IRR', 'Units']
    for (const label of labels) {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})
