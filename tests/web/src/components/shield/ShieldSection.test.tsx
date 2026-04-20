import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/hooks/useShield', () => ({
  useOpportunityAssessments: vi.fn(),
  useDownloadAssessmentDocument: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}))

import { ShieldSection } from '@/components/shield/ShieldSection'
import { useOpportunityAssessments } from '@/hooks/useShield'

const MOCK_SUMMARY = {
  certified: true,
  passedCount: 28,
  totalCount: 30,
  categories: [
    {
      code: 'builder',
      name: 'Builder Assessment',
      status: 'passed',
      passedCount: 5,
      totalCount: 5,
      subItems: [
        {
          code: 'category_grade',
          label: 'Category Grade',
          status: 'passed',
          builderAnswer: { text: 'A' },
          reviewerNote: 'Looks good',
          reviewedAt: '2026-01-15T10:00:00Z',
          riskSeverity: null,
          documents: [],
        },
        {
          code: 'tenure_sqft',
          label: 'Tenure & Sqft Delivered',
          status: 'passed',
          builderAnswer: null,
          reviewerNote: null,
          reviewedAt: null,
          riskSeverity: null,
          documents: [
            {
              id: 'doc-1',
              filename: 'builder-report.pdf',
              sizeBytes: 102400,
              url: 'https://example.com/builder-report.pdf',
              locked: false,
            },
          ],
        },
      ],
    },
    {
      code: 'legal',
      name: 'Legal Assessment',
      status: 'flagged',
      passedCount: 2,
      totalCount: 5,
      subItems: [
        {
          code: 'title_deeds',
          label: 'Title Deeds',
          status: 'flagged',
          builderAnswer: null,
          reviewerNote: 'Parent deed missing',
          reviewedAt: '2026-02-01T10:00:00Z',
          riskSeverity: 'high',
          documents: [],
        },
      ],
    },
  ],
  risks: [
    {
      id: 'risk-1',
      label: 'Registrar-office delays',
      severity: 'medium',
      note: 'May take 3-6 months extra',
    },
  ],
}

beforeEach(() => vi.clearAllMocks())

describe('ShieldSection', () => {
  it('renders loading state when data is pending', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never)
    const { container } = render(<ShieldSection opportunityId="opp-1" />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('renders null when no data and not loading', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as never)
    const { container } = render(<ShieldSection opportunityId="opp-1" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the Shield header with certified badge', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    expect(screen.getByText('WealthSpot Shield')).toBeInTheDocument()
    expect(screen.getByText('Certified')).toBeInTheDocument()
    expect(screen.getByText(/28 of 30 checks passed/)).toBeInTheDocument()
  })

  it('omits certified badge when not certified', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: { ...MOCK_SUMMARY, certified: false },
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    expect(screen.queryByText('Certified')).not.toBeInTheDocument()
  })

  it('renders collapsible category rows', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    expect(screen.getByText('Builder Assessment')).toBeInTheDocument()
    expect(screen.getByText('Legal Assessment')).toBeInTheDocument()
  })

  it('expands a category row on click to show sub-items', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    // Builder row is collapsed by default (status is passed)
    expect(screen.queryByText('Category Grade')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Builder Assessment'))
    expect(screen.getByText('Category Grade')).toBeInTheDocument()
    expect(screen.getByText('Tenure & Sqft Delivered')).toBeInTheDocument()
  })

  it('auto-expands flagged categories', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    // Legal is flagged, should be auto-expanded
    expect(screen.getByText('Title Deeds')).toBeInTheDocument()
  })

  it('shows reviewer notes on sub-items', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    expect(screen.getByText(/Parent deed missing/)).toBeInTheDocument()
  })

  it('shows builder answer in builder mode', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" mode="builder" />)
    fireEvent.click(screen.getByText('Builder Assessment'))
    expect(screen.getByText(/Your answer: A/)).toBeInTheDocument()
  })

  it('renders the risk strip when risks exist', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: MOCK_SUMMARY,
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    expect(screen.getByText('Risks you should know')).toBeInTheDocument()
    expect(screen.getByText('Registrar-office delays')).toBeInTheDocument()
    expect(screen.getByText(/severity medium/)).toBeInTheDocument()
  })

  it('omits risk strip when no risks', () => {
    vi.mocked(useOpportunityAssessments).mockReturnValue({
      data: { ...MOCK_SUMMARY, risks: [] },
      isLoading: false,
    } as never)
    render(<ShieldSection opportunityId="opp-1" />)
    expect(screen.queryByText('Risks you should know')).not.toBeInTheDocument()
  })
})
