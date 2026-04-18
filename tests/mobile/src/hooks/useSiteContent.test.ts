/**
 * mobile useSiteContent hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

const makeContent = (tag: string, value: string) => ({
  id: `sc-${tag}`,
  page: 'home',
  sectionTag: tag,
  contentType: 'text',
  value,
  description: null,
  isActive: true,
})

describe('mobile useSiteContent – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches page content by page name', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([
      makeContent('hero_title', 'Welcome to WealthSpot'),
      makeContent('hero_subtitle', 'Invest smarter'),
    ])

    const result = await apiGet<any[]>('/site-content/page/home')
    expect(apiGet).toHaveBeenCalledWith('/site-content/page/home')
    expect(result).toHaveLength(2)
    expect(result[0].sectionTag).toBe('hero_title')
  })

  it('returns empty list for page with no content', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([])

    const result = await apiGet<any[]>('/site-content/page/about')
    expect(result).toEqual([])
  })

  it('content values contain CMS-driven text', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([makeContent('cta_label', 'Start Investing')])

    const result = await apiGet<any[]>('/site-content/page/home')
    expect(result[0].value).toBe('Start Investing')
  })
})
