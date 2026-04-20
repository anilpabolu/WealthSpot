import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'
import type {
  AssessmentSummaryRead,
  OpportunityRiskFlagRead,
  ShieldMetrics,
} from '@/lib/assessments'

const assessmentsKey = (opportunityId: string) =>
  ['opportunity-assessments', opportunityId] as const

const metricsKey = ['shield-metrics'] as const

export function useOpportunityAssessments(opportunityId: string | undefined) {
  return useQuery({
    queryKey: assessmentsKey(opportunityId ?? ''),
    queryFn: () =>
      apiGet<AssessmentSummaryRead>(
        `/opportunities/${opportunityId}/assessments`,
      ),
    enabled: Boolean(opportunityId),
    staleTime: 30_000,
  })
}

export interface BulkAssessmentItem {
  categoryCode: string
  subcategoryCode: string
  builderAnswer?: Record<string, unknown> | null
}

export function useSaveAssessmentBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      opportunityId,
      items,
    }: {
      opportunityId: string
      items: BulkAssessmentItem[]
    }) =>
      apiPut<AssessmentSummaryRead>(
        `/opportunities/${opportunityId}/assessments/bulk`,
        {
          items: items.map((i) => ({
            category_code: i.categoryCode,
            subcategory_code: i.subcategoryCode,
            builder_answer: i.builderAnswer ?? null,
          })),
        },
      ),
    onSuccess: (_data, { opportunityId }) => {
      qc.invalidateQueries({ queryKey: assessmentsKey(opportunityId) })
      qc.invalidateQueries({ queryKey: metricsKey })
    },
  })
}

export interface ReviewAssessmentInput {
  opportunityId: string
  subcategoryCode: string
  action: 'pass' | 'flag' | 'na'
  reviewerNote?: string
  riskSeverity?: 'low' | 'medium' | 'high'
}

export function useReviewAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      opportunityId,
      subcategoryCode,
      action,
      reviewerNote,
      riskSeverity,
    }: ReviewAssessmentInput) =>
      apiPost<AssessmentSummaryRead>(
        `/opportunities/${opportunityId}/assessments/${subcategoryCode}/review`,
        {
          action,
          reviewer_note: reviewerNote,
          risk_severity: riskSeverity,
        },
      ),
    onSuccess: (_d, { opportunityId }) => {
      qc.invalidateQueries({ queryKey: assessmentsKey(opportunityId) })
      qc.invalidateQueries({ queryKey: metricsKey })
    },
  })
}

export function useUploadAssessmentDocument() {
  return useMutation({
    mutationFn: async ({
      opportunityId,
      category,
      subcategory,
      files,
    }: {
      opportunityId: string
      category: string
      subcategory: string
      files: File[]
    }) => {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      const resp = await api.post<
        Array<{
          id: string
          filename: string | null
          sizeBytes: number | null
          category: string
          subcategory: string
        }>
      >(
        `/uploads/opportunity/${opportunityId}/assessment-document?category=${encodeURIComponent(
          category,
        )}&subcategory=${encodeURIComponent(subcategory)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
  })
}

export interface DownloadedDoc {
  id: string
  url: string
  filename: string | null
  contentType: string | null
  sizeBytes: number | null
}

export function useDownloadAssessmentDocument() {
  return useMutation({
    mutationFn: ({
      opportunityId,
      mediaId,
    }: {
      opportunityId: string
      mediaId: string
    }) =>
      apiGet<DownloadedDoc>(
        `/uploads/opportunity/${opportunityId}/assessment-document/${mediaId}`,
      ),
  })
}

export function useShieldMetrics(enabled = true) {
  return useQuery({
    queryKey: metricsKey,
    queryFn: () => apiGet<ShieldMetrics>('/control-centre/shield-metrics'),
    enabled,
    staleTime: 60_000,
  })
}

export function useCreateRisk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      opportunityId,
      label,
      severity,
      note,
    }: {
      opportunityId: string
      label: string
      severity: 'low' | 'medium' | 'high'
      note?: string
    }) =>
      apiPost<OpportunityRiskFlagRead>(
        `/opportunities/${opportunityId}/risks`,
        { label, severity, note },
      ),
    onSuccess: (_d, { opportunityId }) => {
      qc.invalidateQueries({ queryKey: assessmentsKey(opportunityId) })
    },
  })
}

export function useDeleteRisk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      opportunityId,
      riskId,
    }: {
      opportunityId: string
      riskId: string
    }) =>
      apiDelete<{ deleted: boolean; id: string }>(
        `/opportunities/${opportunityId}/risks/${riskId}`,
      ),
    onSuccess: (_d, { opportunityId }) => {
      qc.invalidateQueries({ queryKey: assessmentsKey(opportunityId) })
    },
  })
}
