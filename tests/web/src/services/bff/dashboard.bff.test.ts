import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dashboardBff } from '@/services/bff/dashboard.bff'
import { apiGet } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

describe('dashboardBff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInvestorDashboard', () => {
    it('aggregates user, portfolio, transactions, and properties', async () => {
      const mockUser = { id: 'u1', fullName: 'Test', role: 'investor' }
      const mockPortfolio = { totalInvested: 200000 }
      const mockTx = [{ id: 't1', type: 'investment' }]
      const mockProps = [{ id: 'p1', slug: 'alpha' }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockPortfolio)
        .mockResolvedValueOnce(mockTx)
        .mockResolvedValueOnce(mockProps)

      const result = await dashboardBff.getInvestorDashboard()

      expect(apiGet).toHaveBeenCalledWith('/auth/me')
      expect(apiGet).toHaveBeenCalledWith('/portfolio/summary')
      expect(apiGet).toHaveBeenCalledWith('/investments/transactions', {
        params: { limit: 5, sort: '-created_at' },
      })
      expect(apiGet).toHaveBeenCalledWith('/properties', {
        params: { status: 'funding', page_size: 4, sort: '-launch_date' },
      })

      expect(result.user).toEqual(mockUser)
      expect(result.portfolio).toEqual(mockPortfolio)
      expect(result.recentTransactions).toEqual(mockTx)
      expect(result.activeProperties).toEqual(mockProps)
    })
  })

  describe('getBuilderDashboard', () => {
    it('aggregates builder info and calculates stats', async () => {
      // /properties/builders/me returns builder profile + embedded properties list
      // API client converts snake_case → camelCase
      const mockListings = [
        { id: 'l1', title: 'P1', status: 'funding', raisedAmount: 5000000, targetAmount: 10000000, investorCount: 20 },
        { id: 'l2', title: 'P2', status: 'active', raisedAmount: 3000000, targetAmount: 5000000, investorCount: 10 },
        { id: 'l3', title: 'P3', status: 'closed', raisedAmount: 2000000, targetAmount: 2000000, investorCount: 5 },
      ]
      const mockBuilderProfile = {
        companyName: 'BuilderX',
        verified: true,
        properties: mockListings,
      }

      vi.mocked(apiGet).mockResolvedValueOnce(mockBuilderProfile)

      const result = await dashboardBff.getBuilderDashboard()

      expect(apiGet).toHaveBeenCalledWith('/properties/builders/me')
      expect(result.builder).toEqual({ companyName: 'BuilderX', verified: true })
      expect(result.listings).toEqual(mockListings)
      expect(result.stats.totalRaised).toBe(10000000)
      expect(result.stats.activeCount).toBe(2) // funding + active
      expect(result.stats.investorCount).toBe(35)
    })

    it('handles empty listings gracefully', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        companyName: 'EmptyBuilder',
        verified: false,
      })
      const result = await dashboardBff.getBuilderDashboard()
      expect(result.listings).toEqual([])
      expect(result.stats.totalRaised).toBe(0)
      expect(result.stats.activeCount).toBe(0)
      expect(result.stats.investorCount).toBe(0)
    })
  })
})
