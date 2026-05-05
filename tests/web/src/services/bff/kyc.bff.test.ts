import { beforeEach, describe, expect, it, vi } from 'vitest'
import { kycBff } from '@/services/bff/kyc.bff'
import { apiGet, apiPost } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

// Mock fetch for S3 upload
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('kycBff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getKycStatus', () => {
    it('aggregates profile and documents, computes step progress', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kycStatus: 'IN_PROGRESS' }) // /auth/me
        .mockResolvedValueOnce([
          { id: 'd1', documentType: 'PAN', verificationStatus: 'VERIFIED' },
          { id: 'd2', documentType: 'AADHAAR', verificationStatus: 'PENDING' },
        ]) // /kyc/documents

      const result = await kycBff.getKycStatus()

      expect(result.kycStatus).toBe('IN_PROGRESS')
      expect(result.steps.panUploaded).toBe(true)
      expect(result.steps.panVerified).toBe(true)
      expect(result.steps.aadhaarUploaded).toBe(true)
      expect(result.steps.aadhaarVerified).toBe(false)
      expect(result.steps.selfieUploaded).toBe(false)
      expect(result.steps.selfieVerified).toBe(false)
      // 3 of 6 steps complete: panUploaded, panVerified, aadhaarUploaded
      expect(result.progressPercentage).toBe(50)
    })

    it('returns 0% progress when no documents', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kycStatus: 'NOT_STARTED' })
        .mockResolvedValueOnce([])

      const result = await kycBff.getKycStatus()

      expect(result.progressPercentage).toBe(0)
      expect(result.steps.panUploaded).toBe(false)
    })

    it('returns 100% when all verified', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kycStatus: 'APPROVED' })
        .mockResolvedValueOnce([
          { id: 'd1', documentType: 'PAN', verificationStatus: 'VERIFIED' },
          { id: 'd2', documentType: 'AADHAAR', verificationStatus: 'VERIFIED' },
          { id: 'd3', documentType: 'SELFIE', verificationStatus: 'VERIFIED' },
        ])

      const result = await kycBff.getKycStatus()
      expect(result.progressPercentage).toBe(100)
    })
  })

  describe('uploadDocument', () => {
    it('gets presigned URL, uploads to S3, then notifies backend', async () => {
      vi.mocked(apiPost)
        .mockResolvedValueOnce({ uploadUrl: 'https://s3.example.com/upload', fileKey: 'kyc/pan.jpg' })
        .mockResolvedValueOnce({ documentId: 'doc-123' })

      mockFetch.mockResolvedValueOnce({ ok: true })

      const file = new File(['data'], 'pan.jpg', { type: 'image/jpeg' })
      const result = await kycBff.uploadDocument('PAN', file)

      // Step 1: Get presigned URL
      expect(apiPost).toHaveBeenNthCalledWith(1, '/kyc/upload-url', {
        document_type: 'PAN',
        content_type: 'image/jpeg',
        filename: 'pan.jpg',
      })

      // Step 2: Upload to S3
      expect(mockFetch).toHaveBeenCalledWith('https://s3.example.com/upload', {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
      })

      // Step 3: Notify backend
      expect(apiPost).toHaveBeenNthCalledWith(2, '/kyc/documents', {
        document_type: 'PAN',
        file_key: 'kyc/pan.jpg',
      })

      expect(result.documentId).toBe('doc-123')
    })
  })
})
