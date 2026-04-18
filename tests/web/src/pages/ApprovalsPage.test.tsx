import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/components/layout/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }))
vi.mock('@/components/layout/Footer', () => ({ default: () => <footer data-testid="footer" /> }))

vi.mock('@/components/ui', () => ({
  Select: ({ value, options }: { value: string; options: { value: string; label: string }[] }) => (
    <select data-testid="select" value={value} onChange={() => {}}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))

vi.mock('@/hooks/useApprovals', () => ({
  useApprovals: vi.fn(),
  useAllApprovals: vi.fn(() => ({ data: null })),
  useReviewApproval: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  type: {} as never,
}))

vi.mock('@/stores/approval.store', () => ({
  useApprovalStore: vi.fn(() => ({
    filters: { category: '', status: '', priority: '', search: '', sortBy: 'created_at', sortOrder: 'desc', page: 1 },
    setFilter: vi.fn(),
  })),
}))

vi.mock('@/hooks/useOpportunities', () => ({
  useOpportunity: vi.fn(() => ({ data: null })),
  useUpdateOpportunity: vi.fn(() => ({ mutateAsync: vi.fn() })),
  type: {} as never,
}))

vi.mock('@/hooks/useCompanies', () => ({
  useCompany: vi.fn(() => ({ data: null })),
  useUpdateCompany: vi.fn(() => ({ mutateAsync: vi.fn() })),
  type: {} as never,
}))

import ApprovalsPage from '@/pages/ApprovalsPage'
import { useApprovals } from '@/hooks/useApprovals'

describe('ApprovalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useApprovals).mockReturnValue({
      data: {
        items: [
          {
            id: 'a1',
            title: 'KYC Review - John',
            category: 'kyc_verification',
            status: 'pending',
            priority: 'high',
            requester: { fullName: 'John Doe' },
            createdAt: '2024-01-15',
          },
          {
            id: 'a2',
            title: 'Builder Listing - Tower A',
            category: 'property_listing',
            status: 'approved',
            priority: 'normal',
            requester: { fullName: 'Builder Inc' },
            createdAt: '2024-01-10',
          },
        ],
        total: 2,
        totalPages: 1,
      },
      isLoading: false,
    } as never)
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>,
    )

  it('renders Approvals hero', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Approvals' })).toBeInTheDocument()
    expect(screen.getByText('Workflow')).toBeInTheDocument()
  })

  it('renders board and table view toggle buttons', () => {
    renderPage()
    expect(screen.getByText('Board')).toBeInTheDocument()
    expect(screen.getByText('Table')).toBeInTheDocument()
  })

  it('renders category filter options', () => {
    renderPage()
    expect(screen.getByText('All Categories')).toBeInTheDocument()
  })

  it('shows loading when data is being fetched', () => {
    vi.mocked(useApprovals).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never)
    renderPage()
    expect(screen.getByRole('heading', { name: 'Approvals' })).toBeInTheDocument()
  })

  it('renders navbar', () => {
    renderPage()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })
})
