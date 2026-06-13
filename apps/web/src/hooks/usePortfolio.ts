import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

export interface PortfolioProperty {
  propertyId: string
  propertyTitle: string
  propertyCity: string
  propertyImage: string
  assetType: string
  investedAmount: number
  currentValue: number
  units: number
  returnPercentage: number
  investmentCount: number
  originalUnitPrice: number
  currentUnitPrice: number
  appreciationAmount: number
  appreciationPct: number
  status: string
  investedAt: string
  lastPayoutDate: string | null
  nextPayoutDate: string | null
}

export interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  totalReturns: number
  unrealizedGains: number

  propertiesCount: number
  citiesCount: number
  monthlyIncome: number
  assetAllocation: Array<{ type: string; percentage: number; value: number }>
  cityDistribution: Array<{ city: string; percentage: number; value: number }>
  monthlyReturns: Array<{ month: string; returns: number; invested: number }>
}

export interface RecentTransaction {
  id: string
  type: 'investment' | 'payout' | 'referral_bonus' | 'wealthpass'
  amount: number
  propertyTitle: string
  date: string
  status: string
  vaultType: string | null
  opportunitySlug: string | null
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: () => apiGet<PortfolioSummary>('/portfolio/summary'),
    staleTime: 30_000,
  })
}

export function usePortfolioProperties() {
  return useQuery({
    queryKey: ['portfolio', 'properties'],
    queryFn: () => apiGet<PortfolioProperty[]>('/portfolio/properties'),
    staleTime: 30_000,
  })
}

export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: ['portfolio', 'transactions', limit],
    queryFn: () =>
      apiGet<RecentTransaction[]>('/portfolio/transactions', {
        params: { limit },
      }),
    staleTime: 30_000,
  })
}

/* ── Vault-wise portfolio breakdown ─────────────────────────────── */

export interface VaultPortfolioItem {
  vaultType: string
  totalInvested: number
  currentValue: number
  returns: number
  returnPct: number
  opportunityCount: number
  investorCount: number
  avgDurationDays: number
}

export interface VaultPortfolioResponse {
  vaults: VaultPortfolioItem[]
  grandTotalInvested: number
  grandCurrentValue: number
  grandReturns: number
  grandReturnPct: number
}

export function useVaultWisePortfolio() {
  return useQuery({
    queryKey: ['portfolio', 'vault-wise'],
    queryFn: () => apiGet<VaultPortfolioResponse>('/portfolio/vault-wise'),
    staleTime: 30_000,
  })
}

/* ── Property investment detail ─────────────────────────────────── */

export interface PropertyInvestmentItem {
  investmentId: string
  units: number
  amount: number
  unitPrice: number
  investedAt: string
}

export interface PropertyAppreciationItem {
  id: string
  mode: string
  inputValue: number
  oldValuation: number
  newValuation: number
  note: string | null
  createdAt: string
}

export interface PropertyInvestmentDetail {
  propertyId: string
  propertyName: string
  city: string
  assetType: string
  originalUnitPrice: number
  currentUnitPrice: number
  appreciationPct: number
  totalInvested: number
  currentValue: number
  totalUnits: number
  investmentCount: number
  investments: PropertyInvestmentItem[]
  appreciationHistory: PropertyAppreciationItem[]
}

export function usePropertyInvestmentDetail(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', 'property-detail', propertyId],
    queryFn: () => apiGet<PropertyInvestmentDetail>(`/portfolio/properties/${propertyId}`),
    enabled: !!propertyId,
    staleTime: 30_000,
  })
}

/* ── Unified Holdings ────────────────────────────────────────────── */

export interface HoldingItem {
  id: string
  investmentType: 'property' | 'opportunity'
  projectTitle: string
  projectImage: string | null
  projectSlug: string | null
  vaultType: string
  city: string | null
  assetType: string | null
  investedAmount: number
  currentValue: number
  returns: number
  returnPct: number
  units: number
  investedAt: string
  status: string
  opportunityId: string | null
  payoutFrequency: string | null
  appreciationPct: number
  originalUnitPrice: number | null
  currentUnitPrice: number | null
  targetAmount: number | null
  raisedAmount: number | null
  investorCount: number | null
  description: string | null
  address: string | null
  founderName: string | null
  tagline: string | null
  projectPhase: string | null
  sqft: number | null
  flatConfigurations: string[]
  transactionStatus: string
}

