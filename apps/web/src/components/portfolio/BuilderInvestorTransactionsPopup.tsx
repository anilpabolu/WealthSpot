/**
 * BuilderInvestorTransactionsPopup — lets a builder view the transaction
 * records uploaded by a specific investor for one of their opportunities.
 */

import { Eye, X, FileText, Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useBuilderInvestorTransactions, useBuilderAcknowledgementUrl } from '@/hooks/usePortfolio'
import type { BuilderInvestor } from '@/hooks/useBuilderInvestors'

/* ── helpers ─────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

/* ── AcknowledgementViewer ───────────────────────────────────────── */

function AcknowledgementViewer({
  opportunityId,
  investorId,
  recordId,
  onClose,
}: {
  opportunityId: string
  investorId: string
  recordId: string
  onClose: () => void
}) {
  const { data, isLoading, isError } = useBuilderAcknowledgementUrl(opportunityId, investorId, recordId)

  return (
    <div className="modal-overlay p-4 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex flex-col bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-theme shrink-0">
          <p className="font-semibold text-theme-primary text-sm">Acknowledgement Document</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors" aria-label="Close viewer">
            <X className="h-4 w-4 text-theme-tertiary" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-2">
          {isLoading && (
            <div className="flex items-center justify-center h-60 gap-2 text-theme-tertiary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading document…</span>
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center h-60 gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Could not load document.</span>
            </div>
          )}
          {data && (
            <iframe
              src={data.url}
              title="Acknowledgement Document"
              sandbox="allow-same-origin allow-scripts"
              className="w-full h-full min-h-[60vh] rounded-lg border-0"
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main popup ─────────────────────────────────────────────────── */

export function BuilderInvestorTransactionsPopup({
  investor,
  onClose,
}: {
  investor: BuilderInvestor
  onClose: () => void
}) {
  const [viewingAckId, setViewingAckId] = useState<string | null>(null)
  const { data: records, isLoading } = useBuilderInvestorTransactions(
    investor.opportunityId,
    investor.investorId
  )

  return (
    <>
      <div className="modal-overlay p-4 z-[60]" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-theme-primary text-lg">Transaction Records</h2>
              <p className="text-xs text-theme-tertiary truncate">
                {investor.investorName} · {investor.opportunityTitle}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors ml-3" aria-label="Close">
              <X className="h-5 w-5 text-theme-tertiary" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-theme-tertiary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading records…</span>
              </div>
            ) : !records || records.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-theme-tertiary mx-auto mb-3 opacity-40" />
                <p className="text-sm text-theme-secondary">No transaction records uploaded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-theme">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-[var(--bg-surface)] border-b border-theme">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Date</th>
                      <th className="text-right px-3 py-2.5 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Amount</th>
                      <th className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Reference #</th>
                      <th className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Description</th>
                      <th className="text-center px-3 py-2.5 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Ack.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, idx) => (
                      <tr key={r.id} className={`${idx === records.length - 1 ? '' : 'border-b border-theme/60'} hover:bg-[var(--bg-surface-hover)] transition-colors`}>
                        <td className="px-4 py-2.5 text-xs text-theme-secondary whitespace-nowrap">{formatDate(r.transactionDate)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-theme-primary whitespace-nowrap">{formatINR(r.amount)}</td>
                        <td className="px-3 py-2.5 text-xs text-theme-secondary whitespace-nowrap">{r.referenceNumber ?? '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-theme-secondary max-w-[140px] truncate">{r.description ?? '—'}</td>
                        <td className="px-3 py-2.5 text-center">
                          {r.hasAcknowledgement ? (
                            <button
                              onClick={() => setViewingAckId(r.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          ) : (
                            <span className="text-xs text-theme-tertiary">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingAckId && (
        <AcknowledgementViewer
          opportunityId={investor.opportunityId}
          investorId={investor.investorId}
          recordId={viewingAckId}
          onClose={() => setViewingAckId(null)}
        />
      )}
    </>
  )
}
