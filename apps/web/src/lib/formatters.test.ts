import { describe, expect, it, vi } from 'vitest'
import { daysRemaining, formatINR, formatINRCompact, formatPercent, formatRelativeTime } from './formatters'

describe('web formatters unit tests', () => {
  it('formats INR with Indian grouping', () => {
    expect(formatINR(1234567.89)).toBe('₹12,34,567.89')
  })

  it('formats compact INR values', () => {
    expect(formatINRCompact(12_500_000)).toContain('Cr')
    expect(formatINRCompact(250_000)).toContain('L')
    expect(formatINRCompact(12_000)).toContain('K')
  })

  it('formats percentages', () => {
    expect(formatPercent(14.234, 2)).toBe('14.23%')
  })

  it('formats relative time and days remaining deterministically', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-21T12:00:00.000Z'))

    expect(formatRelativeTime('2026-03-21T11:30:00.000Z')).toBe('30m ago')
    expect(daysRemaining('2026-03-24T12:00:00.000Z')).toBe(3)

    vi.useRealTimers()
  })
})
