/**
 * mobile useAppreciation hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

const makeEvent = (id: string, mode: 'percentage' | 'absolute' = 'percentage') => ({
  id,
  opportunityId: 'opp-1',
  createdBy: 'admin-1',
  creatorName: 'Admin',
  mode,
  inputValue: mode === 'percentage' ? 5 : 500000,
  oldValuation: 10000000,
  newValuation: mode === 'percentage' ? 10500000 : 10500000,
  note: null,
  createdAt: '2024-06-01T00:00:00Z',
})

describe('mobile useAppreciation – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches appreciation history for an opportunity', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([makeEvent('ev-1'), makeEvent('ev-2')])

    const result = await apiGet<any[]>('/opportunities/opp-1/appreciation-history')
    expect(apiGet).toHaveBeenCalledWith('/opportunities/opp-1/appreciation-history')
    expect(result).toHaveLength(2)
    expect(result[0].mode).toBe('percentage')
  })

  it('returns empty list when no events exist', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([])

    const result = await apiGet<any[]>('/opportunities/opp-1/appreciation-history')
    expect(result).toEqual([])
  })

  it('handles absolute mode events', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([makeEvent('ev-3', 'absolute')])

    const result = await apiGet<any[]>('/opportunities/opp-1/appreciation-history')
    expect(result[0].mode).toBe('absolute')
    expect(result[0].inputValue).toBe(500000)
  })
})
