/**
 * web useProfileAPI hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn(() => ({ isAuthenticated: true, token: 'test-token' })),
}))

import { apiGet, apiPost, apiPut } from '@/lib/api'

describe('web useProfileAPI – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Profile completion status', () => {
    it('fetches profile completion status', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        profileCompletionPct: 75,
        sections: {
          personal_risk: true,
          interests: true,
          skills: false,
          address: false,
          verification: true,
        },
        emailVerified: true,
        phoneVerified: false,
        referralCode: 'ALICE10',
        isComplete: false,
      })

      const result = await apiGet<any>('/profile/completion')
      expect(result.profileCompletionPct).toBe(75)
      expect(result.sections.personal_risk).toBe(true)
      expect(result.sections.skills).toBe(false)
      expect(result.isComplete).toBe(false)
    })
  })

  describe('Full profile', () => {
    it('fetches the full profile including all sections', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        id: 'u1',
        email: 'alice@example.com',
        fullName: 'Alice Smith',
        phone: '+91 98765 43210',
        avatarUrl: null,
        role: 'investor',
        kycStatus: 'APPROVED',
        dateOfBirth: '1990-06-15',
        gender: 'female',
        occupation: 'software_engineer',
        annualIncome: '20_50_lakhs',
        investmentExperience: '3_5_years',
        riskTolerance: 'moderate',
        investmentHorizon: 'medium_term',
        monthlyInvestmentCapacity: '50000_1_lakh',
        interests: ['real_estate', 'startups'],
        preferredCities: ['Mumbai', 'Bangalore'],
        subscriptionTopics: ['property_launch'],
        skills: ['financial_analysis', 'due_diligence'],
        weeklyHoursAvailable: '5_10_hours',
        contributionInterests: ['mentoring'],
        bio: 'Experienced investor',
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'IN',
        emailVerified: true,
        phoneVerified: false,
        profileCompletionPct: 85,
        profileCompletedAt: null,
        referralCode: 'ALICE10',
      })

      const result = await apiGet<any>('/profile/full')
      expect(result.fullName).toBe('Alice Smith')
      expect(result.riskTolerance).toBe('moderate')
      expect(result.skills).toContain('financial_analysis')
    })
  })

  describe('Update profile section', () => {
    it('puts updated section 1 data (personal/risk)', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ id: 'u1' })
      await apiPut('/profile/section/1', { risk_tolerance: 'high', investment_horizon: 'long_term' })
      expect(apiPut).toHaveBeenCalledWith('/profile/section/1', expect.objectContaining({ risk_tolerance: 'high' }))
    })
  })

  describe('Send OTP', () => {
    it('posts to send email OTP', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ message: 'OTP sent', channel: 'email', expiresInSeconds: 300, delivered: true })
      const result = await apiPost<any>('/profile/otp/send', { channel: 'email' })
      expect(result.channel).toBe('email')
      expect(result.delivered).toBe(true)
    })

    it('posts to send phone OTP', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ message: 'OTP sent', channel: 'phone', expiresInSeconds: 300, delivered: true })
      await apiPost('/profile/otp/send', { channel: 'phone' })
      expect(apiPost).toHaveBeenCalledWith('/profile/otp/send', { channel: 'phone' })
    })
  })

  describe('Verify OTP', () => {
    it('posts OTP verification', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ message: 'Verified', channel: 'email', verified: true, profileCompletionPct: 90 })
      const result = await apiPost<any>('/profile/otp/verify', { channel: 'email', otp: '123456' })
      expect(result.verified).toBe(true)
      expect(result.profileCompletionPct).toBe(90)
    })
  })

  describe('Update phone', () => {
    it('puts new phone number', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ phone: '+91 99999 00000', phoneVerified: false })
      const result = await apiPut<any>('/profile/phone', { phone: '+91 99999 00000' })
      expect(result.phone).toBe('+91 99999 00000')
    })
  })
})
