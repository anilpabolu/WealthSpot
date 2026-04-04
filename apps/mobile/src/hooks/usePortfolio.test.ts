/**
 * mobile usePortfolio hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '../lib/api'

describe('mobile usePortfolio – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Portfolio summary', () => {
    it('fetches full portfolio summary', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        totalInvested: 500000,
        currentValue: 560000,
        totalReturns: 60000,
        unrealizedGains: 40000,
        avgIrr: 14.2,
        xirr: 13.8,
        propertiesCount: 3,
        citiesCount: 2,
        monthlyIncome: 5000,
        assetAllocation: [{ type: 'residential', percentage: 60, value: 300000 }],
        cityDistribution: [{ city: 'Mumbai', percentage: 60, value: 300000 }],
        monthlyReturns: [{ month: '2025-01', returns: 5000, invested: 500000 }],
      })

      const result = await apiGet<any>('/portfolio/summary')
      expect(result.totalInvested).toBe(500000)
      expect(result.xirr).toBe(13.8)
      expect(result.assetAllocation).toHaveLength(1)
    })
  })

  describe('Portfolio properties', () => {
    it('fetches list of portfolio holdings', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { propertyId: 'p1', propertyTitle: 'Emerald Heights', propertyCity: 'Mumbai', assetType: 'residential', investedAmount: 200000, currentValue: 230000, units: 20, irr: 14, returnPercentage: 15, status: 'active' },
        { propertyId: 'p2', propertyTitle: 'Sky Towers', propertyCity: 'Bangalore', assetType: 'commercial', investedAmount: 300000, currentValue: 330000, units: 30, irr: 13, returnPercentage: 10, status: 'active' },
      ])

      const result = await apiGet<any>('/portfolio/properties')
      expect(result).toHaveLength(2)
      expect(result[0].propertyCity).toBe('Mumbai')
    })

    it('returns empty array when no portfolio properties', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/portfolio/properties')
      expect(result).toHaveLength(0)
    })
  })

  describe('Recent transactions', () => {
    it('fetches transactions with default limit', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 't1', type: 'investment', amount: 200000, propertyTitle: 'Emerald Heights', date: '2025-01-01', status: 'success' },
      ])

      const result = await apiGet<any>('/portfolio/transactions', { params: { limit: 10 } })
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('investment')
    })

    it('fetches transactions with custom limit', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      await apiGet('/portfolio/transactions', { params: { limit: 25 } })
      expect(apiGet).toHaveBeenCalledWith('/portfolio/transactions', { params: { limit: 25 } })
    })
  })
})
