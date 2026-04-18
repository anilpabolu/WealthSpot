import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PropertyCard from '@/components/wealth/PropertyCard'

const renderWithQC = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('PropertyCard', () => {
  const baseProps = {
    title: 'Sunrise Heights',
    city: 'Mumbai',
    assetType: 'Residential',
    coverImage: 'https://example.com/img.jpg',
    targetIrr: 14.5,
    minInvestment: 25000,
    raised: 5000000,
    target: 10000000,
  }

  it('renders title, city, and metrics', () => {
    renderWithQC(<PropertyCard {...baseProps} />)
    expect(screen.getByText('Sunrise Heights')).toBeInTheDocument()
    expect(screen.getByText(/Mumbai/)).toBeInTheDocument()
    expect(screen.getByText('14.5%')).toBeInTheDocument()
    expect(screen.getByText('₹25K')).toBeInTheDocument()
  })

  it('has accessible article role with correct label', () => {
    renderWithQC(<PropertyCard {...baseProps} />)
    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      'Sunrise Heights — Mumbai'
    )
  })

  it('shows loading skeleton when isLoading', () => {
    const { container } = renderWithQC(<PropertyCard {...baseProps} isLoading />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByText('Sunrise Heights')).not.toBeInTheDocument()
  })

  it('shows investor count when provided', () => {
    renderWithQC(<PropertyCard {...baseProps} investorCount={42} />)
    expect(screen.getByText('42 investors')).toBeInTheDocument()
  })

  it('shows RERA badge when reraNumber provided', () => {
    renderWithQC(<PropertyCard {...baseProps} reraNumber="P52100001234" />)
    expect(screen.getByText('RERA ✓')).toBeInTheDocument()
  })

  it('shows INVEST NOW button by default', () => {
    renderWithQC(<PropertyCard {...baseProps} />)
    expect(screen.getByText('INVEST NOW ›')).toBeInTheDocument()
  })

  it('shows FULLY FUNDED for funded status', () => {
    renderWithQC(<PropertyCard {...baseProps} status="funded" />)
    expect(screen.getByText('FULLY FUNDED ✓')).toBeInTheDocument()
  })

  it('shows notify buttons for upcoming status', () => {
    renderWithQC(<PropertyCard {...baseProps} status="upcoming" />)
    expect(screen.getByText(/Notify me/)).toBeInTheDocument()
  })

  it('calls onInvestClick when invest button clicked', async () => {
    const onClick = vi.fn()
    renderWithQC(<PropertyCard {...baseProps} onInvestClick={onClick} />)
    screen.getByText('INVEST NOW ›').click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('calls onCardClick when card clicked', () => {
    const onClick = vi.fn()
    renderWithQC(<PropertyCard {...baseProps} onCardClick={onClick} />)
    screen.getByRole('article').click()
    expect(onClick).toHaveBeenCalledOnce()
  })
})
