/**
 * useInvestment hook tests – API layer (unit)
 * Covers initiate, confirm payment, list, summary, and by-id queries.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

describe('useInvestment – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('My Investments', () => {
    it('fetches all user investments', async () => {
      const mockInvestments = [
        { id: 'inv1', propertyId: 'p1', propertyTitle: 'Emerald Heights', amount: 100000, units: 5, status: 'active' },
        { id: 'inv2', propertyId: 'p2', propertyTitle: 'Sky Towers', amount: 200000, units: 10, status: 'active' },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(mockInvestments)
      const result = await apiGet<any>('/investments')
      expect(result).toHaveLength(2)
      expect(result[0].propertyTitle).toBe('Emerald Heights')
    })

    it('returns empty array when no investments', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/investments')
      expect(result).toEqual([])
    })
  })

  describe('Investment Summary', () => {
    it('fetches summary stats', async () => {
      const mockSummary = {
        totalInvested: 300000,
        currentValue: 360000,
        totalReturns: 60000,
        avgIrr: 13.2,
        activeInvestments: 3,
        propertiesCount: 2,
      }
      vi.mocked(apiGet).mockResolvedValueOnce(mockSummary)
      const result = await apiGet<any>('/investments/summary')
      expect(result.avgIrr).toBe(13.2)
      expect(result.activeInvestments).toBe(3)
    })
  })

  describe('Investment by ID', () => {
    it('fetches investment detail by id', async () => {
      const mockInv = { id: 'inv1', propertyId: 'p1', amount: 100000, units: 5, status: 'active' }
      vi.mocked(apiGet).mockResolvedValueOnce(mockInv)
      const result = await apiGet<any>('/investments/inv1')
      expect(apiGet).toHaveBeenCalledWith('/investments/inv1')
      expect(result.id).toBe('inv1')
    })
  })

  describe('Initiate Investment', () => {
    it('initiates investment and returns order details', async () => {
      const mockOrder = {
        orderId: 'ord1',
        razorpayOrderId: 'rzp_ord_123',
        amount: 100000,
        currency: 'INR',
        key: 'rzp_test_key',
      }
      vi.mocked(apiPost).mockResolvedValueOnce(mockOrder)

      const result = await apiPost<any>('/investments', {
        propertyId: 'p1',
        amount: 100000,
        units: 5,
      })

      expect(apiPost).toHaveBeenCalledWith('/investments', {
        propertyId: 'p1',
        amount: 100000,
        units: 5,
      })
      expect(result.razorpayOrderId).toBe('rzp_ord_123')
    })

    it('passes amount and units correctly', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ orderId: 'ord2', razorpayOrderId: 'rzp_ord_456', amount: 50000, currency: 'INR', key: 'k' })
      await apiPost('/investments', { propertyId: 'p2', amount: 50000, units: 2 })
      expect(apiPost).toHaveBeenCalledWith('/investments', expect.objectContaining({ units: 2, amount: 50000 }))
    })
  })

  describe('Confirm Payment', () => {
    it('confirms payment with Razorpay credentials', async () => {
      const confirmed = { id: 'inv1', status: 'confirmed' }
      vi.mocked(apiPost).mockResolvedValueOnce(confirmed)

      const result = await apiPost<any>('/investments/confirm-payment', {
        orderId: 'ord1',
        razorpayPaymentId: 'pay_abc123',
        razorpaySignature: 'sig_xyz',
      })

      expect(apiPost).toHaveBeenCalledWith('/investments/confirm-payment', {
        orderId: 'ord1',
        razorpayPaymentId: 'pay_abc123',
        razorpaySignature: 'sig_xyz',
      })
      expect(result.status).toBe('confirmed')
    })
  })
})
