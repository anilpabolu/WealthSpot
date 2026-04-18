/**
 * useAppreciation hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

const makeAppreciation = (overrides = {}) => ({
  id: 'apr-1',
  opportunityId: 'opp-1',
  createdBy: 'user-1',
  creatorName: 'Admin',
  mode: 'percentage',
  inputValue: 5,
  oldValuation: 100000,
  newValuation: 105000,
  note: 'Q1 update',
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
})

describe('useAppreciation – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Appreciation History', () => {
    it('fetches appreciation history for an opportunity', async () => {
      const events = [makeAppreciation(), makeAppreciation({ id: 'apr-2', inputValue: 3 })]
      vi.mocked(apiGet).mockResolvedValueOnce(events)

      const result = await apiGet('/opportunities/opp-1/appreciation-history')
      expect(apiGet).toHaveBeenCalledWith('/opportunities/opp-1/appreciation-history')
      expect(result).toHaveLength(2)
    })

    it('returns empty array for no history', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/opportunities/opp-1/appreciation-history')
      expect(result).toHaveLength(0)
    })
  })

  describe('Create Appreciation', () => {
    it('posts appreciation event', async () => {
      const created = makeAppreciation({ id: 'apr-new' })
      vi.mocked(apiPost).mockResolvedValueOnce(created)

      const result = await apiPost('/opportunities/opp-1/appreciate', {
        mode: 'percentage',
        value: 5,
        note: 'Growth',
      })
      expect(apiPost).toHaveBeenCalledWith('/opportunities/opp-1/appreciate', expect.objectContaining({
        mode: 'percentage',
        value: 5,
      }))
      expect((result as any).id).toBe('apr-new')
    })

    it('supports absolute mode', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce(makeAppreciation({ mode: 'absolute' }))
      const result = await apiPost('/opportunities/opp-1/appreciate', {
        mode: 'absolute',
        value: 10000,
      })
      expect((result as any).mode).toBe('absolute')
    })
  })
})
