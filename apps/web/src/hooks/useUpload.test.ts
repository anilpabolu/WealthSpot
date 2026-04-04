/**
 * web useUpload hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPost = vi.fn()
vi.mock('@/lib/api', () => ({
  api: { post: mockPost },
}))

describe('web useUpload – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Opportunity media upload', () => {
    it('posts FormData to opportunity media endpoint', async () => {
      mockPost.mockResolvedValueOnce({
        data: [{ id: 'm1', mediaType: 'image', url: 'https://cdn.example.com/img.jpg', filename: 'upload.jpg', sizeBytes: 20000, isCover: false }],
      })

      const { api } = await import('@/lib/api')
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

    it('sets is_cover=true flag for cover images', async () => {
      mockPost.mockResolvedValueOnce({ data: [{ id: 'm2', isCover: true }] })

      const { api } = await import('@/lib/api')
      await api.post('/uploads/opportunity/opp1/media?is_cover=true', new FormData(), { headers: { 'Content-Type': 'multipart/form-data' } })

      expect(mockPost).toHaveBeenCalledWith(
        '/uploads/opportunity/opp1/media?is_cover=true',
        expect.any(FormData),
        expect.any(Object)
      )
    })
  })

  describe('Company logo upload', () => {
    it('posts FormData to company logo endpoint', async () => {
      mockPost.mockResolvedValueOnce({ data: { url: 'https://cdn.example.com/logo.png' } })

      const { api } = await import('@/lib/api')
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
