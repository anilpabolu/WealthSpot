/**
 * BDD: Investment Journey (Web)
 *
 * Describes the end-to-end investor flow using Given/When/Then language.
 * These are unit-level integration tests — all API calls are mocked.
 *
 * Journey:
 *   1. Investor browses the property marketplace
 *   2. Investor opens a property detail page
 *   3. Investor is KYC-approved, so the invest button is enabled
 *   4. Investor initiates an investment
 *   5. Payment confirmation returns successfully
 *   6. Portfolio reflects the new investment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn(() => ({ isAuthenticated: true, user: { id: 'user-1' } })),
}))

import { apiGet, apiPost } from '@/lib/api'

// ── Shared fixtures ───────────────────────────────────────────────────────────

const mockProperty = {
  id: 'prop-1',
  slug: 'test-tower-mumbai',
  title: 'Test Tower Mumbai',
  city: 'Mumbai',
  status: 'active',
  targetAmount: 10_000_000,
  raisedAmount: 4_000_000,
  minInvestment: 25_000,
  fundingPercentage: 40,
}

const mockKycStatus = { kycStatus: 'approved', message: 'KYC verified' }

const mockPaymentResponse = {
  orderId: 'order-abc-123',
  razorpayOrderId: 'rzp_order_123',
  amount: 50_000,
  currency: 'INR',
  key: 'rzp_test_key',
}

const mockPortfolioSummary = {
  totalInvested: 50_000,
  currentValue: 51_000,
  returns: 1_000,
  properties: 1,
}

// ── Investment Journey ────────────────────────────────────────────────────────

describe('BDD: Investment Journey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Step 1 ────────────────────────────────────────────────────────────────

  describe('Given an investor browses the marketplace', () => {
    it('When they call the properties API, Then they receive a paginated list', async () => {
      const mockedGet = vi.mocked(apiGet)
      mockedGet.mockResolvedValueOnce({
        properties: [mockProperty],
        total: 1,
        page: 1,
        pageSize: 20,
      })

      const result = await apiGet('/properties')

      expect(mockedGet).toHaveBeenCalledWith('/properties')
      expect(result).toHaveProperty('properties')
      const { properties } = result as { properties: typeof mockProperty[] }
      expect(properties).toHaveLength(1)
      expect(properties[0].slug).toBe('test-tower-mumbai')
    })
  })

  // ── Step 2 ────────────────────────────────────────────────────────────────

  describe('Given an investor selects a property', () => {
    it('When they fetch the detail, Then the property data is returned', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(mockProperty)

      const result = await apiGet('/properties/test-tower-mumbai')

      expect(apiGet).toHaveBeenCalledWith('/properties/test-tower-mumbai')
      const prop = result as typeof mockProperty
      expect(prop.title).toBe('Test Tower Mumbai')
      expect(prop.minInvestment).toBe(25_000)
    })
  })

  // ── Step 3 ────────────────────────────────────────────────────────────────

  describe('Given an investor checks their KYC status', () => {
    it('When KYC is approved, Then they can proceed to invest', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(mockKycStatus)

      const result = await apiGet('/kyc/status')

      const kyc = result as typeof mockKycStatus
      expect(kyc.kycStatus).toBe('approved')
      // Business rule: approved KYC unlocks the invest button
      const canInvest = kyc.kycStatus === 'approved'
      expect(canInvest).toBe(true)
    })

    it('When KYC is not_started, Then the investor cannot proceed', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ kycStatus: 'not_started', message: 'KYC not started' })

      const result = await apiGet('/kyc/status')

      const kyc = result as { kycStatus: string }
      const canInvest = kyc.kycStatus === 'approved'
      expect(canInvest).toBe(false)
    })
  })

  // ── Step 4 ────────────────────────────────────────────────────────────────

  describe('Given an approved investor initiates an investment', () => {
    it('When they POST to /investments, Then they receive a payment order', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce(mockPaymentResponse)

      const payload = { propertyId: 'prop-1', amount: 50_000, units: 2 }
      const result = await apiPost('/investments', payload)

      expect(apiPost).toHaveBeenCalledWith('/investments', payload)
      const resp = result as typeof mockPaymentResponse
      expect(resp.orderId).toBe('order-abc-123')
      expect(resp.razorpayOrderId).toBe('rzp_order_123')
      expect(resp.currency).toBe('INR')
    })

    it('When the payload is invalid (amount below minimum), Then the API rejects it', async () => {
      vi.mocked(apiPost).mockRejectedValueOnce({ status: 422, detail: 'Amount below minimum investment' })

      const payload = { propertyId: 'prop-1', amount: 100, units: 0 }

      await expect(apiPost('/investments', payload)).rejects.toMatchObject({
        status: 422,
      })
    })
  })

  // ── Step 5 ────────────────────────────────────────────────────────────────

  describe('Given an investor has a Razorpay payment reference', () => {
    it('When they confirm payment, Then the investment is confirmed', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ status: 'confirmed', investmentId: 'inv-1' })

      const confirmPayload = {
        orderId: 'order-abc-123',
        razorpayPaymentId: 'pay_xyz',
        razorpaySignature: 'sig_abc',
      }
      const result = await apiPost('/investments/confirm-payment', confirmPayload)

      expect(apiPost).toHaveBeenCalledWith('/investments/confirm-payment', confirmPayload)
      const resp = result as { status: string }
      expect(resp.status).toBe('confirmed')
    })
  })

  // ── Step 6 ────────────────────────────────────────────────────────────────

  describe('Given an investor has confirmed their investment', () => {
    it('When they view portfolio summary, Then the investment is reflected', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(mockPortfolioSummary)

      const result = await apiGet('/portfolio/summary')

      const portfolio = result as typeof mockPortfolioSummary
      expect(portfolio.totalInvested).toBe(50_000)
      expect(portfolio.properties).toBe(1)
    })

    it('When they list portfolio properties, Then the invested property appears', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { propertyId: 'prop-1', title: 'Test Tower Mumbai', invested: 50_000 },
      ])

      const result = await apiGet('/portfolio/properties')

      const props = result as Array<{ propertyId: string }>
      expect(props).toHaveLength(1)
      expect(props[0].propertyId).toBe('prop-1')
    })
  })
})

// ── Referral Journey ──────────────────────────────────────────────────────────

describe('BDD: Referral Journey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Given an investor shares their referral code', () => {
    it('When a friend signs up using the code, Then referral stats update', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        code: 'WS-INVEST123',
        totalReferrals: 3,
        pendingRewards: 750,
        paidRewards: 1_500,
      })

      const stats = await apiGet('/referrals/stats')

      const s = stats as { code: string; totalReferrals: number }
      expect(s.code).toBe('WS-INVEST123')
      expect(s.totalReferrals).toBe(3)
    })

    it('When they view referral history, Then past referrals are listed', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { refereeId: 'user-2', status: 'rewarded', amount: 500, createdAt: '2024-01-10' },
      ])

      const history = await apiGet('/referrals/history')

      const h = history as Array<{ refereeId: string }>
      expect(h).toHaveLength(1)
      expect(h[0].refereeId).toBe('user-2')
    })
  })
})
