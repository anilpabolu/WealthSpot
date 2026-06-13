/**
 * InvestmentLedgerTable — the detailed, editable investment ledger shown under
 * Portfolio → Holdings. Rows are a merge of the user's real investments (derived,
 * not deletable) and manual back-entries. Add / edit / delete + per-row documents
 * and an expandable Collateral sub-table.
 */

import { Fragment, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import { useInvestmentLedger, useDeleteLedgerEntry, type LedgerEntry } from '@/hooks/usePortfolio'
import { LedgerEntryModal } from './LedgerEntryModal'

function formatINR(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

const th =
  'px-3 py-3 text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold whitespace-nowrap'
const td = 'px-3 py-3 text-xs text-[#F8F5FF] whitespace-nowrap'

function CollateralSubTable({ entry }: { entry: LedgerEntry }) {
  return (
    <div className="px-4 py-3 bg-[#160C34]/60 border-t border-[#D4AF37]/10">
      <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold mb-2">Collateral</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#CDBFF4]">
            <th className="text-left font-medium py-1 pr-4">Project</th>
            <th className="text-left font-medium py-1 pr-4">Unit No</th>
            <th className="text-left font-medium py-1 pr-4">Configuration</th>
            <th className="text-right font-medium py-1 pr-4">SBUA</th>
            <th className="text-right font-medium py-1">Unit Cost</th>
          </tr>
        </thead>
        <tbody>
          {entry.collateral.map((c) => (
            <tr key={c.id} className="text-[#F8F5FF] border-t border-[#D4AF37]/10">
              <td className="py-1.5 pr-4">{c.project ?? '—'}</td>
              <td className="py-1.5 pr-4">{c.unitNo ?? '—'}</td>
              <td className="py-1.5 pr-4">{c.configuration ?? '—'}</td>
              <td className="py-1.5 pr-4 text-right">{c.sbua != null ? c.sbua.toLocaleString('en-IN') : '—'}</td>
              <td className="py-1.5 text-right">{formatINR(c.unitCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InvestmentLedgerTable() {
  const { data: entries, isLoading } = useInvestmentLedger()
  const del = useDeleteLedgerEntry()
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; entry?: LedgerEntry } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-hero text-2xl font-bold text-[#2A1753]">Investment Ledger</h2>
          <p className="text-xs text-[#2A1753]/70 mt-0.5">
            Your investments and back-entries with full transaction details.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-[#2A1753] text-white hover:bg-[#3a1f70] transition-colors"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-[#2A1753]/60">
          <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Loading ledger…</span>
        </div>
      ) : !entries || entries.length === 0 ? (
        <div
          className="rounded-xl py-12 text-center"
          style={{ background: 'linear-gradient(160deg, #2A1753 0%, #1F1243 55%, #160C34 100%)', border: '1px solid #D4AF37' }}
        >
          <Building2 className="h-10 w-10 text-[#D4AF37] mx-auto mb-3 opacity-60" />
          <p className="text-[#F8F5FF] font-medium">No investments yet</p>
          <p className="text-[#CDBFF4] text-sm mt-1">Click “Add” to record your first investment.</p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ background: 'linear-gradient(160deg, #2A1753 0%, #1F1243 55%, #160C34 100%)', border: '1px solid #D4AF37' }}
        >
          <table className="w-full text-sm min-w-[1600px]">
            <thead className="border-b border-[#D4AF37]/30">
              <tr>
                <th className={`${th} text-left sticky left-0 z-10`} style={{ background: '#23134A' }}>Registered Name</th>
                <th className={`${th} text-left`}>Opportunity Code</th>
                <th className={`${th} text-left`}>Project Name</th>
                <th className={`${th} text-left`}>Status</th>
                <th className={`${th} text-left`}>Configuration</th>
                <th className={`${th} text-right`}>Base Value</th>
                <th className={`${th} text-right`}>GST</th>
                <th className={`${th} text-center`}>GST Paid</th>
                <th className={`${th} text-right`}>Total Value</th>
                <th className={`${th} text-center`}>Documents</th>
                <th className={`${th} text-left`}>Latest Updates</th>
                <th className={`${th} text-left`}>Referred By</th>
                <th className={`${th} text-left`}>Type of Investment</th>
                <th className={`${th} text-right`}>Extra Sq. Ft</th>
                <th className={`${th} text-right`}>Sweep On OC (Loan)</th>
                <th className={`${th} text-center`}>Collateral</th>
                <th className={`${th} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const isOpen = expanded.has(e.rowKey)
                return (
                  <Fragment key={e.rowKey}>
                    <tr className="border-b border-[#D4AF37]/20 hover:bg-[#CDBFF4]/5 transition-colors">
                      <td className={`${td} text-left font-medium sticky left-0 z-10`} style={{ background: '#23134A' }}>
                        {e.registeredName ?? '—'}
                      </td>
                      <td className={td}>{e.opportunityCode ?? '—'}</td>
                      <td className={`${td} max-w-[200px] truncate`} title={e.projectName ?? ''}>{e.projectName ?? '—'}</td>
                      <td className={td}>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#CDBFF4]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {e.status ?? '—'}
                        </span>
                      </td>
                      <td className={`${td} max-w-[160px] truncate`} title={e.configuration ?? ''}>{e.configuration ?? '—'}</td>
                      <td className={`${td} text-right font-mono`}>{formatINR(e.baseValue)}</td>
                      <td className={`${td} text-right font-mono`}>{formatINR(e.gst)}</td>
                      <td className={`${td} text-center`}>
                        {e.gstPaid ? <CheckCircle2 className="h-4 w-4 text-[#20E3B2] inline" /> : <span className="text-[#CDBFF4]">No</span>}
                      </td>
                      <td className={`${td} text-right font-mono font-semibold`}>{formatINR(e.totalValue)}</td>
                      <td className={`${td} text-center`}>
                        {e.documents.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[#D4AF37]">
                            <FileText className="h-3.5 w-3.5" /> {e.documents.length}
                          </span>
                        ) : (
                          <span className="text-[#CDBFF4]">—</span>
                        )}
                      </td>
                      <td className={`${td} max-w-[180px] truncate`} title={e.latestUpdates ?? ''}>{e.latestUpdates ?? '—'}</td>
                      <td className={td}>{e.referredBy ?? '—'}</td>
                      <td className={td}>{e.typeOfInvestment ?? '—'}</td>
                      <td className={`${td} text-right`}>{e.extraSqft != null ? e.extraSqft.toLocaleString('en-IN') : '—'}</td>
                      <td className={`${td} text-right font-mono`}>{formatINR(e.sweepOnOcLoan)}</td>
                      <td className={`${td} text-center`}>
                        {e.collateral.length > 0 ? (
                          <button onClick={() => toggle(e.rowKey)} className="inline-flex items-center gap-1 text-[#D4AF37] hover:underline">
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            {e.collateral.length}
                          </button>
                        ) : (
                          <span className="text-[#CDBFF4]">—</span>
                        )}
                      </td>
                      <td className={`${td} text-center`}>
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setModal({ mode: 'edit', entry: e })} className="text-[#D4AF37] hover:text-[#e3c14e]" aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {e.canDelete && e.entryId && (
                            <button
                              onClick={() => setConfirmDelete(e.entryId)}
                              disabled={del.isPending}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isOpen && e.collateral.length > 0 && (
                      <tr>
                        <td colSpan={17} className="p-0">
                          <CollateralSubTable entry={e} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <LedgerEntryModal mode={modal.mode} entry={modal.entry} onClose={() => setModal(null)} />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="modal-overlay p-4 z-[70]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-display font-bold text-theme-primary text-lg">Remove investment?</h3>
            <p className="text-sm text-theme-secondary">This back-entry will be permanently removed. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="text-sm px-4 py-2 rounded-lg text-theme-secondary hover:bg-[var(--bg-surface-hover)]">
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = confirmDelete
                  setConfirmDelete(null)
                  del.mutate(id)
                }}
                className="text-sm px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
