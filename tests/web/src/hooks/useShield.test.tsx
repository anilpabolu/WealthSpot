/**
 * useShield — hook-level tests. Verifies each hook dispatches the right
 * API call with the expected payload shape.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}))

import { api, apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'
import {
  useCreateRisk,
  useDeleteRisk,
  useDownloadAssessmentDocument,
  useOpportunityAssessments,
  useReviewAssessment,
  useSaveAssessmentBulk,
  useShieldMetrics,
  useUploadAssessmentDocument,
} from '@/hooks/useShield'

function wrapper({ children }: PropsWithChildren) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => vi.clearAllMocks())

describe('useOpportunityAssessments', () => {
  it('calls GET /opportunities/{id}/assessments when id is present', async () => {
    vi.mocked(apiGet).mockResolvedValue({ categories: [] } as never)
    const { result } = renderHook(
      () => useOpportunityAssessments('opp-123'),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/opportunities/opp-123/assessments')
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(
      () => useOpportunityAssessments(undefined),
      { wrapper },
    )
    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })
})

describe('useSaveAssessmentBulk', () => {
  it('maps camelCase to snake_case payload', async () => {
    vi.mocked(apiPut).mockResolvedValue({} as never)
    const { result } = renderHook(() => useSaveAssessmentBulk(), { wrapper })
    await result.current.mutateAsync({
      opportunityId: 'opp-7',
      items: [
        {
          categoryCode: 'builder',
          subcategoryCode: 'category_grade',
          builderAnswer: { text: 'A' },
        },
      ],
    })
    expect(apiPut).toHaveBeenCalledWith(
      '/opportunities/opp-7/assessments/bulk',
      {
        items: [
          {
            category_code: 'builder',
            subcategory_code: 'category_grade',
            builder_answer: { text: 'A' },
            is_public: null,
          },
        ],
      },
    )
  })

  it('defaults builder_answer to null when omitted', async () => {
    vi.mocked(apiPut).mockResolvedValue({} as never)
    const { result } = renderHook(() => useSaveAssessmentBulk(), { wrapper })
    await result.current.mutateAsync({
      opportunityId: 'opp-1',
      items: [{ categoryCode: 'legal', subcategoryCode: 'title_deeds' }],
    })
    const body = vi.mocked(apiPut).mock.calls[0][1] as {
      items: Array<{ builder_answer: unknown }>
    }
    expect(body.items[0].builder_answer).toBeNull()
  })
})

describe('useReviewAssessment', () => {
  it('sends action + reviewer_note + risk_severity', async () => {
    vi.mocked(apiPost).mockResolvedValue({} as never)
    const { result } = renderHook(() => useReviewAssessment(), { wrapper })
    await result.current.mutateAsync({
      opportunityId: 'opp-9',
      subcategoryCode: 'title_deeds',
      action: 'flag',
      reviewerNote: 'Parent deed missing',
      riskSeverity: 'high',
    })
    expect(apiPost).toHaveBeenCalledWith(
      '/opportunities/opp-9/assessments/title_deeds/review',
      {
        action: 'flag',
        reviewer_note: 'Parent deed missing',
        risk_severity: 'high',
      },
    )
  })
})

describe('useUploadAssessmentDocument', () => {
  it('posts multipart form data with category + subcategory as query params', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: [] } as never)
    const { result } = renderHook(() => useUploadAssessmentDocument(), {
      wrapper,
    })
    const file = new File(['%PDF-1.4'], 'evidence.pdf', {
      type: 'application/pdf',
    })
    await result.current.mutateAsync({
      opportunityId: 'opp-3',
      category: 'builder',
      subcategory: 'cash_flows',
      files: [file],
    })
    const [url, formData, config] = vi.mocked(api.post).mock.calls[0] as [
      string,
      FormData,
      { headers: Record<string, string> },
    ]
    expect(url).toBe(
      '/uploads/opportunity/opp-3/assessment-document?category=builder&subcategory=cash_flows',
    )
    expect(formData).toBeInstanceOf(FormData)
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
  })
})

describe('useDownloadAssessmentDocument', () => {
  it('calls GET on the gated download endpoint', async () => {
    vi.mocked(apiGet).mockResolvedValue({ id: 'm1', url: 'u' } as never)
    const { result } = renderHook(
      () => useDownloadAssessmentDocument(),
      { wrapper },
    )
    await result.current.mutateAsync({
      opportunityId: 'opp-2',
      mediaId: 'm1',
    })
    expect(apiGet).toHaveBeenCalledWith(
      '/uploads/opportunity/opp-2/assessment-document/m1',
    )
  })
})

describe('useShieldMetrics', () => {
  it('hits /control-centre/shield-metrics', async () => {
    vi.mocked(apiGet).mockResolvedValue({ funnel: {} } as never)
    const { result } = renderHook(() => useShieldMetrics(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/control-centre/shield-metrics')
  })

  it('honours the enabled=false flag', () => {
    const { result } = renderHook(() => useShieldMetrics(false), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })
})

describe('useCreateRisk + useDeleteRisk', () => {
  it('creates a risk flag', async () => {
    vi.mocked(apiPost).mockResolvedValue({ id: 'r1' } as never)
    const { result } = renderHook(() => useCreateRisk(), { wrapper })
    await result.current.mutateAsync({
      opportunityId: 'opp-4',
      label: 'Registrar delay',
      severity: 'medium',
      note: 'Backlogged office',
    })
    expect(apiPost).toHaveBeenCalledWith(
      '/opportunities/opp-4/risks',
      {
        label: 'Registrar delay',
        severity: 'medium',
        note: 'Backlogged office',
      },
    )
  })

  it('deletes a risk flag', async () => {
    vi.mocked(apiDelete).mockResolvedValue({ deleted: true } as never)
    const { result } = renderHook(() => useDeleteRisk(), { wrapper })
    await result.current.mutateAsync({
      opportunityId: 'opp-4',
      riskId: 'r1',
    })
    expect(apiDelete).toHaveBeenCalledWith(
      '/opportunities/opp-4/risks/r1',
    )
  })
})
