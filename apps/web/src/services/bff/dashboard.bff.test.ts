import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dashboardBff } from './dashboard.bff'
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
      const mockUser = { id: 'u1', full_name: 'Test', role: 'investor' }
      const mockPortfolio = { total_invested: 200000 }
      const mockTx = [{ id: 't1', type: 'investment' }]
      const mockProps = [{ id: 'p1', slug: 'alpha' }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockPortfolio)
        .mockResolvedValueOnce(mockTx)
        .mockResolvedValueOnce(mockProps)

      const result = await dashboardBff.getInvestorDashboard()

      expect(apiGet).toHaveBeenCalledWith('/users/me')
      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/summary')
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
      const mockListings = [
        { id: 'l1', title: 'P1', status: 'funding', raised_amount: 5000000, target_amount: 10000000, investor_count: 20 },
        { id: 'l2', title: 'P2', status: 'active', raised_amount: 3000000, target_amount: 5000000, investor_count: 10 },
        { id: 'l3', title: 'P3', status: 'closed', raised_amount: 2000000, target_amount: 2000000, investor_count: 5 },
      ]
      const mockBuilderProfile = {
        company_name: 'BuilderX',
        verified: true,
        properties: mockListings,
      }

      vi.mocked(apiGet).mockResolvedValueOnce(mockBuilderProfile)

      const result = await dashboardBff.getBuilderDashboard()

      expect(apiGet).toHaveBeenCalledWith('/properties/builders/me')
      expect(result.builder).toEqual({ company_name: 'BuilderX', verified: true })
      expect(result.listings).toEqual(mockListings)
      expect(result.stats.total_raised).toBe(10000000)
      expect(result.stats.active_count).toBe(2) // funding + active
      expect(result.stats.investor_count).toBe(35)
    })

    it('handles empty listings gracefully', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        company_name: 'EmptyBuilder',
        verified: false,
      })
      const result = await dashboardBff.getBuilderDashboard()
      expect(result.listings).toEqual([])
      expect(result.stats.total_raised).toBe(0)
      expect(result.stats.active_count).toBe(0)
      expect(result.stats.investor_count).toBe(0)
    })
  })
})
