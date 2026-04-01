import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

export interface BuilderQuestion {
  id: string
  opportunityId: string
  creatorId: string
  questionText: string
  questionType: string // text, select, number, boolean
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
  phone: string | null
  role: string | null
  kycStatus: string | null
  city: string | null
  state: string | null
  occupation: string | null
  annualIncome: string | null
  investmentExperience: string | null
  riskTolerance: string | null
  referralCode: string | null
  createdAt: string | null
}

export interface EOIOpportunitySummary {
  id: string
  title: string
  slug: string
  vaultType: string
}

export interface EOIStageHistoryEntry {
  id: string
  status: string
  changedBy: string | null
  changedAt: string
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
  stageHistory: EOIStageHistoryEntry[]
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

export interface CommMapping {
  id: string
  opportunityId: string
  userId: string
  role: string
  createdAt: string
  user: EOIUser | null
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useBuilderQuestions(opportunityId: string) {
  return useQuery({
    queryKey: ['builder-questions', opportunityId],
    queryFn: () => apiGet<BuilderQuestion[]>(`/eoi/questions/${opportunityId}`),
    enabled: !!opportunityId,
  })
}

export function useCreateBuilderQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ opportunityId, ...data }: { opportunityId: string; questionText: string; questionType?: string; options?: { choices?: string[] } | null; isRequired?: boolean; sortOrder?: number }) =>
      apiPost<BuilderQuestion>(`/eoi/questions/${opportunityId}`, {
        question_text: data.questionText,
        question_type: data.questionType ?? 'text',
        options: data.options,
        is_required: data.isRequired ?? true,
        sort_order: data.sortOrder ?? 0,
      }),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['builder-questions', variables.opportunityId] }),
  })
}

export function useUpdateBuilderQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ opportunityId, questionId, data }: { opportunityId: string; questionId: string; data: { questionText?: string; questionType?: string; options?: { choices?: string[] } | null; isRequired?: boolean; sortOrder?: number } }) =>
      apiPatch<BuilderQuestion>(`/eoi/questions/${opportunityId}/${questionId}`, {
        ...(data.questionText !== undefined && { question_text: data.questionText }),
        ...(data.questionType !== undefined && { question_type: data.questionType }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.isRequired !== undefined && { is_required: data.isRequired }),
        ...(data.sortOrder !== undefined && { sort_order: data.sortOrder }),
      }),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['builder-questions', variables.opportunityId] }),
  })
}

export function useDeleteBuilderQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ opportunityId, questionId }: { opportunityId: string; questionId: string }) =>
      apiDelete(`/eoi/questions/${opportunityId}/${questionId}`),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['builder-questions', variables.opportunityId] }),
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

export function useEOIs(params?: { opportunityId?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['eois', params],
    queryFn: () =>
      apiGet<PaginatedEOIs>('/eoi', {
        params: {
          ...(params?.opportunityId && { opportunity_id: params.opportunityId }),
          ...(params?.status && { status: params.status }),
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

// ── Communication Mapping Hooks ────────────────────────────────────────────

export function useCommMappings(opportunityId: string) {
  return useQuery({
    queryKey: ['comm-mappings', opportunityId],
    queryFn: () => apiGet<CommMapping[]>(`/eoi/comm-mappings/${opportunityId}`),
    enabled: !!opportunityId,
  })
}

export function useCreateCommMapping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { opportunityId: string; userId: string; role: string }) =>
      apiPost<CommMapping>('/eoi/comm-mappings', {
        opportunity_id: data.opportunityId,
        user_id: data.userId,
        role: data.role,
      }),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['comm-mappings', variables.opportunityId] }),
  })
}

export function useDeleteCommMapping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mappingId }: { mappingId: string; opportunityId: string }) =>
      apiDelete(`/eoi/comm-mappings/${mappingId}`),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['comm-mappings', variables.opportunityId] }),
  })
}

// ── Admin Pipeline Hooks ───────────────────────────────────────────────────

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

export function useAdminEOIPipeline() {
  return useQuery({
    queryKey: ['admin-eoi-pipeline'],
    queryFn: () => apiGet<EOIItem[]>('/eoi/admin/pipeline', { params: { page_size: 500 } }),
  })
}

export function useUpdateEOIStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eoiId, newStatus }: { eoiId: string; newStatus: string }) =>
      apiPatch<EOIItem>(`/eoi/admin/${eoiId}/status`, { new_status: newStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-eoi-pipeline'] }),
  })
}
