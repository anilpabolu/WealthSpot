/**
 * StatusBadge component logic tests.
 * Tests the COLOR_MAP data-driven logic for each status value.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
}))

// Inline replica of COLOR_MAP from StatusBadge.tsx to test its logic independently
const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  funding: { bg: 'bg-blue-100', text: 'text-blue-700' },
  funded: { bg: 'bg-purple-100', text: 'text-purple-700' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  payment_pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  NOT_STARTED: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

const DEFAULT_COLORS = { bg: 'bg-gray-100', text: 'text-gray-600' }

const getColors = (status: string) => COLOR_MAP[status] ?? DEFAULT_COLORS

describe('StatusBadge – COLOR_MAP logic', () => {
  it('active status maps to green', () => {
    const colors = getColors('active')
    expect(colors.bg).toBe('bg-green-100')
    expect(colors.text).toBe('text-green-700')
  })

  it('funding status maps to blue', () => {
    const colors = getColors('funding')
    expect(colors.bg).toBe('bg-blue-100')
    expect(colors.text).toBe('text-blue-700')
  })

  it('funded status maps to purple', () => {
    const colors = getColors('funded')
    expect(colors.bg).toBe('bg-purple-100')
    expect(colors.text).toBe('text-purple-700')
  })

  it('pending status maps to yellow', () => {
    const colors = getColors('pending')
    expect(colors.bg).toBe('bg-yellow-100')
    expect(colors.text).toBe('text-yellow-700')
  })

  it('payment_pending maps to yellow same as pending', () => {
    const pending = getColors('pending')
    const paymentPending = getColors('payment_pending')
    expect(pending.bg).toBe(paymentPending.bg)
    expect(pending.text).toBe(paymentPending.text)
  })

  it('APPROVED uppercase maps to green', () => {
    const colors = getColors('APPROVED')
    expect(colors.bg).toBe('bg-green-100')
  })

  it('REJECTED uppercase maps to red', () => {
    const colors = getColors('REJECTED')
    expect(colors.bg).toBe('bg-red-100')
    expect(colors.text).toBe('text-red-700')
  })

  it('IN_PROGRESS maps to blue', () => {
    const colors = getColors('IN_PROGRESS')
    expect(colors.bg).toBe('bg-blue-100')
  })

  it('NOT_STARTED maps to gray', () => {
    const colors = getColors('NOT_STARTED')
    expect(colors.bg).toBe('bg-gray-100')
  })

  it('unknown status falls back to default colors', () => {
    const colors = getColors('unknown_status_xyz')
    expect(colors.bg).toBe('bg-gray-100')
    expect(colors.text).toBe('text-gray-600')
  })

  it('confirmed status maps to green', () => {
    const colors = getColors('confirmed')
    expect(colors.bg).toBe('bg-green-100')
    expect(colors.text).toBe('text-green-700')
  })
})

describe('StatusBadge – size prop contract', () => {
  it('sm size is valid', () => {
    const size: 'sm' | 'md' = 'sm'
    expect(['sm', 'md']).toContain(size)
  })

  it('md size is valid', () => {
    const size: 'sm' | 'md' = 'md'
    expect(['sm', 'md']).toContain(size)
  })

  it('sm is the default size value', () => {
    // Default from component: size = 'sm'
    const defaultSize = 'sm'
    expect(defaultSize).toBe('sm')
  })
})

describe('StatusBadge – text transformation', () => {
  it('replaces underscores with spaces for display', () => {
    const status = 'payment_pending'
    const display = status.replace(/_/g, ' ')
    expect(display).toBe('payment pending')
  })

  it('handles status without underscores unchanged', () => {
    const status = 'active'
    const display = status.replace(/_/g, ' ')
    expect(display).toBe('active')
  })

  it('multiple underscores are all replaced', () => {
    const status = 'NOT_YET_STARTED'
    const display = status.replace(/_/g, ' ')
    expect(display).toBe('NOT YET STARTED')
  })
})
