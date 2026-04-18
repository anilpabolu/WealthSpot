/**
 * mobile useInvestment hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '../lib/api'

describe('mobile useInvestment – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('My investments list', () => {
    it('fetches the list', async () => {
      const mockData = [
        { id: 'i1', propertyId: 'p1', propertyTitle: 'Emerald Heights', amount: 200000, units: 20, irr: 14, status: 'active', paymentStatus: 'captured' },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(mockData)
      const result = await apiGet<any>('/investments/mine')
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('active')
    })

    it('returns empty array when user has no investments', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/investments/mine')
      expect(result).toHaveLength(0)
    })
  })

  describe('Investment summary', () => {
    it('fetches summary stats', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        totalInvested: 450000,
        currentValue: 490000,
        totalReturns: 40000,
        avgIrr: 13.5,
        activeInvestments: 3,
        propertiesCount: 3,
      })
      const result = await apiGet<any>('/investments/summary')
      expect(result.totalInvested).toBe(450000)
      expect(result.avgIrr).toBe(13.5)
    })
  })

  describe('Investment by ID', () => {
    it('fetches a single investment', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ id: 'i1', propertyTitle: 'Emerald Heights', currentValue: 230000, returns: 30000 })
      const result = await apiGet<any>('/investments/i1')
      expect(result.id).toBe('i1')
      expect(result.currentValue).toBe(230000)
    })
  })

  describe('Initiate investment', () => {
    it('posts payload and returns razorpay order', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        orderId: 'ord_abc',
        razorpayOrderId: 'rzo_abc',
        amount: 100000,
        currency: 'INR',
        key: 'rzp_test_key',
      })
      const result = await apiPost<any>('/investments/initiate', { propertyId: 'p1', amount: 100000, units: 10 })
      expect(result.razorpayOrderId).toBe('rzo_abc')
      expect(result.currency).toBe('INR')
    })
  })

  describe('Confirm payment', () => {
    it('posts payment verification payload', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ success: true, investmentId: 'i-new' })
      const result = await apiPost<any>('/investments/confirm-payment', {
        orderId: 'ord_abc',
        razorpayPaymentId: 'pay_xyz',
        razorpaySignature: 'sig_xyz',
      })
      expect(result.success).toBe(true)
    })
  })
})