export function usePortfolioHoldings() {
  return useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: () => apiGet<HoldingItem[]>('/portfolio/holdings'),
    staleTime: 30_000,
  })
}

/* ── Snapshot config ─────────────────────────────────────────────── */

export interface SnapshotConfig {
  sections: string[]
}

export function useSnapshotConfig() {
  return useQuery({
    queryKey: ['portfolio', 'snapshot-config'],
    queryFn: () => apiGet<SnapshotConfig>('/portfolio/snapshot-config'),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateSnapshotConfig() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Snapshot preferences saved' },
    mutationFn: (sections: string[]) =>
      apiPut<SnapshotConfig>('/portfolio/snapshot-config', { sections }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', 'snapshot-config'] })
    },
  })
}

/* ── Opportunity appreciation history ───────────────────────────── */

export interface AppreciationHistoryItem {
  id: string
  mode: string
  inputValue: number
  oldValuation: number
  newValuation: number
  note: string | null
  createdAt: string
}

export function useOpportunityAppreciationHistory(opportunityId: string | null | undefined) {
  return useQuery({
    queryKey: ['appreciation-history', 'opportunity', opportunityId],
    queryFn: () =>
      apiGet<AppreciationHistoryItem[]>(`/opportunities/${opportunityId}/appreciation-history`),
    enabled: !!opportunityId,
    staleTime: 60_000,
  })
}

/* ── Transaction records ─────────────────────────────────────────── */

export interface TransactionRecord {
  id: string
  amount: number
  transactionDate: string
  referenceNumber: string | null
  description: string | null
  hasAcknowledgement: boolean
  ocrRawText: string | null
  createdAt: string
}

export interface CreateTransactionBody {
  amount: number
  transactionDate: string
  referenceNumber?: string
  description?: string
}

export function useHoldingTransactionRecords(holdingId: string | null | undefined) {
  return useQuery({
    queryKey: ['portfolio', 'transactions', 'holding', holdingId],
    queryFn: () => apiGet<TransactionRecord[]>(`/portfolio/holdings/${holdingId}/transactions`),
    enabled: !!holdingId,
    staleTime: 30_000,
  })
}

export function useCreateTransactionRecord(holdingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTransactionBody) =>
      apiPost<TransactionRecord>(`/portfolio/holdings/${holdingId}/transactions`, {
        amount: body.amount,
        transaction_date: body.transactionDate,
        reference_number: body.referenceNumber || undefined,
        description: body.description || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', 'transactions', 'holding', holdingId] })
    },
  })
}

export function useUploadAcknowledgement(holdingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { api } = await import('@/lib/api')
      const resp = await api.post<TransactionRecord>(
        `/portfolio/holdings/${holdingId}/transactions/upload-ack`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', 'transactions', 'holding', holdingId] })
    },
  })
}

export function useAcknowledgementUrl(holdingId: string, recordId: string | null) {
  return useQuery({
    queryKey: ['portfolio', 'ack-url', holdingId, recordId],
    queryFn: () =>
      apiGet<{ url: string; expiresIn: number }>(
        `/portfolio/holdings/${holdingId}/transactions/${recordId}/acknowledgement`
      ),
    enabled: !!recordId,
    staleTime: 4 * 60_000, // 4 min (URL expires in 5)
  })
}

export function useBuilderInvestorTransactions(opportunityId: string | null, investorUserId: string | null) {
  return useQuery({
    queryKey: ['builder', 'investor-transactions', opportunityId, investorUserId],
    queryFn: () =>
      apiGet<TransactionRecord[]>(`/opportunities/${opportunityId}/investors/${investorUserId}/transactions`),
    enabled: !!opportunityId && !!investorUserId,
    staleTime: 30_000,
  })
}

export function useBuilderAcknowledgementUrl(
  opportunityId: string | null,
  investorUserId: string | null,
  recordId: string | null
) {
  return useQuery({
    queryKey: ['builder', 'ack-url', opportunityId, investorUserId, recordId],
    queryFn: () =>
      apiGet<{ url: string; expiresIn: number }>(
        `/opportunities/${opportunityId}/investors/${investorUserId}/transactions/${recordId}/acknowledgement`
      ),
    enabled: !!opportunityId && !!investorUserId && !!recordId,
    staleTime: 4 * 60_000,
  })
}

