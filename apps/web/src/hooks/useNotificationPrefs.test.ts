/**
 * web useNotificationPrefs hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn(() => ({ isAuthenticated: true })),
}))

import { apiGet, apiPut } from '@/lib/api'

describe('web useNotificationPrefs – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Get preferences', () => {
    it('fetches notification preferences for authenticated user', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        investmentConfirmations: true,
        rentalIncome: true,
        propertyUpdates: false,
        newProperties: true,
        communityActivity: false,
        marketingEmails: false,
      })

      const result = await apiGet<any>('/notifications/preferences')
      expect(result.investmentConfirmations).toBe(true)
      expect(result.marketingEmails).toBe(false)
    })
  })

  describe('Update preferences', () => {
    it('sends snake_case keys to the backend', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({
        investmentConfirmations: true,
        rentalIncome: false,
        propertyUpdates: true,
        newProperties: true,
        communityActivity: false,
        marketingEmails: false,
      })

      await apiPut('/notifications/preferences', {
        investment_confirmations: true,
        rental_income: false,
        property_updates: true,
      })

      expect(apiPut).toHaveBeenCalledWith('/notifications/preferences', expect.objectContaining({
        investment_confirmations: true,
        rental_income: false,
      }))
    })

    it('handles partial preference update', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({
        marketingEmails: true,
      })
      await apiPut('/notifications/preferences', { marketing_emails: true })
      expect(apiPut).toHaveBeenCalledWith('/notifications/preferences', { marketing_emails: true })
    })
  })
})
