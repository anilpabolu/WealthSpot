import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mobileMarketplaceBff } from '@/services/bff/marketplace.bff'
import { apiGet } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

describe('mobile marketplaceBff functional tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps filters and listing response', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      items: [{ id: '1', slug: 'alpha', title: 'Alpha' }],
      total: 1,
      page: 2,
      totalPages: 4,
    } as any)

    const result = await mobileMarketplaceBff.getListings({ city: 'Pune', page: 2, pageSize: 10 })

    expect(apiGet).toHaveBeenCalledWith('/properties', {
      params: { city: 'Pune', page: 2, page_size: 10 },
    })
    expect(result.total).toBe(1)
    expect(result.page).toBe(2)
    expect(result.totalPages).toBe(4)
  })

  it('combines property detail with similar properties', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        id: '1',
        slug: 'alpha',
        title: 'Alpha',
        builder: { companyName: 'BuilderX', verified: true, logoUrl: null, reraNumber: null },
      } as any)
      .mockResolvedValueOnce([{ id: '2', slug: 'beta', title: 'Beta' }] as any)

    const result = await mobileMarketplaceBff.getPropertyDetail('alpha')

    expect(apiGet).toHaveBeenNthCalledWith(1, '/properties/alpha')
    expect(apiGet).toHaveBeenNthCalledWith(2, '/properties/alpha/similar', { params: { limit: 3 } })
    expect(result.builder.companyName).toBe('BuilderX')
    expect(result.similarProperties).toHaveLength(1)
  })
})
