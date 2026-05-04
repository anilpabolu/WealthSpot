import { useState } from 'react'
import { Loader2, TrendingUp, Clock, X } from 'lucide-react'
import { useOpportunities, useUpdateOpportunity } from '@/hooks/useOpportunities'
import { useAppreciationHistory, useCreateAppreciation } from '@/hooks/useAppreciation'
import { formatINRCompact } from '@/lib/formatters'

const DEAL_STATUSES = [
  'draft', 'pending_approval', 'approved', 'active', 'funding',
  'funded', 'rejected', 'closed', 'archived',
] as const

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  funding: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  funded: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  closed: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
  archived: 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

export default function DealLifecycleTab() {
  const [vaultFilter, setVaultFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data: oppsData, isLoading } = useOpportunities({
    ...(vaultFilter ? { vaultType: vaultFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  })
  const updateOpp = useUpdateOpportunity()

  const [appreciateModalDeal, setAppreciateModalDeal] = useState<{
    id: string; title: string; currentValuation: number | null; raisedAmount: number
  } | null>(null)
  const [appreciateMode, setAppreciateMode] = useState<'percentage' | 'absolute'>('percentage')
  const [appreciateValue, setAppreciateValue] = useState('')
  const [appreciateNote, setAppreciateNote] = useState('')
  const [showHistory, setShowHistory] = useState<string | null>(null)

  const createAppreciation = useCreateAppreciation(appreciateModalDeal?.id ?? '')
  const { data: historyData } = useAppreciationHistory(showHistory ?? undefined)

  const deals = oppsData?.items ?? []

  const handleStatusChange = (dealId: string, newStatus: string) => {
    updateOpp.mutate({ id: dealId, data: { status: newStatus } })
  }

  const openAppreciateModal = (deal: typeof deals[0]) => {
    setAppreciateModalDeal({ id: deal.id, title: deal.title, currentValuation: deal.currentValuation, raisedAmount: deal.raisedAmount })
    setAppreciateMode('percentage'); setAppreciateValue(''); setAppreciateNote('')
  }

  const handleAppreciate = () => {
    const val = parseFloat(appreciateValue)
    if (!val || val <= 0 || !appreciateModalDeal) return
    createAppreciation.mutate(
      { mode: appreciateMode, value: val, note: appreciateNote || undefined },
      { onSuccess: () => setAppreciateModalDeal(null) },
    )
  }

  const previewNewVal = (() => {
    if (!appreciateModalDeal) return null
    const val = parseFloat(appreciateValue)
    if (!val || val <= 0) return null
    const base = appreciateModalDeal.currentValuation ?? appreciateModalDeal.raisedAmount ?? 0
    return appreciateMode === 'percentage' ? base * (1 + val / 100) : base + val
  })()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Deal Lifecycle</h2>
        <p className="text-sm text-theme-secondary mt-1">Manage the lifecycle status of all opportunities across vaults.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={vaultFilter}
          onChange={(e) => setVaultFilter(e.target.value)}
          className="rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
        >
          <option value="">All Vaults</option>
          <option value="wealth">Wealth</option>
          <option value="safe">Safe</option>
          <option value="community">Community</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
        >
          <option value="">All Statuses</option>
          {DEAL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-theme-tertiary" />
        </div>
      ) : deals.length === 0 ? (
        <p className="text-sm text-theme-tertiary py-8 text-center">No deals found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-theme">
          <table className="w-full text-sm">
            <thead className="bg-theme-surface border-b border-theme">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Vault</th>
                <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-theme-secondary">Valuation</th>
                <th className="text-right px-4 py-3 font-semibold text-theme-secondary">Funding %</th>
                <th className="text-center px-4 py-3 font-semibold text-theme-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {deals.map((deal) => {
                const pct = deal.targetAmount ? Math.round((deal.raisedAmount / deal.targetAmount) * 100) : 0
                const valuation = deal.currentValuation ?? deal.raisedAmount
                const appPct = deal.raisedAmount > 0 ? ((valuation - deal.raisedAmount) / deal.raisedAmount * 100) : 0
                return (
                  <tr key={deal.id} className="hover:bg-theme-surface/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-theme-primary max-w-[180px] truncate">{deal.title}</p>
                      <p className="text-xs text-theme-tertiary">{deal.launchDate ? new Date(deal.launchDate).toLocaleDateString() : 'No launch date'}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-theme-secondary">{deal.vaultType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {deal.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-mono text-theme-primary">{formatINRCompact(valuation)}</p>
                      {appPct > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                          <TrendingUp className="h-3 w-3" /> +{appPct.toFixed(1)}%
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-theme-primary">{pct}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <select
                          value={deal.status}
                          onChange={(e) => handleStatusChange(deal.id, e.target.value)}
                          disabled={updateOpp.isPending}
                          className="rounded-md border border-theme bg-theme-surface px-2 py-1 text-xs text-theme-primary disabled:opacity-50"
                        >
                          {DEAL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => openAppreciateModal(deal)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/40 transition-colors"
                          title="Appreciate valuation"
                        >
                          <TrendingUp className="h-3.5 w-3.5" /> Appreciate
                        </button>
                        <button
                          onClick={() => setShowHistory(showHistory === deal.id ? null : deal.id)}
                          className="p-1 rounded text-theme-tertiary hover:text-theme-primary hover:bg-theme-surface transition-colors"
                          title="View appreciation history"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showHistory && historyData && historyData.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-theme-primary">Appreciation History</h3>
            <button onClick={() => setShowHistory(null)} className="p-1 rounded hover:bg-theme-surface">
              <X className="h-4 w-4 text-theme-tertiary" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {historyData.map((evt) => (
              <div key={evt.id} className="flex items-center justify-between p-2 bg-theme-surface rounded-lg text-xs">
                <div>
                  <span className="font-medium text-theme-primary">
                    {evt.mode === 'percentage' ? `+${evt.inputValue}%` : `+${formatINRCompact(evt.inputValue)}`}
                  </span>
                  <span className="text-theme-tertiary ml-2">
                    {formatINRCompact(evt.oldValuation)} → {formatINRCompact(evt.newValuation)}
                  </span>
                  {evt.note && <p className="text-theme-secondary mt-0.5">{evt.note}</p>}
                </div>
                <div className="text-right text-theme-tertiary shrink-0 ml-3">
                  <p>{evt.creatorName ?? 'System'}</p>
                  <p>{new Date(evt.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {appreciateModalDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAppreciateModalDeal(null)}>
          <div className="bg-theme-card rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-theme-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> Appreciate Valuation
              </h3>
              <button onClick={() => setAppreciateModalDeal(null)} className="p-1 rounded-lg hover:bg-theme-surface">
                <X className="h-5 w-5 text-theme-tertiary" />
              </button>
            </div>

            <p className="text-sm text-theme-secondary mb-1">{appreciateModalDeal.title}</p>
            <p className="text-xs text-theme-tertiary mb-4">
              Current valuation:{' '}
              <span className="font-semibold text-theme-primary">
                {formatINRCompact(appreciateModalDeal.currentValuation ?? appreciateModalDeal.raisedAmount)}
              </span>
            </p>

            <div className="flex rounded-lg border border-theme overflow-hidden mb-4">
              <button
                onClick={() => setAppreciateMode('percentage')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  appreciateMode === 'percentage' ? 'bg-emerald-500 text-white' : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'
                }`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setAppreciateMode('absolute')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  appreciateMode === 'absolute' ? 'bg-emerald-500 text-white' : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'
                }`}
              >
                Absolute (₹)
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-theme-secondary mb-1">
                {appreciateMode === 'percentage' ? 'Appreciation %' : 'Appreciation Amount (₹)'}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={appreciateValue}
                onChange={(e) => setAppreciateValue(e.target.value)}
                placeholder={appreciateMode === 'percentage' ? 'e.g. 10' : 'e.g. 500000'}
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
              />
            </div>

            {previewNewVal !== null && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/40">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  New valuation: <span className="font-bold">{formatINRCompact(previewNewVal)}</span>
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-theme-secondary mb-1">Note (optional)</label>
              <input
                type="text"
                value={appreciateNote}
                onChange={(e) => setAppreciateNote(e.target.value)}
                placeholder="e.g. Q1 market correction"
                maxLength={500}
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAppreciateModalDeal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-theme text-sm font-medium text-theme-secondary hover:bg-theme-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAppreciate}
                disabled={!appreciateValue || parseFloat(appreciateValue) <= 0 || createAppreciation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {createAppreciation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
