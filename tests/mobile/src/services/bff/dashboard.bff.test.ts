/**
 * mobile dashboardBff tests – functional
 * Tests the BFF aggregation logic for the mobile dashboard.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'
import { mobileDashboardBff } from '@/services/bff/dashboard.bff'

const mockUser = { id: 'u1', fullName: 'Alice Sharma', email: 'alice@example.com', avatarUrl: null, role: 'investor', kycStatus: 'approved', wealthPassActive: true }
const mockPortfolio = { totalInvested: 500000, currentValue: 560000, totalReturns: 60000, monthlyRentalIncome: 5000, propertiesCount: 3 }
const mockTransactions = [{ id: 't1', type: 'investment', amount: 100000, description: null, createdAt: '2025-01-01T00:00:00Z' }]
const mockProperties = [{ id: 'p1', slug: 'emerald', title: 'Emerald Heights', coverImage: null, city: 'Mumbai', targetIrr: 14, fundingPercentage: 65, status: 'funding' }]

describe('mobile dashboardBff functional tests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches dashboard data in parallel and assembles view', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(mockPortfolio)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce(mockProperties)

    const result = await mobileDashboardBff.getDashboard()

    expect(apiGet).toHaveBeenCalledTimes(4)
    expect(apiGet).toHaveBeenCalledWith('/auth/me')
    expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/summary')
    expect(apiGet).toHaveBeenCalledWith('/investments/transactions', { params: { limit: 5, sort: '-created_at' } })
    expect(apiGet).toHaveBeenCalledWith('/properties', { params: { status: 'funding', page_size: 3, sort: '-launch_date' } })

    expect(result.user).toEqual(mockUser)
    expect(result.portfolio.totalInvested).toBe(500000)
    expect(result.recentTransactions).toHaveLength(1)
    expect(result.activeProperties[0].slug).toBe('emerald')
  })

  it('generates a personalised greeting for the user', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ ...mockUser, fullName: 'Rahul Gupta' })
      .mockResolvedValueOnce(mockPortfolio)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce(mockProperties)

    const result = await mobileDashboardBff.getDashboard()

    // greeting must contain first name
    expect(result.greeting).toContain('Rahul')
    // greeting must start with Good
    expect(result.greeting).toMatch(/^Good (Morning|Afternoon|Evening),/)
  })

  it('handles empty transactions and properties gracefully', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({ ...mockPortfolio, propertiesCount: 0 })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const result = await mobileDashboardBff.getDashboard()

    expect(result.recentTransactions).toEqual([])
    expect(result.activeProperties).toEqual([])
  })
})