/* ── Investment Ledger ───────────────────────────────────────────── */

export interface LedgerCollateral {
  id?: string
  project: string | null
  unitNo: string | null
  configuration: string | null
  sbua: number | null
  unitCost: number | null
}

export interface LedgerDocument {
  id: string
  filename: string | null
  contentType: string | null
  sizeBytes: number | null
  createdAt: string
}

export interface LedgerEntry {
  rowKey: string
  kind: 'derived' | 'manual'
  entryId: string | null
  sourceType: 'opportunity' | 'property' | null
  sourceId: string | null
  opportunityId: string | null
  propertyId: string | null
  projectName: string | null
  registeredName: string | null
  opportunityCode: string | null
  status: string | null
  configuration: string | null
  baseValue: number | null
  gst: number | null
  gstPaid: boolean
  totalValue: number | null
  referredBy: string | null
  typeOfInvestment: string | null
  extraSqft: number | null
  sweepOnOcLoan: number | null
  latestUpdates: string | null
  canDelete: boolean
  investedAt: string | null
  documents: LedgerDocument[]
  collateral: LedgerCollateral[]
}

/** Editable fields shared by create/update/overlay payloads. */
export interface LedgerEntryFields {
  registeredName?: string | null
  opportunityCode?: string | null
  status?: string | null
  configuration?: string | null
  baseValue?: number | null
  gst?: number | null
  gstPaid?: boolean
  totalValue?: number | null
  referredBy?: string | null
  typeOfInvestment?: string | null
  extraSqft?: number | null
  sweepOnOcLoan?: number | null
  latestUpdates?: string | null
  collateral?: LedgerCollateral[]
}

export interface AssetOption {
  id: string
  title: string
  code: string
}

export interface LedgerAssetOptions {
  opportunities: AssetOption[]
  properties: AssetOption[]
}

export function useInvestmentLedger() {
  return useQuery({
    queryKey: ['portfolio', 'ledger'],
    queryFn: () => apiGet<LedgerEntry[]>('/portfolio/ledger'),
    staleTime: 30_000,
  })
}

export function useLedgerAssetOptions(enabled: boolean) {
  return useQuery({
    queryKey: ['portfolio', 'ledger', 'asset-options'],
    queryFn: () => apiGet<LedgerAssetOptions>('/portfolio/ledger/asset-options'),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useCreateLedgerEntry() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Investment added' },
    mutationFn: (body: LedgerEntryFields & { opportunityId?: string; propertyId?: string }) =>
      apiPost<LedgerEntry>('/portfolio/ledger', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'ledger'] }),
  })
}

export function useUpdateLedgerEntry() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Investment updated' },
    mutationFn: ({ entryId, body }: { entryId: string; body: LedgerEntryFields }) =>
      apiPut<LedgerEntry>(`/portfolio/ledger/${entryId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'ledger'] }),
  })
}

export function useSaveLedgerOverlay() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Investment updated' },
    mutationFn: (
      body: LedgerEntryFields & { sourceType: 'opportunity' | 'property'; sourceId: string }
    ) => apiPost<LedgerEntry>('/portfolio/ledger/overlay', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'ledger'] }),
  })
}

export function useDeleteLedgerEntry() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Investment removed' },
    mutationFn: (entryId: string) => apiDelete<void>(`/portfolio/ledger/${entryId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'ledger'] }),
  })
}

export function useUploadLedgerDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ entryId, file }: { entryId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const { api } = await import('@/lib/api')
      const resp = await api.post<LedgerDocument>(
        `/portfolio/ledger/${entryId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return resp.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'ledger'] }),
  })
}

export function useDeleteLedgerDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, docId }: { entryId: string; docId: string }) =>
      apiDelete<void>(`/portfolio/ledger/${entryId}/documents/${docId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'ledger'] }),
  })
}

export function useLedgerDocumentUrl() {
  return useMutation({
    mutationFn: ({ entryId, docId }: { entryId: string; docId: string }) =>
      apiGet<{ url: string; expiresIn: number }>(
        `/portfolio/ledger/${entryId}/documents/${docId}`
      ),
  })
}
