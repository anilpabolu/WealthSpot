/**
 * mobile useProfiling hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '../lib/api'

describe('mobile useProfiling – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Vault profile questions', () => {
    it('fetches questions for a vault type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'q1', vaultType: 'equity', questionKey: 'risk_appetite', questionText: 'Risk question', questionType: 'slider', options: null, sliderOptions: { min: 1, max: 10, step: 1 }, weight: 1.0, displayOrder: 1 },
      ])
      const result = await apiGet<any>('/profiling/questions/equity')
      expect(result).toHaveLength(1)
      expect(result[0].vaultType).toBe('equity')
    })
  })

  describe('My answers', () => {
    it('fetches saved answers for a vault type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'a1', userId: 'u1', questionId: 'q1', answerValue: 7, createdAt: '2025-01-01T00:00:00Z' },
      ])
      const result = await apiGet<any>('/profiling/answers/equity')
      expect(result[0].answerValue).toBe(7)
    })
  })

  describe('Submit answers', () => {
    it('posts bulk answers for a vault type', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce([
        { id: 'a1', userId: 'u1', questionId: 'q1', answerValue: 8, createdAt: '2025-01-01T00:00:00Z' },
      ])
      await apiPost('/profiling/answers', { vaultType: 'equity', answers: [{ questionId: 'q1', answerValue: 8 }] })
      expect(apiPost).toHaveBeenCalledWith('/profiling/answers', expect.objectContaining({ vaultType: 'equity' }))
    })
  })

  describe('Profiling progress', () => {
    it('fetches completion progress', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        vaultType: 'equity',
        totalQuestions: 10,
        answeredQuestions: 7,
        completionPct: 70,
        isComplete: false,
        personality: null,
      })
      const result = await apiGet<any>('/profiling/progress/equity')
      expect(result.completionPct).toBe(70)
      expect(result.isComplete).toBe(false)
    })
  })

  describe('My personality', () => {
    it('fetches personality dimensions', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        id: 'pd1',
        userId: 'u1',
        vaultType: 'equity',
        riskAppetite: 0.8,
        domainExpertise: 0.6,
        investmentCapacity: 0.7,
        timeCommitment: 0.5,
        networkStrength: 0.4,
        creativityScore: 0.6,
        archetypeLabel: 'Visionary Builder',
        updatedAt: '2025-01-01T00:00:00Z',
      })
      const result = await apiGet<any>('/profiling/personality/equity')
      expect(result.archetypeLabel).toBe('Visionary Builder')
    })

    it('returns null when profile not yet computed', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(null)
      const result = await apiGet('/profiling/personality/equity')
      expect(result).toBeNull()
    })
  })

  describe('Opportunity custom questions', () => {
    it('fetches custom questions for an opportunity', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'cq1', opportunityId: 'opp1', questionText: 'Investment horizon?', questionType: 'single_choice', options: [{ value: '1y', label: '1 Year' }], weight: 1, displayOrder: 1 },
      ])
      const result = await apiGet<any>('/profiling/opportunities/opp1/questions')
      expect(result[0].questionText).toBe('Investment horizon?')
    })
  })
})
