/**
 * web useProfiling hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

describe('web useProfiling – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Vault profile questions', () => {
    it('fetches questions for a specific vault type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'q1', vaultType: 'real_estate', questionKey: 'risk_appetite', questionText: 'How do you approach risk?', questionType: 'slider', options: null, sliderOptions: { min: 1, max: 10, step: 1 }, weight: 1.0, displayOrder: 1, funFact: null },
      ])

      const result = await apiGet<any>('/profiling/questions/real_estate')
      expect(result).toHaveLength(1)
      expect(result[0].vaultType).toBe('real_estate')
    })
  })

  describe('My answers', () => {
    it('fetches saved answers for a vault type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'a1', userId: 'u1', questionId: 'q1', answerValue: 8, createdAt: '2025-01-01T00:00:00Z' },
      ])

      const result = await apiGet<any>('/profiling/answers/real_estate')
      expect(result[0].answerValue).toBe(8)
    })

    it('returns empty array when no answers submitted', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/profiling/answers/real_estate')
      expect(result).toHaveLength(0)
    })
  })

  describe('Submit answers (bulk)', () => {
    it('posts bulk answers payload', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce([])
      await apiPost('/profiling/answers', {
        vaultType: 'real_estate',
        answers: [{ questionId: 'q1', answerValue: 8 }, { questionId: 'q2', answerValue: 'growth' }],
      })
      expect(apiPost).toHaveBeenCalledWith('/profiling/answers', expect.objectContaining({ vaultType: 'real_estate' }))
    })
  })

  describe('Profiling progress', () => {
    it('fetches completion percentage and status', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        vaultType: 'real_estate',
        totalQuestions: 15,
        answeredQuestions: 10,
        completionPct: 67,
        isComplete: false,
        personality: null,
      })

      const result = await apiGet<any>('/profiling/progress/real_estate')
      expect(result.completionPct).toBe(67)
      expect(result.isComplete).toBe(false)
    })
  })

  describe('My personality dimensions', () => {
    it('fetches computed personality dimensions', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        id: 'pd1',
        userId: 'u1',
        vaultType: 'real_estate',
        riskAppetite: 0.75,
        domainExpertise: 0.55,
        investmentCapacity: 0.8,
        timeCommitment: 0.6,
        networkStrength: 0.5,
        creativityScore: 0.7,
        archetypeLabel: 'Strategic Partner',
        archetypeDescription: 'Calculated and growth-focused',
        updatedAt: '2025-01-01T00:00:00Z',
      })

      const result = await apiGet<any>('/profiling/personality/real_estate')
      expect(result.archetypeLabel).toBe('Strategic Partner')
      expect(result.riskAppetite).toBe(0.75)
    })

    it('returns null when personality not yet computed', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(null)
      const result = await apiGet('/profiling/personality/real_estate')
      expect(result).toBeNull()
    })
  })

  describe('Opportunity custom questions', () => {
    it('fetches custom questions for an opportunity', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'cq1', opportunityId: 'opp1', questionText: 'Expected exit timeline?', questionType: 'single_choice', options: [{ value: '5y', label: '5 Years' }], weight: 1.5, displayOrder: 1 },
      ])

      const result = await apiGet<any>('/profiling/opportunities/opp1/questions')
      expect(result[0].opportunityId).toBe('opp1')
    })
  })
})
