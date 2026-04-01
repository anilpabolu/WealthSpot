import { beforeEach, describe, expect, it, vi } from 'vitest'
import { kycBff } from './kyc.bff'
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
        .mockResolvedValueOnce({ kyc_status: 'IN_PROGRESS' }) // /users/me
        .mockResolvedValueOnce([
          { id: 'd1', document_type: 'PAN', verification_status: 'VERIFIED' },
          { id: 'd2', document_type: 'AADHAAR', verification_status: 'PENDING' },
        ]) // /kyc/documents

      const result = await kycBff.getKycStatus()

      expect(result.kyc_status).toBe('IN_PROGRESS')
      expect(result.steps.pan_uploaded).toBe(true)
      expect(result.steps.pan_verified).toBe(true)
      expect(result.steps.aadhaar_uploaded).toBe(true)
      expect(result.steps.aadhaar_verified).toBe(false)
      expect(result.steps.selfie_uploaded).toBe(false)
      expect(result.steps.selfie_verified).toBe(false)
      // 3 of 6 steps complete: pan_uploaded, pan_verified, aadhaar_uploaded
      expect(result.progress_percentage).toBe(50)
    })

    it('returns 0% progress when no documents', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kyc_status: 'NOT_STARTED' })
        .mockResolvedValueOnce([])

      const result = await kycBff.getKycStatus()

      expect(result.progress_percentage).toBe(0)
      expect(result.steps.pan_uploaded).toBe(false)
    })

    it('returns 100% when all verified', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce({ kyc_status: 'APPROVED' })
        .mockResolvedValueOnce([
          { id: 'd1', document_type: 'PAN', verification_status: 'VERIFIED' },
          { id: 'd2', document_type: 'AADHAAR', verification_status: 'VERIFIED' },
          { id: 'd3', document_type: 'SELFIE', verification_status: 'VERIFIED' },
        ])

      const result = await kycBff.getKycStatus()
      expect(result.progress_percentage).toBe(100)
    })
  })

  describe('uploadDocument', () => {
    it('gets presigned URL, uploads to S3, then notifies backend', async () => {
      vi.mocked(apiPost)
        .mockResolvedValueOnce({ upload_url: 'https://s3.example.com/upload', file_key: 'kyc/pan.jpg' })
        .mockResolvedValueOnce({ document_id: 'doc-123' })

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

      expect(result.document_id).toBe('doc-123')
    })
  })
})
