import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/components/layout', () => ({
  PortalLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/wealth/MetricCard', () => ({
  default: ({ label, value }: { label: string; value: string }) => (
    <div data-testid={`metric-${label}`}>{label}: {value}</div>
  ),
}))

vi.mock('@/components/ui', () => ({
  DataTable: ({ data }: { data: unknown[] }) => <table data-testid="data-table"><tbody><tr><td>{data.length} rows</td></tr></tbody></table>,
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  type: {} as never,
}))

vi.mock('@/hooks/useLender', () => ({
  useLenderDashboard: vi.fn(),
  useLenderLoans: vi.fn(),
  type: {} as never,
}))

vi.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: vi.fn(() => ({ data: { items: [] } })),
}))

vi.mock('@/lib/formatters', () => ({
  formatINRCompact: (n: number) => `₹${n}`,
  formatPercent: (n: number) => `${n}%`,
}))

import LenderDashboardPage from '@/pages/LenderDashboardPage'
import { useLenderDashboard, useLenderLoans } from '@/hooks/useLender'

describe('LenderDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useLenderDashboard).mockReturnValue({
      data: { totalLent: 500000, activeLoans: 5, totalInterestEarned: 25000, upcomingPayments: 2 },
      isLoading: false,
    } as never)
    vi.mocked(useLenderLoans).mockReturnValue({
      data: { items: [{ id: '1', propertyTitle: 'Test Prop', amount: 100000, status: 'active' }] },
      isLoading: false,
    } as never)
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <LenderDashboardPage />
      </MemoryRouter>,
    )

  it('renders Lender Dashboard hero', () => {
    renderPage()
    expect(screen.getByText('Lender Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Lender Portal')).toBeInTheDocument()
  })

  it('renders 4 metric cards', () => {
    renderPage()
    expect(screen.getByTestId('metric-Total Lent')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Active Loans')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Interest Earned')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Upcoming Payments')).toBeInTheDocument()
  })

  it('shows loading state while data fetches', () => {
    vi.mocked(useLenderDashboard).mockReturnValue({ data: undefined, isLoading: true } as never)
    renderPage()
    expect(screen.getByText(/Loading/)).toBeInTheDocument()
  })

  it('renders loans data table', () => {
    renderPage()
    expect(screen.getByTestId('data-table')).toBeInTheDocument()
  })

  it('has View All links', () => {
    renderPage()
    const links = screen.getAllByText('View All')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })
})
