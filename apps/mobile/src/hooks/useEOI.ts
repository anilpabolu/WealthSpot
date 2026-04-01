/**
 * useEOI – Expression of Interest hooks for mobile.
 * Mirrors web's useEOI.ts with RN adaptations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

export interface BuilderQuestion {
  id: string
  opportunityId: string
  creatorId: string
  questionText: string
  questionType: string
  options: { choices?: string[] } | null
  isRequired: boolean
  sortOrder: number
  createdAt: string
}

export interface EOIAnswer {
  id: string
  questionId: string
  answerText: string | null
  question: BuilderQuestion | null
  createdAt: string
}

export interface EOIUser {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
}

export interface EOIOpportunitySummary {
  id: string
  title: string
  slug: string
  vaultType: string
}

export interface EOIItem {
  id: string
  userId: string
  opportunityId: string
  investmentAmount: number | null
  numUnits: number | null
  investmentTimeline: string | null
  fundingSource: string | null
  purpose: string | null
  preferredContact: string | null
  bestTimeToContact: string | null
  communicationConsent: boolean
  additionalNotes: string | null
  status: string
  referrerId: string | null
  createdAt: string
  updatedAt: string
  user: EOIUser | null
  opportunity: EOIOpportunitySummary | null
  answers: EOIAnswer[]
  referrer: EOIUser | null
}

interface PaginatedEOIs {
  items: EOIItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface EOICreatePayload {
  opportunityId: string
  investmentAmount?: number
  numUnits?: number
  investmentTimeline?: string
  fundingSource?: string
  purpose?: string
  preferredContact?: string
  bestTimeToContact?: string
  communicationConsent?: boolean
  additionalNotes?: string
  answers?: { questionId: string; answerText: string | null }[]
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useBuilderQuestions(opportunityId: string) {
  return useQuery({
    queryKey: ['builder-questions', opportunityId],
    queryFn: () => apiGet<BuilderQuestion[]>(`/eoi/questions/${opportunityId}`),
    enabled: !!opportunityId,
  })
}

export function useSubmitEOI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EOICreatePayload) =>
      apiPost<EOIItem>('/eoi', {
        opportunity_id: data.opportunityId,
        investment_amount: data.investmentAmount,
        num_units: data.numUnits,
        investment_timeline: data.investmentTimeline,
        funding_source: data.fundingSource,
        purpose: data.purpose,
        preferred_contact: data.preferredContact,
        best_time_to_contact: data.bestTimeToContact,
        communication_consent: data.communicationConsent,
        additional_notes: data.additionalNotes,
        answers: data.answers?.map(a => ({
          question_id: a.questionId,
          answer_text: a.answerText,
        })) ?? [],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eois'] }),
  })
}

export function useMyEOIs(params?: { opportunityId?: string; page?: number }) {
  return useQuery({
    queryKey: ['eois', params],
    queryFn: () =>
      apiGet<PaginatedEOIs>('/eoi', {
        params: {
          ...(params?.opportunityId && { opportunity_id: params.opportunityId }),
          page: params?.page ?? 1,
        },
      }),
  })
}

export function useConnectWithBuilder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eoiId: string) =>
      apiPost<EOIItem>(`/eoi/${eoiId}/connect`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eois'] }),
  })
}

// ── Pipeline statuses (read-only on mobile) ────────────────────────────────

export const EOI_PIPELINE_STATUSES = [
  'submitted',
  'builder_connected',
  'deal_in_progress',
  'payment_done',
  'deal_completed',
] as const

export type EOIPipelineStatus = (typeof EOI_PIPELINE_STATUSES)[number]

export const EOI_STATUS_LABELS: Record<string, string> = {
  submitted: 'EOI Submitted',
  builder_connected: 'Connect with Builder',
  deal_in_progress: 'Deal in Progress',
  payment_done: 'Payment Done',
  deal_completed: 'Deal Completed',
}
