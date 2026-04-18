import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock layout so we don't need Clerk/Navbar/Sidebar
vi.mock('@/components/layout', () => ({
  PortalLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/hooks/useInvestment', () => ({
  useInvestmentSummary: vi.fn(),
}))

vi.mock('@/hooks/usePortfolio', () => ({
  useRecentTransactions: vi.fn(),
}))

vi.mock('@/hooks/useProperties', () => ({
  useFeaturedProperties: vi.fn(),
  type: {} as never,
}))

vi.mock('@/hooks/useSiteContent', () => ({
  useContent: (_s: string, _k: string, fallback: string) => fallback,
}))

vi.mock('@/components/wealth/MetricCard', () => ({
  default: ({ label, value }: { label: string; value: string }) => (
    <div data-testid={`metric-${label}`}>{label}: {value}</div>
  ),
}))

vi.mock('@/components/wealth/PropertyCard', () => ({
  default: ({ title, isLoading }: { title: string; isLoading?: boolean }) =>
    isLoading ? <div data-testid="property-skeleton" /> : <div data-testid="property-card">{title}</div>,
}))

vi.mock('@/components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))

vi.mock('@/lib/formatters', () => ({
  formatINRCompact: (n: number) => `₹${n}`,
  formatPercent: (n: number) => `${n}%`,
  formatDate: (d: string) => d,
}))

import InvestorDashboardPage from '@/pages/InvestorDashboardPage'
import { useInvestmentSummary } from '@/hooks/useInvestment'
import { useRecentTransactions } from '@/hooks/usePortfolio'
import { useFeaturedProperties } from '@/hooks/useProperties'

describe('InvestorDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useInvestmentSummary).mockReturnValue({
      data: { totalInvested: 100000, currentValue: 120000, avgIrr: 14.5, propertiesCount: 3 },
      isLoading: false,
    } as never)
    vi.mocked(useRecentTransactions).mockReturnValue({
      data: [
        { id: '1', type: 'investment', amount: 50000, propertyTitle: 'Sunrise Heights', date: '2024-01-15' },
        { id: '2', type: 'payout', amount: 5000, propertyTitle: 'Ocean View', date: '2024-01-20' },
      ],
      isLoading: false,
    } as never)
    vi.mocked(useFeaturedProperties).mockReturnValue({
      data: {
        properties: [
          { id: 'p1', title: 'Featured Prop', slug: 'featured-prop', city: 'Mumbai', assetType: 'Residential', coverImage: '', targetIrr: 12, minInvestment: 25000, raised: 50000, target: 100000 },
        ],
      },
      isLoading: false,
    } as never)
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <InvestorDashboardPage />
      </MemoryRouter>,
    )

  it('renders hero section with CMS content', () => {
    renderPage()
    expect(screen.getByText('Investor Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  })

  it('renders portfolio metric cards', () => {
    renderPage()
    expect(screen.getByTestId('metric-Total Invested')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Current Value')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Avg. IRR')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Properties')).toBeInTheDocument()
  })

  it('renders recent transactions', () => {
    renderPage()
    expect(screen.getByText('Sunrise Heights')).toBeInTheDocument()
    expect(screen.getByText('Ocean View')).toBeInTheDocument()
  })

  it('shows empty state when no transactions', () => {
    vi.mocked(useRecentTransactions).mockReturnValue({ data: [], isLoading: false } as never)
    renderPage()
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('renders featured properties', () => {
    renderPage()
    expect(screen.getByText('Featured Prop')).toBeInTheDocument()
  })

  it('shows loading skeletons when investment data loads', () => {
    vi.mocked(useInvestmentSummary).mockReturnValue({ data: undefined, isLoading: true } as never)
    renderPage()
    // MetricCard mock receives isLoading
    const metrics = screen.getAllByTestId(/^metric-/)
    expect(metrics.length).toBe(4)
  })

  it('shows property skeletons when featured properties load', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue({ data: undefined, isLoading: true } as never)
    renderPage()
    const skeletons = screen.getAllByTestId('property-skeleton')
    expect(skeletons.length).toBe(3)
  })

  it('has quick action links', () => {
    renderPage()
    expect(screen.getByText('Browse Properties')).toBeInTheDocument()
    expect(screen.getByText('My Portfolio')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
  })
})
