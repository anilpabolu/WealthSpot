/**
 * mobile kycBff tests – functional
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '../../lib/api'
import { mobileKycBff } from './kyc.bff'

const makeDoc = (type: string, status: string) => ({
  id: `doc-${type}`,
  documentType: type,
  verificationStatus: status,
  rejectionReason: null,
  createdAt: '2025-01-01T00:00:00Z',
})

describe('mobile kycBff functional tests', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getKycStatus', () => {
    it('fetches profile and documents in parallel and builds steps', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kycStatus: 'PENDING' })
        .mockResolvedValueOnce([
          makeDoc('PAN', 'VERIFIED'),
          makeDoc('AADHAAR', 'PENDING'),
        ])

      const result = await mobileKycBff.getKycStatus()

      expect(apiGet).toHaveBeenCalledWith('/auth/me')
      expect(apiGet).toHaveBeenCalledWith('/kyc/documents')

      expect(result.kycStatus).toBe('PENDING')
      expect(result.steps.panUploaded).toBe(true)
      expect(result.steps.panVerified).toBe(true)
      expect(result.steps.aadhaarUploaded).toBe(true)
      expect(result.steps.aadhaarVerified).toBe(false)
      expect(result.steps.selfieUploaded).toBe(false)
    })

    it('calculates progressPercentage as a rounded percent of 6 steps completed', async () => {
      // PAN uploaded+verified, AADHAAR uploaded+verified, SELFIE uploaded+verified = 6/6 = 100%
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kycStatus: 'APPROVED' })
        .mockResolvedValueOnce([
          makeDoc('PAN', 'VERIFIED'),
          makeDoc('AADHAAR', 'VERIFIED'),
          makeDoc('SELFIE', 'VERIFIED'),
        ])

      const result = await mobileKycBff.getKycStatus()
      expect(result.progressPercentage).toBe(100)
    })

    it('returns 0% progress when no documents exist', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kycStatus: 'NOT_STARTED' })
        .mockResolvedValueOnce([])

      const result = await mobileKycBff.getKycStatus()
      expect(result.progressPercentage).toBe(0)
      expect(result.steps.panUploaded).toBe(false)
    })
  })
})
