/**
 * useProfiling – React Query hooks for the profiling & matching API.
 * Mobile equivalent of apps/web/src/hooks/useProfiling.ts.
 *
 * Types are defined locally in camelCase because the API client
 * auto-converts snake_case → camelCase on all responses.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../lib/api'

/* ─── CamelCase types (post-API-conversion) ────────────────────────────── */

export interface QuestionOption {
  value: string
  label: string
  emoji?: string
}

export interface SliderOptions {
  min: number
  max: number
  step: number
  labels?: Record<string, string>
  minLabel?: string
  maxLabel?: string
}

export interface VaultProfileQuestion {
  id: string
  vaultType: string
  questionKey: string
  questionText: string
  questionType: string
  options: QuestionOption[] | null
  sliderOptions: SliderOptions | null
  weight: number
  dimensionMapping: string | null
  dimension?: string | null
  funFact: string | null
  displayOrder: number
  illustration?: string | null
  category?: string | null
}

export interface UserProfileAnswer {
  id: string
  userId: string
  questionId: string
  answerValue: unknown
  createdAt: string
}

export interface UserProfileAnswerBulk {
  vaultType: string
  answers: Array<{ questionId: string; answerValue: unknown }>
}

export interface OpportunityCustomQuestion {
  id: string
  opportunityId: string
  questionText: string
  questionType: string
  options: QuestionOption[] | null
  weight: number
  displayOrder: number
}

export interface OpportunityCustomQuestionCreate {
  questionText: string
  questionType: string
  options?: QuestionOption[]
  weight?: number
  displayOrder?: number
}

export interface PersonalityDimension {
  id: string
  userId: string
  vaultType: string
  riskAppetite: number
  domainExpertise: number
  investmentCapacity: number
  timeCommitment: number
  networkStrength: number
  creativityScore: number
  leadershipScore?: number
  collaborationScore?: number
  archetypeLabel?: string | null
  archetypeDescription?: string | null
  updatedAt: string
}

export interface MatchBreakdown {
  tier: string
  emoji: string
  note: string
  strengths: string[]
  areasToGrow: string[]
  compatibilityLabel?: string
}

export interface MatchScore {
  userId: string
  opportunityId: string
  overallScore: number
  dimensionScores: Record<string, number>
  breakdown: MatchBreakdown | null
  archetypeCompatibility?: string | null
  computedAt: string
}

export interface MatchedUser {
  userId: string
  fullName: string
  avatarUrl: string | null
  overallScore: number
  dimensionScores: Record<string, number>
  topStrengths: string[]
  compatibilityNote: string | null
  archetypeLabel?: string | null
  archetypeCompatibility?: string | null
}

export interface ProfilingProgress {
  vaultType: string
  totalQuestions: number
  answeredQuestions: number
  completionPct: number
  isComplete: boolean
  personality: PersonalityDimension | null
}

export interface VaultProgressDetail {
  total: number
  answered: number
  pct: number
  isComplete: boolean
  archetype: string | null
}

export interface OverallProgress {
  profilePct: number
  vaults: Record<string, VaultProgressDetail>
  overallPct: number
  isFullyProfiled: boolean
}

// ── Vault Profile Questions ─────────────────────────────────────────────────

export function useVaultQuestions(vaultType: string) {
  return useQuery({
    queryKey: ['profiling', 'questions', vaultType],
    queryFn: () => apiGet<VaultProfileQuestion[]>(`/profiling/questions/${vaultType}`),
    enabled: !!vaultType,
    staleTime: 5 * 60_000,
  })
}

// ── My Answers ──────────────────────────────────────────────────────────────

export function useMyAnswers(vaultType: string) {
  return useQuery({
    queryKey: ['profiling', 'answers', vaultType],
    queryFn: () => apiGet<UserProfileAnswer[]>(`/profiling/answers/${vaultType}`),
    enabled: !!vaultType,
  })
}

// ── Submit Answers ──────────────────────────────────────────────────────────

export function useSubmitVaultAnswers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserProfileAnswerBulk) =>
      apiPost<UserProfileAnswer[]>('/profiling/answers', {
        vault_type: payload.vaultType,
        answers: payload.answers.map((a) => ({
          question_id: a.questionId,
          vault_type: payload.vaultType,
          answer_value: a.answerValue,
        })),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['profiling', 'answers', variables.vaultType] })
      qc.invalidateQueries({ queryKey: ['profiling', 'progress', variables.vaultType] })
      qc.invalidateQueries({ queryKey: ['profiling', 'personality', variables.vaultType] })
    },
  })
}

// ── Profiling Progress ──────────────────────────────────────────────────────

export function useProfilingProgress(vaultType: string) {
  return useQuery({
    queryKey: ['profiling', 'progress', vaultType],
    queryFn: () => apiGet<ProfilingProgress>(`/profiling/progress/${vaultType}`),
    enabled: !!vaultType,
  })
}

// ── Overall Progress (all vaults) ───────────────────────────────────────────

export function useOverallProgress() {
  return useQuery({
    queryKey: ['profiling', 'overall-progress'],
    queryFn: () => apiGet<OverallProgress>('/profiling/overall-progress'),
    staleTime: 30_000,
  })
}

// ── Personality Dimensions ──────────────────────────────────────────────────

export function useMyPersonality(vaultType: string) {
  return useQuery({
    queryKey: ['profiling', 'personality', vaultType],
    queryFn: () => apiGet<PersonalityDimension | null>(`/profiling/personality/${vaultType}`),
    enabled: !!vaultType,
  })
}

// ── Opportunity Custom Questions ────────────────────────────────────────────

export function useOpportunityQuestions(opportunityId: string) {
  return useQuery({
    queryKey: ['profiling', 'opportunity-questions', opportunityId],
    queryFn: () =>
      apiGet<OpportunityCustomQuestion[]>(`/profiling/opportunities/${opportunityId}/questions`),
    enabled: !!opportunityId,
  })
}

export function useCreateOpportunityQuestions(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (questions: OpportunityCustomQuestionCreate[]) =>
      apiPost<OpportunityCustomQuestion[]>(
        `/profiling/opportunities/${opportunityId}/questions`,
        questions,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiling', 'opportunity-questions', opportunityId] })
    },
  })
}

// ── Submit Application Answers ──────────────────────────────────────────────

export function useSubmitApplicationAnswers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      opportunityId: string
      answers: Array<{ questionId: string; answerValue: unknown }>
    }) =>
      apiPost('/profiling/applications', {
        opportunity_id: payload.opportunityId,
        answers: payload.answers.map((a) => ({
          question_id: a.questionId,
          answer_value: a.answerValue,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiling'] })
    },
  })
}

// ── Match Score ─────────────────────────────────────────────────────────────

export function useMyMatchScore(opportunityId: string) {
  return useQuery({
    queryKey: ['profiling', 'match', opportunityId],
    queryFn: () => apiGet<MatchScore | null>(`/profiling/match/${opportunityId}`),
    enabled: !!opportunityId,
  })
}

// ── Opportunity Matches (for creator) ───────────────────────────────────────

interface OpportunityMatchesResponse {
  opportunityId: string
  totalMatches: number
  matches: MatchedUser[]
}

export function useOpportunityMatches(opportunityId: string) {
  return useQuery({
    queryKey: ['profiling', 'opportunity-matches', opportunityId],
    queryFn: () =>
      apiGet<OpportunityMatchesResponse>(`/profiling/opportunities/${opportunityId}/matches`),
    enabled: !!opportunityId,
  })
}
