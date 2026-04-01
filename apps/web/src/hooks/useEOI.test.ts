import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'

describe('useEOI – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Builder Questions', () => {
    it('fetches builder questions for an opportunity', async () => {
      const questions = [
        { id: 'q1', opportunityId: 'opp-1', questionText: 'Investment timeline?', questionType: 'text', isRequired: true, sortOrder: 0 },
        { id: 'q2', opportunityId: 'opp-1', questionText: 'Budget range?', questionType: 'select', isRequired: false, sortOrder: 1, options: { choices: ['1-5L', '5-10L'] } },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(questions)
      const result = await apiGet('/eoi/questions/opp-1')
      expect(apiGet).toHaveBeenCalledWith('/eoi/questions/opp-1')
      expect(result).toHaveLength(2)
    })

    it('creates a builder question with correct snake_case payload', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'q3', questionText: 'New Q', questionType: 'text' })
      const result = await apiPost('/eoi/questions/opp-1', {
        question_text: 'New Q',
        question_type: 'text',
        is_required: true,
        sort_order: 0,
      })
      expect(apiPost).toHaveBeenCalledWith('/eoi/questions/opp-1', expect.objectContaining({
        question_text: 'New Q',
      }))
      expect(result).toHaveProperty('id', 'q3')
    })

    it('updates a builder question', async () => {
      vi.mocked(apiPatch).mockResolvedValueOnce({ id: 'q1', questionText: 'Updated?' })
      await apiPatch('/eoi/questions/opp-1/q1', { question_text: 'Updated?' })
      expect(apiPatch).toHaveBeenCalledWith('/eoi/questions/opp-1/q1', { question_text: 'Updated?' })
    })

    it('deletes a builder question', async () => {
      vi.mocked(apiDelete).mockResolvedValueOnce(undefined)
      await apiDelete('/eoi/questions/opp-1/q1')
      expect(apiDelete).toHaveBeenCalledWith('/eoi/questions/opp-1/q1')
    })
  })

  describe('Submit EOI', () => {
    it('submits EOI with answers in snake_case', async () => {
      const payload = {
        opportunity_id: 'opp-1',
        investment_amount: 500000,
        num_units: 2,
        investment_timeline: '6_months',
        communication_consent: true,
        answers: [
          { question_id: 'q1', answer_text: 'ASAP' },
        ],
      }
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'eoi-1', status: 'submitted' })
      const result = await apiPost('/eoi', payload)
      expect(apiPost).toHaveBeenCalledWith('/eoi', expect.objectContaining({
        opportunity_id: 'opp-1',
        investment_amount: 500000,
      }))
      expect(result).toHaveProperty('status', 'submitted')
    })
  })

  describe('EOI Listing', () => {
    it('fetches paginated EOIs with filters', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [{ id: 'eoi-1' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
      const result = await apiGet('/eoi', {
        params: { opportunity_id: 'opp-1', page: 1 },
      })
      expect(apiGet).toHaveBeenCalledWith('/eoi', expect.objectContaining({
        params: { opportunity_id: 'opp-1', page: 1 },
      }))
      expect(result).toHaveProperty('total', 1)
    })
  })

  describe('Connect with Builder', () => {
    it('posts connect request', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'eoi-1', status: 'builder_connected' })
      const result = await apiPost('/eoi/eoi-1/connect', {})
      expect(result).toHaveProperty('status', 'builder_connected')
    })
  })

  describe('Admin Pipeline', () => {
    it('fetches all EOIs for pipeline view', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'eoi-1', status: 'submitted' },
        { id: 'eoi-2', status: 'deal_in_progress' },
      ])
      const result = await apiGet('/eoi/admin/pipeline', { params: { page_size: 500 } })
      expect(result).toHaveLength(2)
    })

    it('updates EOI status via admin endpoint', async () => {
      vi.mocked(apiPatch).mockResolvedValueOnce({ id: 'eoi-1', status: 'payment_done' })
      const result = await apiPatch('/eoi/admin/eoi-1/status', { new_status: 'payment_done' })
      expect(result).toHaveProperty('status', 'payment_done')
    })
  })

  describe('Communication Mappings', () => {
    it('fetches comm mappings for opportunity', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'cm-1', opportunityId: 'opp-1', userId: 'u1', role: 'builder' },
      ])
      const result = await apiGet('/eoi/comm-mappings/opp-1')
      expect(result).toHaveLength(1)
    })

    it('creates a comm mapping', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'cm-2' })
      await apiPost('/eoi/comm-mappings', {
        opportunity_id: 'opp-1',
        user_id: 'u2',
        role: 'investor',
      })
      expect(apiPost).toHaveBeenCalledWith('/eoi/comm-mappings', expect.objectContaining({
        opportunity_id: 'opp-1',
      }))
    })
  })
})
