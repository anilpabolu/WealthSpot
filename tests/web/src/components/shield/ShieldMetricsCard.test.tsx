import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/useShield', () => ({
  useShieldMetrics: vi.fn(),
}))

import { ShieldMetricsCard } from '@/components/shield/ShieldMetricsCard'
import { useShieldMetrics } from '@/hooks/useShield'

const MOCK_METRICS = {
  funnel: {
    not_started: 12,
    in_review: 5,
    partial: 3,
    certified: 8,
  },
  topFlagged: [
    { categoryCode: 'legal', subcategoryCode: 'title_deeds', flaggedCount: 7 },
    { categoryCode: 'builder', subcategoryCode: 'cash_flows', flaggedCount: 3 },
  ],
  avgTimeToCertifyDays: 14.3,
  riskCounts: {
    low: 4,
    medium: 6,
    high: 2,
  },
}

beforeEach(() => vi.clearAllMocks())

describe('ShieldMetricsCard', () => {
  it('renders loading skeleton when data is pending', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never)
    const { container } = render(<ShieldMetricsCard />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('returns null when no data and not loading', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as never)
    const { container } = render(<ShieldMetricsCard />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the default title', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: MOCK_METRICS,
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    expect(
      screen.getByText('WealthSpot Shield — operations'),
    ).toBeInTheDocument()
  })

  it('renders a custom title', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: MOCK_METRICS,
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard title="Shield Overview" />)
    expect(screen.getByText('Shield Overview')).toBeInTheDocument()
  })

  it('shows the total tracked count', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: MOCK_METRICS,
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    // 12 + 5 + 3 + 8 = 28
    expect(screen.getByText('28 opportunities tracked')).toBeInTheDocument()
  })

  it('renders all four funnel tiles', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: MOCK_METRICS,
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    expect(screen.getByText('12')).toBeInTheDocument() // not_started
    expect(screen.getByText('5')).toBeInTheDocument()  // in_review
    expect(screen.getByText('Not started')).toBeInTheDocument()
    expect(screen.getByText('In review')).toBeInTheDocument()
    expect(screen.getByText('Partial')).toBeInTheDocument()
    expect(screen.getByText('Certified')).toBeInTheDocument()
  })

  it('renders top-flagged sub-items', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: MOCK_METRICS,
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    expect(screen.getByText('Most-flagged sub-items')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument() // title_deeds flaggedCount
  })

  it('shows "No flagged items yet." when topFlagged is empty', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: { ...MOCK_METRICS, topFlagged: [] },
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    expect(screen.getByText('No flagged items yet.')).toBeInTheDocument()
  })

  it('renders average time-to-certify', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: MOCK_METRICS,
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    expect(screen.getByText('14.3 days')).toBeInTheDocument()
  })

  it('shows dash when avg time-to-certify is null', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: { ...MOCK_METRICS, avgTimeToCertifyDays: null },
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders risk count histogram', () => {
    vi.mocked(useShieldMetrics).mockReturnValue({
      data: MOCK_METRICS,
      isLoading: false,
    } as never)
    render(<ShieldMetricsCard />)
    expect(screen.getByText('Risk flags')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Med')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })
})
