import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/hooks/useShield', () => ({
  useOpportunityAssessments: vi.fn(),
  useReviewAssessment: vi.fn(),
}))

import { AdminShieldReviewPanel } from '@/components/shield/AdminShieldReviewPanel'
import {
  useOpportunityAssessments,
  useReviewAssessment,
} from '@/hooks/useShield'

const MOCK_SUMMARY = {
  certified: false,
  passedCount: 3,
  totalCount: 30,
  categories: [
    {
      code: 'builder',
      name: 'Builder Assessment',
      status: 'in_progress',
      passedCount: 2,
      totalCount: 5,
      subItems: [
        {
          code: 'category_grade',
          label: 'Category Grade',
          status: 'not_started',
          builderAnswer: { text: 'A' },
          reviewerNote: null,
          reviewedAt: null,
          riskSeverity: null,
          documents: [],
        },
        {
          code: 'tenure_sqft',
          label: 'Tenure & Sqft',
          status: 'passed',
          builderAnswer: null,
          reviewerNote: 'Confirmed',
          reviewedAt: '2026-01-10T12:00:00Z',
          riskSeverity: null,
          documents: [],
        },
      ],
    },
    {
      code: 'legal',
      name: 'Legal Assessment',
      status: 'not_started',
      passedCount: 0,
      totalCount: 5,
      subItems: [
        {
          code: 'title_deeds',
          label: 'Title Deeds',
          status: 'not_started',
          builderAnswer: null,
          reviewerNote: null,
          reviewedAt: null,
          riskSeverity: null,
          documents: [],
        },
      ],
    },
  ],
  risks: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useReviewAssessment).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as never)
})

describe('AdminShieldReviewPanel', () => {
  it('renders loading state when data is pending', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    expect(screen.getByText(/Loading Shield review/)).toBeInTheDocument()
  })

  it('renders the Shield Review header with progress', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    expect(screen.getByText('Shield Review')).toBeInTheDocument()
    expect(screen.getByText('3/30 passed')).toBeInTheDocument()
  })

  it('shows certified badge when all items done', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: { ...MOCK_SUMMARY, certified: true },
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    expect(screen.getByText('Certified')).toBeInTheDocument()
  })

  it('renders category tab buttons', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    expect(screen.getByText('Builder')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
  })

  it('shows sub-items for the active category', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    // Builder is the first/default active tab
    expect(screen.getByText('Category Grade')).toBeInTheDocument()
    expect(screen.getByText('Tenure & Sqft')).toBeInTheDocument()
  })

  it('switches category when a tab is clicked', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    fireEvent.click(screen.getByText('Legal'))
    expect(screen.getByText('Title Deeds')).toBeInTheDocument()
    // Builder sub-items should no longer be visible
    expect(screen.queryByText('Category Grade')).not.toBeInTheDocument()
  })

  it('renders Pass / Flag / N/A verdict buttons per sub-item', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    // Each sub-item gets 3 buttons — with 2 sub-items → 2 sets
    expect(screen.getAllByText('Pass').length).toBe(2)
    expect(screen.getAllByText('Flag').length).toBe(2)
    expect(screen.getAllByText('N/A').length).toBe(2)
  })

  it('renders severity select per sub-item', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    const selects = screen.getAllByRole('combobox', { name: 'Risk severity' })
    expect(selects.length).toBe(2)
  })

  it('shows builder answer when present', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    expect(screen.getByText("Builder's answer")).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('calls onAllComplete callback with completion status', () => {
    const onAllComplete = vi.fn()
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(
      <AdminShieldReviewPanel
        opportunityId="opp-1"
        onAllComplete={onAllComplete}
      />,
    )
    // Not all items are reviewed, so should be false
    expect(onAllComplete).toHaveBeenCalledWith(false)
  })

  it('calls useReviewAssessment on Pass click', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useReviewAssessment).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never)
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<AdminShieldReviewPanel opportunityId="opp-1" />)
    fireEvent.click(screen.getAllByText('Pass')[0]!)
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunityId: 'opp-1',
        subcategoryCode: 'category_grade',
        action: 'pass',
      }),
    )
  })
})
