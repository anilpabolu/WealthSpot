/**
 * TransactionDetailsPopup — shows transaction records for a holding,
 * allows manual entry and acknowledgement document upload (with OCR).
 */

import { useState, useRef } from 'react'
import { X, Plus, Upload, Eye, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  useHoldingTransactionRecords,
  useCreateTransactionRecord,
  useUploadAcknowledgement,
  useAcknowledgementUrl,
  type HoldingItem,
  type CreateTransactionBody,
} from '@/hooks/usePortfolio'

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
  holdingId,
  recordId,
  onClose,
}: {
  holdingId: string
  recordId: string
  onClose: () => void
}) {
  const { data, isLoading, isError } = useAcknowledgementUrl(holdingId, recordId)

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

/* ── AddRecordForm ────────────────────────────────────────────────── */

function AddRecordForm({
  holdingId,
  onDone,
}: {
  holdingId: string
  onDone: () => void
}) {
  const [form, setForm] = useState<CreateTransactionBody>({
    amount: 0,
    transactionDate: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    description: '',
  })
  const { mutate, isPending, isError } = useCreateTransactionRecord(holdingId)

  const submit = () => {
    if (!form.amount || !form.transactionDate) return
    mutate(
      { ...form, amount: Number(form.amount) },
      { onSuccess: onDone }
    )
  }

  return (
    <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-theme">
      <p className="text-xs font-semibold text-theme-tertiary uppercase tracking-wide">Add Manual Record</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-theme-secondary mb-1 block">Amount (₹) *</label>
          <input
            type="number"
            min={0}
            value={form.amount || ''}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            className="w-full text-sm rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-theme-secondary mb-1 block">Date *</label>
          <input
            type="date"
            value={form.transactionDate}
            onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
            className="w-full text-sm rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-xs text-theme-secondary mb-1 block">Reference #</label>
          <input
            type="text"
            value={form.referenceNumber}
            onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
            className="w-full text-sm rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="UTR / NEFT ref"
          />
        </div>
        <div>
          <label className="text-xs text-theme-secondary mb-1 block">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full text-sm rounded-lg border border-theme bg-[var(--bg-surface)] px-3 py-2 text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Optional note"
          />
        </div>
      </div>
      {isError && <p className="text-xs text-red-500">Failed to save. Please try again.</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onDone} className="text-sm px-3 py-1.5 rounded-lg text-theme-secondary hover:bg-[var(--bg-surface)] transition-colors">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={isPending || !form.amount || !form.transactionDate}
          className="btn-primary text-sm px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>
    </div>
  )
}

/* ── Main popup ────────────────────────────────────────────────────── */

export function TransactionDetailsPopup({
  holding,
  onClose,
}: {
  holding: HoldingItem
  onClose: () => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewingAckId, setViewingAckId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: records, isLoading } = useHoldingTransactionRecords(holding.id)
  const { mutate: uploadAck, isPending: uploading } = useUploadAcknowledgement(holding.id)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadAck(file)
    e.target.value = ''
  }

  return (
    <>
      <div className="modal-overlay p-4 z-[60]" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-theme-primary text-lg truncate">Transaction Details</h2>
              <p className="text-xs text-theme-tertiary truncate">{holding.projectTitle}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors ml-3" aria-label="Close">
              <X className="h-5 w-5 text-theme-tertiary" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Records table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-theme-tertiary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading records…</span>
              </div>
            ) : !records || records.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-theme-tertiary mx-auto mb-2 opacity-40" />
                <p className="text-sm text-theme-secondary">No transaction records yet.</p>
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

            {/* Add form or add button */}
            {showAddForm ? (
              <AddRecordForm holdingId={holding.id} onDone={() => setShowAddForm(false)} />
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-theme hover:bg-[var(--bg-surface-hover)] text-theme-secondary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Record Manually
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-primary/40 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload Acknowledgement
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acknowledgement viewer layer */}
      {viewingAckId && (
        <AcknowledgementViewer
          holdingId={holding.id}
          recordId={viewingAckId}
          onClose={() => setViewingAckId(null)}
        />
      )}
    </>
  )
}
