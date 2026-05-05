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
      const mockSummary = { totalInvested: 100000, currentValue: 120000 }
      const mockHoldings = [{ propertyId: 'p1', title: 'Alpha' }]
      const mockTransactions = [{ id: 't1', type: 'investment', amount: 50000 }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockHoldings)
        .mockResolvedValueOnce(mockTransactions)

      const result = await portfolioBff.getPortfolio()

      expect(apiGet).toHaveBeenCalledWith('/portfolio/summary')
      expect(apiGet).toHaveBeenCalledWith('/portfolio/properties')
      expect(apiGet).toHaveBeenCalledWith('/portfolio/transactions', {
        params: { limit: 20, sort: '-created_at' },
      })

      expect(result.summary).toEqual(mockSummary)
      expect(result.holdings).toEqual(mockHoldings)
      expect(result.transactions).toEqual(mockTransactions)
    })
  })

  describe('getPropertyInvestmentDetail', () => {
    it('fetches holding and transactions for a property', async () => {
      const mockHolding = { propertyId: 'p1', investedAmount: 50000 }
      const mockTx = [{ id: 't1', amount: 50000 }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockHolding)
        .mockResolvedValueOnce(mockTx)

      const result = await portfolioBff.getPropertyInvestmentDetail('p1')

      expect(apiGet).toHaveBeenCalledWith('/portfolio/properties/p1')
      expect(apiGet).toHaveBeenCalledWith('/investments/transactions', {
        params: { property_id: 'p1', limit: 50 },
      })

      expect(result.holding).toEqual(mockHolding)
      expect(result.transactions).toEqual(mockTx)
    })
  })
})
