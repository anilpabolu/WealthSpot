/**
 * web useAnalytics hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

describe('web useAnalytics – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Full analytics dashboard', () => {
    it('fetches the complete analytics response', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        vaultSummary: { vaults: [], platformAum: 50000000, totalInvestors: 400, totalOpportunities: 45, avgDealSize: 111111 },
        investmentTrends: { trends: [], totalVolume: 50000000, avgMonthlyVolume: 4000000, peakMonth: '2025-01', peakAmount: 6000000 },
        geographic: { cities: [], topCity: 'Mumbai', totalCities: 10 },
        investors: { growth: [], totalUsers: 500, totalInvestors: 400, totalBuilders: 80, kycCompletionRate: 80, avgMonthlySignups: 42 },
        eoiFunnel: { funnel: [], totalEois: 120, totalInterest: 10000000, conversionRate: 0.7 },
        topOpportunities: { opportunities: [], total: 0 },
        revenue: { monthly: [], byType: {}, totalRevenue: 0 },
      })

      const result = await apiGet<any>('/analytics/dashboard')
      expect(result.vaultSummary.totalInvestors).toBe(400)
      expect(result.investors.kycCompletionRate).toBe(80)
    })
  })

  describe('Vault summary', () => {
    it('fetches vault breakdown', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        vaults: [{ vaultType: 'real_estate', totalOpportunities: 30, activeOpportunities: 20, fundingPct: 65 }],
        platformAum: 50000000,
        totalInvestors: 400,
        totalOpportunities: 30,
        avgDealSize: 1666667,
      })

      const result = await apiGet<any>('/analytics/vault-summary')
      expect(result.vaults).toHaveLength(1)
      expect(result.platformAum).toBe(50000000)
    })
  })

  describe('Investment trends', () => {
    it('fetches trends with default 12 months', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ trends: [], totalVolume: 0, avgMonthlyVolume: 0, peakMonth: null, peakAmount: 0 })
      await apiGet('/analytics/investment-trends', { params: { months: 12 } })
      expect(apiGet).toHaveBeenCalledWith('/analytics/investment-trends', { params: { months: 12 } })
    })

    it('accepts custom month range', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ trends: [], totalVolume: 0, avgMonthlyVolume: 0, peakMonth: null, peakAmount: 0 })
      await apiGet('/analytics/investment-trends', { params: { months: 24 } })
      expect(apiGet).toHaveBeenCalledWith('/analytics/investment-trends', { params: { months: 24 } })
    })
  })

  describe('Geographic distribution', () => {
    it('fetches city distribution data', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        cities: [{ city: 'Mumbai', state: 'Maharashtra', vaultType: 'real_estate', opportunityCount: 10, totalTarget: 20000000, totalRaised: 15000000, totalInvestors: 100 }],
        topCity: 'Mumbai',
        totalCities: 1,
      })

      const result = await apiGet<any>('/analytics/geographic')
      expect(result.topCity).toBe('Mumbai')
      expect(result.cities[0].city).toBe('Mumbai')
    })
  })

  describe('Investor analytics', () => {
    it('fetches investor growth data', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        growth: [{ month: '2025-01', newUsers: 50, newInvestors: 35, newBuilders: 10, kycApproved: 30, kycInProgress: 5, cumulativeUsers: 500, cumulativeInvestors: 400 }],
        totalUsers: 500,
        totalInvestors: 400,
        totalBuilders: 80,
        kycCompletionRate: 80,
        avgMonthlySignups: 42,
      })

      const result = await apiGet<any>('/analytics/investors')
      expect(result.growth).toHaveLength(1)
      expect(result.kycCompletionRate).toBe(80)
    })
  })
})
