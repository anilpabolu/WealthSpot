/**
 * mobile useBuilderUpdates hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '../lib/api'

const makeUpdate = (id: string) => ({
  id,
  opportunityId: 'opp-1',
  creator: { id: 'builder-1', fullName: 'Bob Builder', avatarUrl: null },
  title: `Update ${id}`,
  description: 'Progress report',
  attachments: [],
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
})

describe('mobile useBuilderUpdates – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches updates for an opportunity', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([makeUpdate('u-1'), makeUpdate('u-2')])

    const result = await apiGet<any[]>('/builder-updates/opportunities/opp-1')
    expect(apiGet).toHaveBeenCalledWith('/builder-updates/opportunities/opp-1')
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Update u-1')
  })

  it('returns empty list when no updates exist', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([])

    const result = await apiGet<any[]>('/builder-updates/opportunities/opp-1')
    expect(result).toEqual([])
  })

  it('includes attachments when present', async () => {
    const update = {
      ...makeUpdate('u-3'),
      attachments: [
        { id: 'att-1', filename: 'photo.jpg', url: 'https://cdn.example.com/photo.jpg', contentType: 'image/jpeg', sizeBytes: 512000, createdAt: '2024-06-01T00:00:00Z' },
      ],
    }
    vi.mocked(apiGet).mockResolvedValueOnce([update])

    const result = await apiGet<any[]>('/builder-updates/opportunities/opp-1')
    expect(result[0].attachments).toHaveLength(1)
    expect(result[0].attachments[0].filename).toBe('photo.jpg')
  })
})
