import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

describe('mobile useEOI – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Builder Questions', () => {
    it('fetches questions for an opportunity', async () => {
      const questions = [
        { id: 'q1', questionText: 'What is your budget?', questionType: 'text', isRequired: true },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(questions)
      const result = await apiGet('/eoi/questions/opp-1') as Record<string, unknown>[]
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('questionText')
    })

    it('returns empty array when no questions configured', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/eoi/questions/opp-2')
      expect(result).toHaveLength(0)
    })
  })

  describe('Submit EOI', () => {
    it('submits EOI with investment details', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'eoi-m1', status: 'submitted' })
      const result = await apiPost('/eoi', {
        opportunity_id: 'opp-1',
        investment_amount: 250000,
        num_units: 1,
        communication_consent: true,
        answers: [],
      })
      expect(result).toHaveProperty('status', 'submitted')
    })

    it('submits EOI with answers to builder questions', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'eoi-m2', status: 'submitted' })
      const result = await apiPost('/eoi', {
        opportunity_id: 'opp-1',
        investment_amount: 500000,
        answers: [
          { question_id: 'q1', answer_text: '5-10 lakhs' },
        ],
      })
      expect(result).toHaveProperty('id', 'eoi-m2')
    })
  })

  describe('My EOIs', () => {
    it('fetches user EOIs', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [{ id: 'eoi-m1', status: 'submitted' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
      const result = await apiGet('/eoi', { params: { page: 1 } }) as { items: unknown[] }
      expect(result.items).toHaveLength(1)
    })

    it('filters EOIs by opportunity', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      })
      await apiGet('/eoi', { params: { opportunity_id: 'opp-1', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/eoi', {
        params: { opportunity_id: 'opp-1', page: 1 },
      })
    })
  })

  describe('Connect with Builder', () => {
    it('connects EOI with builder', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'eoi-m1', status: 'builder_connected' })
      const result = await apiPost('/eoi/eoi-m1/connect', {})
      expect(result).toHaveProperty('status', 'builder_connected')
    })
  })
})
