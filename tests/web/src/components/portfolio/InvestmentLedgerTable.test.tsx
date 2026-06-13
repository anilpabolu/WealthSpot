import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { LedgerEntry } from '@/hooks/usePortfolio'

const deleteMutate = vi.fn()

const derivedRow: LedgerEntry = {
  rowKey: 'opp-1',
  kind: 'derived',
  entryId: null,
  sourceType: 'opportunity',
  sourceId: 'inv-1',
  opportunityId: 'opp-1',
  propertyId: null,
  projectName: 'Prestige Lakefront',
  registeredName: 'Asha Rao',
  opportunityCode: 'OPP-ABCD1234',
  status: 'active',
  configuration: '3 BHK',
  baseValue: 2000000,
  gst: 100000,
  gstPaid: true,
  totalValue: 2100000,
  referredBy: null,
  typeOfInvestment: 'wealth',
  extraSqft: null,
  sweepOnOcLoan: null,
  latestUpdates: null,
  canDelete: false,
  investedAt: '2026-01-01T00:00:00Z',
  documents: [],
  collateral: [
    { id: 'c1', project: 'Tower A', unitNo: 'A-101', configuration: '3 BHK', sbua: 1800, unitCost: 9000000 },
  ],
}

const manualRow: LedgerEntry = {
  ...derivedRow,
  rowKey: 'manual-2',
  kind: 'manual',
  entryId: 'entry-2',
  sourceType: null,
  sourceId: null,
  projectName: 'Brigade Cornerstone',
  registeredName: 'Manual Investor',
  opportunityCode: 'PROP-99',
  canDelete: true,
  collateral: [],
}

let ledgerData: LedgerEntry[] = []
let ledgerLoading = false

vi.mock('@/hooks/usePortfolio', () => ({
  useInvestmentLedger: () => ({ data: ledgerData, isLoading: ledgerLoading }),
  useDeleteLedgerEntry: () => ({ mutate: deleteMutate, isPending: false }),
  useLedgerAssetOptions: () => ({ data: { opportunities: [], properties: [] }, isLoading: false }),
  useCreateLedgerEntry: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateLedgerEntry: () => ({ mutate: vi.fn(), isPending: false }),
  useSaveLedgerOverlay: () => ({ mutate: vi.fn(), isPending: false }),
  useUploadLedgerDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteLedgerDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useLedgerDocumentUrl: () => ({ mutateAsync: vi.fn() }),
}))

import { InvestmentLedgerTable } from '@/components/portfolio/InvestmentLedgerTable'

const renderWithQC = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('InvestmentLedgerTable', () => {
  beforeEach(() => {
    deleteMutate.mockReset()
    ledgerData = []
    ledgerLoading = false
  })

  it('shows an empty state when there are no entries', () => {
    renderWithQC(<InvestmentLedgerTable />)
    expect(screen.getByText('No investments yet')).toBeInTheDocument()
  })

  it('renders derived and manual rows with key columns', () => {
    ledgerData = [derivedRow, manualRow]
    renderWithQC(<InvestmentLedgerTable />)
    expect(screen.getByText('Prestige Lakefront')).toBeInTheDocument()
    expect(screen.getByText('Brigade Cornerstone')).toBeInTheDocument()
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('OPP-ABCD1234')).toBeInTheDocument()
    // Header column for the new spec
    expect(screen.getByText('Sweep On OC (Loan)')).toBeInTheDocument()
    expect(screen.getByText('GST Paid')).toBeInTheDocument()
  })

  it('opens the asset picker when Add is clicked', () => {
    ledgerData = []
    renderWithQC(<InvestmentLedgerTable />)
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByText(/Which property is this investment for/i)).toBeInTheDocument()
  })

  it('asks for confirmation then deletes a manual row', () => {
    ledgerData = [manualRow]
    renderWithQC(<InvestmentLedgerTable />)
    fireEvent.click(screen.getByLabelText('Delete'))
    expect(screen.getByText('Remove investment?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Remove'))
    expect(deleteMutate).toHaveBeenCalledWith('entry-2')
  })

  it('does not show a delete control for derived rows', () => {
    ledgerData = [derivedRow]
    renderWithQC(<InvestmentLedgerTable />)
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument()
  })
})
