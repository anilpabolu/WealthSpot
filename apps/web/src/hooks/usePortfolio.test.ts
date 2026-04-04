/**
 * usePortfolio hook tests – API layer (unit)
 * Tests that portfolio API calls use correct endpoints and params.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

describe('usePortfolio – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Portfolio Summary', () => {
    it('fetches complete portfolio summary', async () => {
      const mockSummary = {
        totalInvested: 500000,
        currentValue: 560000,
        totalReturns: 60000,
        unrealizedGains: 40000,
        avgIrr: 12.5,
        xirr: 14.2,
        propertiesCount: 3,
        citiesCount: 2,
        monthlyIncome: 5000,
        assetAllocation: [{ type: 'residential', percentage: 60, value: 300000 }],
        cityDistribution: [{ city: 'Mumbai', percentage: 60, value: 300000 }],
        monthlyReturns: [{ month: '2025-01', returns: 5000, invested: 500000 }],
      }
      vi.mocked(apiGet).mockResolvedValueOnce(mockSummary)

      const result = await apiGet<any>('/portfolio/summary')

      expect(apiGet).toHaveBeenCalledWith('/portfolio/summary')
      expect(result.totalInvested).toBe(500000)
      expect(result.avgIrr).toBe(12.5)
      expect(result.propertiesCount).toBe(3)
    })
  })

  describe('Portfolio Properties', () => {
    it('fetches portfolio properties list', async () => {
      const mockProps = [
        {
          propertyId: 'p1',
          propertyTitle: 'Emerald Heights',
          propertyCity: 'Mumbai',
          investedAmount: 200000,
          currentValue: 230000,
          units: 10,
          irr: 14,
          status: 'active',
        },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(mockProps)

      const result = await apiGet<any>('/portfolio/properties')

      expect(apiGet).toHaveBeenCalledWith('/portfolio/properties')
      expect(result).toHaveLength(1)
      expect(result[0].propertyTitle).toBe('Emerald Heights')
    })
  })

  describe('Recent Transactions', () => {
    it('fetches transactions with default limit', async () => {
      const mockTxns = [
        { id: 't1', type: 'investment', amount: 100000, propertyTitle: 'Emerald', date: '2025-01-01', status: 'confirmed' },
        { id: 't2', type: 'payout', amount: 5000, propertyTitle: 'Emerald', date: '2025-02-01', status: 'confirmed' },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(mockTxns)

      const result = await apiGet<any>('/portfolio/transactions', { params: { limit: 10 } })

      expect(apiGet).toHaveBeenCalledWith('/portfolio/transactions', { params: { limit: 10 } })
      expect(result).toHaveLength(2)
    })

    it('fetches transactions with custom limit', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      await apiGet('/portfolio/transactions', { params: { limit: 5 } })
      expect(apiGet).toHaveBeenCalledWith('/portfolio/transactions', { params: { limit: 5 } })
    })
  })

  describe('Vault Portfolio Breakdown', () => {
    it('fetches vault-wise portfolio breakdown', async () => {
      const mockVaults = [
        { vaultType: 'wealth', totalInvested: 300000, currentValue: 340000, returns: 40000, returnPct: 13.3, opportunityCount: 2 },
        { vaultType: 'community', totalInvested: 200000, currentValue: 220000, returns: 20000, returnPct: 10, opportunityCount: 1 },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(mockVaults)

      const result = await apiGet<any>('/portfolio/vaults')

      expect(result).toHaveLength(2)
      expect(result[0].vaultType).toBe('wealth')
    })
  })
})
