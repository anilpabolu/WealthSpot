/**
 * useLender hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

describe('useLender – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Dashboard', () => {
    it('fetches lender dashboard summary', async () => {
      const summary = {
        totalLoans: 10,
        activeLoans: 5,
        totalDisbursed: 5000000,
        totalRepaid: 2000000,
      }
      vi.mocked(apiGet).mockResolvedValueOnce(summary)

      const result = await apiGet('/lender/dashboard')
      expect(apiGet).toHaveBeenCalledWith('/lender/dashboard')
      expect((result as any).totalLoans).toBe(10)
    })
  })

  describe('Loans', () => {
    it('fetches loans list', async () => {
      const data = {
        loans: [{ id: 'l1', status: 'active', amount: 500000 }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }
      vi.mocked(apiGet).mockResolvedValueOnce(data)

      const result = await apiGet('/lender/loans', { params: { page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/lender/loans', expect.objectContaining({
        params: { page: 1 },
      }))
      expect((result as any).loans).toHaveLength(1)
    })

    it('filters by status', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ loans: [], total: 0 })
      await apiGet('/lender/loans', { params: { status: 'closed', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/lender/loans', {
        params: expect.objectContaining({ status: 'closed' }),
      })
    })
  })
})
