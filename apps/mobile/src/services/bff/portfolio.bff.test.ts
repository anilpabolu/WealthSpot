/**
 * mobile portfolioBff tests – functional
 * Tests portfolio aggregation and property investment detail.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '../../lib/api'
import { mobilePortfolioBff } from './portfolio.bff'

const mockSummary = {
  totalInvested: 500000,
  currentValue: 560000,
  totalReturns: 60000,
  monthlyRentalIncome: 5000,
  propertiesCount: 3,
  unrealizedGain: 40000,
  xirr: 14.2,
}

const mockHoldings = [
  { propertyId: 'p1', slug: 'emerald', title: 'Emerald Heights', city: 'Mumbai', coverImage: null, assetType: 'residential', unitsHeld: 10, investedAmount: 200000, currentValue: 230000, unrealizedGain: 30000, monthlyRental: 2000, status: 'active' },
  { propertyId: 'p2', slug: 'sky-towers', title: 'Sky Towers', city: 'Bangalore', coverImage: null, assetType: 'commercial', unitsHeld: 15, investedAmount: 300000, currentValue: 330000, unrealizedGain: 30000, monthlyRental: 3000, status: 'active' },
]

const mockTransactions = [
  { id: 't1', type: 'investment', amount: 200000, description: null, propertyTitle: 'Emerald Heights', createdAt: '2025-01-01T00:00:00Z' },
]

describe('mobile portfolioBff functional tests', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getPortfolio', () => {
    it('fetches summary, holdings, and transactions in parallel', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockHoldings)
        .mockResolvedValueOnce(mockTransactions)

      const result = await mobilePortfolioBff.getPortfolio()

      expect(apiGet).toHaveBeenCalledTimes(3)
      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/summary')
      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/holdings')
      expect(apiGet).toHaveBeenCalledWith('/investments/transactions', { params: { limit: 20, sort: '-created_at' } })

      expect(result.summary.totalInvested).toBe(500000)
      expect(result.holdings).toHaveLength(2)
      expect(result.transactions).toHaveLength(1)
    })

    it('calculates correct totals from summary', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockHoldings)
        .mockResolvedValueOnce([])

      const result = await mobilePortfolioBff.getPortfolio()

      expect(result.summary.totalReturns).toBe(60000)
      expect(result.summary.xirr).toBe(14.2)
    })
  })

  describe('getPropertyInvestmentDetail', () => {
    it('fetches holding and transactions for a specific property', async () => {
      const holding = mockHoldings[0]
      const propTxns = [mockTransactions[0]]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(holding)
        .mockResolvedValueOnce(propTxns)

      const result = await mobilePortfolioBff.getPropertyInvestmentDetail('p1')

      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/holdings/p1')
      expect(apiGet).toHaveBeenCalledWith('/investments/transactions', { params: { property_id: 'p1', limit: 50 } })

      expect(result.holding.propertyId).toBe('p1')
      expect(result.transactions).toHaveLength(1)
    })
  })
})
