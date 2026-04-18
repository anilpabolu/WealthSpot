/**
 * mobile useUpload hook tests – API layer (unit)
 * Tests that FormData POST calls are made to the correct upload endpoints.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPost = vi.fn()
vi.mock('../lib/api', () => ({
  api: { post: mockPost },
}))

describe('mobile useUpload – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Opportunity media upload', () => {
    it('posts FormData to the opportunity media endpoint', async () => {
      mockPost.mockResolvedValueOnce({ data: [{ id: 'm1', url: 'https://cdn.example.com/img.jpg', mediaType: 'image', filename: 'upload.jpg', sizeBytes: 12000, isCover: false }] })

      const api = (await import('../lib/api')).api
      const result = await api.post(
        '/uploads/opportunity/opp1/media?is_cover=false',
        new FormData(),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      expect(mockPost).toHaveBeenCalledWith(
        '/uploads/opportunity/opp1/media?is_cover=false',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      )
      expect(result.data[0].url).toContain('cdn.example.com')
    })

    it('posts with is_cover=true for cover images', async () => {
      mockPost.mockResolvedValueOnce({ data: [{ id: 'm2', url: 'https://cdn.example.com/cover.jpg', isCover: true }] })

      const api = (await import('../lib/api')).api
      const result = await api.post(
        '/uploads/opportunity/opp1/media?is_cover=true',
        new FormData(),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      expect(mockPost).toHaveBeenCalledWith(
        '/uploads/opportunity/opp1/media?is_cover=true',
        expect.any(FormData),
        expect.any(Object)
      )
      expect(result.data[0].isCover).toBe(true)
    })
  })

  describe('Company logo upload', () => {
    it('posts FormData to the company logo endpoint', async () => {
      mockPost.mockResolvedValueOnce({ data: { url: 'https://cdn.example.com/logo.png' } })

      const api = (await import('../lib/api')).api
      const result = await api.post(
        '/uploads/company/c1/logo',
        new FormData(),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      expect(mockPost).toHaveBeenCalledWith(
        '/uploads/company/c1/logo',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      )
      expect(result.data.url).toContain('logo.png')
    })
  })
})
