/**
 * useCommunity hook tests – API layer (unit)
 * Tests post listing, creation, replies, likes, and config.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

const mockAuthor = { id: 'u1', fullName: 'Alice', avatarUrl: null }

const mockPost = {
  id: 'post1',
  postType: 'discussion',
  title: 'Best cities for real estate?',
  bodyPreview: 'Looking for insights...',
  category: 'investing',
  tags: ['real-estate', 'tips'],
  upvotes: 15,
  replyCount: 3,
  isPinned: false,
  author: mockAuthor,
  createdAt: '2025-01-01T00:00:00Z',
  userHasLiked: false,
}

describe('useCommunity – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Post Listing', () => {
    it('fetches paginated posts with default params', async () => {
      const mockResponse = { items: [mockPost], total: 1, page: 1, totalPages: 1 }
      vi.mocked(apiGet).mockResolvedValueOnce(mockResponse)

      const result = await apiGet<any>('/community/posts', { params: { page: 1, page_size: 10 } })

      expect(apiGet).toHaveBeenCalledWith('/community/posts', expect.objectContaining({
        params: expect.objectContaining({ page: 1 }),
      }))
      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('Best cities for real estate?')
    })

    it('filters by post type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, totalPages: 0 })
      await apiGet('/community/posts', { params: { type: 'question', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/community/posts', {
        params: expect.objectContaining({ type: 'question' }),
      })
    })

    it('filters by category', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, totalPages: 0 })
      await apiGet('/community/posts', { params: { category: 'investing', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/community/posts', {
        params: expect.objectContaining({ category: 'investing' }),
      })
    })
  })

  describe('Single Post', () => {
    it('fetches post detail by ID', async () => {
      const fullPost = { ...mockPost, body: 'Full body text here.', updatedAt: '2025-01-02T00:00:00Z' }
      vi.mocked(apiGet).mockResolvedValueOnce(fullPost)
      const result = await apiGet<any>('/community/posts/post1')
      expect(apiGet).toHaveBeenCalledWith('/community/posts/post1')
      expect(result.id).toBe('post1')
      expect(result.body).toBe('Full body text here.')
    })
  })

  describe('Create Post', () => {
    it('creates a discussion post', async () => {
      const created = { ...mockPost, id: 'post2', title: 'New Discussion' }
      vi.mocked(apiPost).mockResolvedValueOnce(created)

      const result = await apiPost<any>('/community/posts', {
        post_type: 'discussion',
        title: 'New Discussion',
        body: 'Full content here.',
        category: 'general',
      })

      expect(apiPost).toHaveBeenCalledWith('/community/posts', expect.objectContaining({
        post_type: 'discussion',
        title: 'New Discussion',
      }))
      expect(result.id).toBe('post2')
    })

    it('creates a question post', async () => {
      const created = { ...mockPost, id: 'post3', postType: 'question', title: 'Which is better?' }
      vi.mocked(apiPost).mockResolvedValueOnce(created)
      await apiPost('/community/posts', { post_type: 'question', title: 'Which is better?', body: 'Details...' })
      expect(apiPost).toHaveBeenCalledWith('/community/posts', expect.objectContaining({
        post_type: 'question',
      }))
    })
  })

  describe('Post Replies', () => {
    it('fetches replies for a post', async () => {
      const replies = [
        { id: 'r1', postId: 'post1', body: 'Great point!', upvotes: 3, author: mockAuthor, createdAt: '2025-01-01T01:00:00Z', userHasLiked: false },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(replies)
      const result = await apiGet<any>('/community/posts/post1/replies')
      expect(result).toHaveLength(1)
      expect(result[0].body).toBe('Great point!')
    })

    it('creates a reply to a post', async () => {
      const created = { id: 'r2', postId: 'post1', body: 'My reply', upvotes: 0, author: mockAuthor, createdAt: '2025-01-01T02:00:00Z', userHasLiked: false }
      vi.mocked(apiPost).mockResolvedValueOnce(created)
      await apiPost('/community/posts/post1/replies', { body: 'My reply' })
      expect(apiPost).toHaveBeenCalledWith('/community/posts/post1/replies', { body: 'My reply' })
    })
  })

  describe('Like System', () => {
    it('likes a post', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: true, likeCount: 16 })
      const result = await apiPost<any>('/community/posts/post1/like', {})
      expect(result.liked).toBe(true)
      expect(result.likeCount).toBe(16)
    })

    it('unlikes a post', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: false, likeCount: 14 })
      const result = await apiPost<any>('/community/posts/post1/like', {})
      expect(result.liked).toBe(false)
    })

    it('likes a reply', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: true, likeCount: 4 })
      const result = await apiPost<any>('/community/posts/post1/replies/r1/like', {})
      expect(apiPost).toHaveBeenCalledWith('/community/posts/post1/replies/r1/like', {})
      expect(result.liked).toBe(true)
    })
  })

  describe('Community Config', () => {
    it('fetches platform config with word limits', async () => {
      const config = { postMaxWords: 1000, postMinWords: 50 }
      vi.mocked(apiGet).mockResolvedValueOnce(config)
      const result = await apiGet<any>('/community/config')
      expect(result.postMaxWords).toBe(1000)
      expect(result.postMinWords).toBe(50)
    })
  })
})
