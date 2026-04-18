import { beforeEach, describe, expect, it, vi } from 'vitest'
import { portfolioBff } from '@/services/bff/portfolio.bff'
import { apiGet } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

describe('portfolioBff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPortfolio', () => {
    it('aggregates summary, holdings, and transactions', async () => {
      const mockSummary = { total_invested: 100000, current_value: 120000 }
      const mockHoldings = [{ property_id: 'p1', title: 'Alpha' }]
      const mockTransactions = [{ id: 't1', type: 'investment', amount: 50000 }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockHoldings)
        .mockResolvedValueOnce(mockTransactions)

      const result = await portfolioBff.getPortfolio()

      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/summary')
      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/holdings')
      expect(apiGet).toHaveBeenCalledWith('/investments/transactions', {
        params: { limit: 20, sort: '-created_at' },
      })

      expect(result.summary).toEqual(mockSummary)
      expect(result.holdings).toEqual(mockHoldings)
      expect(result.transactions).toEqual(mockTransactions)
    })
  })

  describe('getPropertyInvestmentDetail', () => {
    it('fetches holding and transactions for a property', async () => {
      const mockHolding = { property_id: 'p1', invested_amount: 50000 }
      const mockTx = [{ id: 't1', amount: 50000 }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockHolding)
        .mockResolvedValueOnce(mockTx)

      const result = await portfolioBff.getPropertyInvestmentDetail('p1')

      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/holdings/p1')
      expect(apiGet).toHaveBeenCalledWith('/investments/transactions', {
        params: { property_id: 'p1', limit: 50 },
      })

      expect(result.holding).toEqual(mockHolding)
      expect(result.transactions).toEqual(mockTx)
    })
  })
})
