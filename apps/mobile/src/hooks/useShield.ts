/**
 * WealthSpot Shield — mobile React Query hooks.
 *
 * Mirrors apps/web/src/hooks/useShield.ts so both surfaces talk to the
 * same API with identical key shapes.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiGet, apiPost, apiPut } from '../lib/api'
import type {
  AssessmentSummaryRead,
  ShieldMetrics,
} from '../lib/assessments'

const assessmentsKey = (id: string) =>
  ['mobile-opportunity-assessments', id] as const
const metricsKey = ['mobile-shield-metrics'] as const

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
      // Expo DocumentPicker returns { uri, name, mimeType, size }
      files: Array<{ uri: string; name: string; mimeType?: string }>
    }) => {
      const formData = new FormData()
      for (const f of files) {
        // React Native FormData accepts objects with uri/type/name
        formData.append('files', {
          uri: f.uri,
          name: f.name,
          type: f.mimeType ?? 'application/octet-stream',
        } as unknown as Blob)
      }
      const resp = await api.post(
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

export function useDownloadAssessmentDocument() {
  return useMutation({
    mutationFn: ({
      opportunityId,
      mediaId,
    }: {
      opportunityId: string
      mediaId: string
    }) =>
      apiGet<{
        id: string
        url: string
        filename: string | null
        contentType: string | null
        sizeBytes: number | null
      }>(
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
