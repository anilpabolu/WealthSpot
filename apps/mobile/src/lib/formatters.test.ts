import { describe, expect, it, vi } from 'vitest'
import { daysRemaining, formatINR, formatINRCompact, formatPercent, formatRelativeTime } from './formatters'

describe('mobile formatters unit tests', () => {
  it('formats INR with Indian grouping', () => {
    expect(formatINR(1234567.89)).toBe('₹12,34,567.89')
  })

  it('formats compact INR values', () => {
    expect(formatINRCompact(12_500_000)).toContain('Cr')
    expect(formatINRCompact(250_000)).toContain('L')
    expect(formatINRCompact(12_000)).toContain('K')
  })

  it('formats percentages', () => {
    expect(formatPercent(10.456, 2)).toBe('10.46%')
  })

  it('formats relative time and remaining days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-21T12:00:00.000Z'))

    expect(formatRelativeTime('2026-03-21T11:59:30.000Z')).toBe('Just now')
    expect(daysRemaining('2026-03-23T12:00:00.000Z')).toBe(2)

    vi.useRealTimers()
  })
})
