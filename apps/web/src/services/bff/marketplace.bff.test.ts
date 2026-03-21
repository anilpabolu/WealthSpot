import { beforeEach, describe, expect, it, vi } from 'vitest'
import { marketplaceBff } from './marketplace.bff'
import { apiGet } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

describe('web marketplaceBff functional tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps listing response into MarketplaceView', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      items: [{ id: '1', slug: 'alpha', title: 'Alpha' }],
      total: 1,
      page: 1,
      total_pages: 1,
    } as any)

    const result = await marketplaceBff.getListings({ city: 'Bengaluru' })

    expect(apiGet).toHaveBeenCalledWith('/properties', { params: { city: 'Bengaluru' } })
    expect(result.properties).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
  })

  it('aggregates property detail and similar properties', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        id: '1',
        slug: 'alpha',
        title: 'Alpha',
        builder: { company_name: 'BuilderX', verified: true, logo_url: null, rera_number: null },
      } as any)
      .mockResolvedValueOnce([{ id: '2', slug: 'beta', title: 'Beta' }] as any)

    const result = await marketplaceBff.getPropertyDetail('alpha')

    expect(apiGet).toHaveBeenNthCalledWith(1, '/properties/alpha')
    expect(apiGet).toHaveBeenNthCalledWith(2, '/properties/alpha/similar', { params: { limit: 3 } })
    expect(result.builder.company_name).toBe('BuilderX')
    expect(result.similarProperties).toHaveLength(1)
  })
})
