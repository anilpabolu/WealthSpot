/**
 * LedgerEntryModal — add / edit a row of the Investment Ledger.
 *
 * Add flow:  step 1 pick a listed asset (Opportunity / Property), step 2 fill the form.
 * Edit flow: form pre-filled; derived rows persist via the overlay endpoint, manual rows via PUT.
 * Documents can be attached once the row exists in the DB (after the first save).
 */

import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Plus,
  Trash2,
  Search,
  Loader2,
  CheckCircle2,
  Upload,
  Eye,
  FileText,
  Building2,
} from 'lucide-react'
import {
  useLedgerAssetOptions,
  useCreateLedgerEntry,
  useUpdateLedgerEntry,
  useSaveLedgerOverlay,
  useUploadLedgerDocument,
  useDeleteLedgerDocument,
  useLedgerDocumentUrl,
  type LedgerEntry,
  type LedgerCollateral,
  type AssetOption,
} from '@/hooks/usePortfolio'

type Mode = 'add' | 'edit'

interface AssetPick {
  kind: 'opportunity' | 'property'
  option: AssetOption
}

interface FormState {
  registeredName: string
  opportunityCode: string
  status: string
  configuration: string
  baseValue: string
  gst: string
  gstPaid: boolean
  totalValue: string
  referredBy: string
  typeOfInvestment: string
  extraSqft: string
  sweepOnOcLoan: string
  latestUpdates: string
  collateral: LedgerCollateral[]
}

function emptyForm(): FormState {
  return {
    registeredName: '',
    opportunityCode: '',
    status: '',
    configuration: '',
    baseValue: '',
    gst: '',
    gstPaid: false,
    totalValue: '',
    referredBy: '',
    typeOfInvestment: '',
    extraSqft: '',
    sweepOnOcLoan: '',
    latestUpdates: '',
    collateral: [],
  }
}

function fromEntry(e: LedgerEntry): FormState {
  const numStr = (n: number | null) => (n === null || n === undefined ? '' : String(n))
  return {
    registeredName: e.registeredName ?? '',
    opportunityCode: e.opportunityCode ?? '',
    status: e.status ?? '',
    configuration: e.configuration ?? '',
    baseValue: numStr(e.baseValue),
    gst: numStr(e.gst),
    gstPaid: e.gstPaid,
    totalValue: numStr(e.totalValue),
    referredBy: e.referredBy ?? '',
    typeOfInvestment: e.typeOfInvestment ?? '',
    extraSqft: numStr(e.extraSqft),
    sweepOnOcLoan: numStr(e.sweepOnOcLoan),
    latestUpdates: e.latestUpdates ?? '',
    collateral: e.collateral.map((c) => ({ ...c })),
  }
}

const numOrNull = (s: string): number | null => {
  const t = s.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function fieldsPayload(f: FormState) {
  return {
    registeredName: f.registeredName || null,
    opportunityCode: f.opportunityCode || null,
    status: f.status || null,
    configuration: f.configuration || null,
    baseValue: numOrNull(f.baseValue),
    gst: numOrNull(f.gst),
    gstPaid: f.gstPaid,
    totalValue: numOrNull(f.totalValue),
    referredBy: f.referredBy || null,
    typeOfInvestment: f.typeOfInvestment || null,
    extraSqft: numOrNull(f.extraSqft),
    sweepOnOcLoan: numOrNull(f.sweepOnOcLoan),
    latestUpdates: f.latestUpdates || null,
    collateral: f.collateral.map((c) => ({
      project: c.project || null,
      unitNo: c.unitNo || null,
      configuration: c.configuration || null,
      sbua: typeof c.sbua === 'string' ? numOrNull(c.sbua) : c.sbua ?? null,
      unitCost: typeof c.unitCost === 'string' ? numOrNull(c.unitCost) : c.unitCost ?? null,
    })),
  }
}

const inputCls =
  'w-full text-sm rounded-lg border border-[#D4AF37]/30 bg-[#160C34] px-3 py-2 text-[#F8F5FF] placeholder-[#CDBFF4]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40'
const labelCls = 'text-[11px] text-[#CDBFF4] mb-1 block uppercase tracking-wide'

/* ── Asset picker (step 1 of add) ────────────────────────────────── */

function AssetPicker({ onPick }: { onPick: (p: AssetPick) => void }) {
  const { data, isLoading } = useLedgerAssetOptions(true)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const match = (o: AssetOption) =>
      !term || o.title.toLowerCase().includes(term) || o.code.toLowerCase().includes(term)
    return {
      opportunities: (data?.opportunities ?? []).filter(match),
      properties: (data?.properties ?? []).filter(match),
    }
  }, [data, q])

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#CDBFF4]">Which property is this investment for?</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#CDBFF4]/50" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or code…"
          className={`${inputCls} pl-9`}
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-[#CDBFF4]">
          <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto space-y-4">
          {(['opportunities', 'properties'] as const).map((group) => {
            const items = filtered[group]
            if (items.length === 0) return null
            const kind = group === 'opportunities' ? 'opportunity' : 'property'
            return (
              <div key={group}>
                <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold mb-1.5">
                  {group === 'opportunities' ? 'Opportunities' : 'Properties'}
                </p>
                <div className="space-y-1.5">
                  {items.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => onPick({ kind, option: o })}
                      className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg border border-[#D4AF37]/20 hover:bg-[#CDBFF4]/5 transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-[#F8F5FF] truncate">{o.title}</span>
                        <span className="block text-[11px] text-[#CDBFF4]">{o.code}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {filtered.opportunities.length === 0 && filtered.properties.length === 0 && (
            <p className="text-sm text-[#CDBFF4] text-center py-8">No matching assets.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Documents section ───────────────────────────────────────────── */

function DocumentsSection({ entry }: { entry: LedgerEntry }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useUploadLedgerDocument()
  const del = useDeleteLedgerDocument()
  const getUrl = useLedgerDocumentUrl()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && entry.entryId) upload.mutate({ entryId: entry.entryId, file })
    e.target.value = ''
  }
  const view = async (docId: string) => {
    if (!entry.entryId) return
    const res = await getUrl.mutateAsync({ entryId: entry.entryId, docId })
    window.open(res.url, '_blank', 'noopener')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={labelCls}>Documents</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors disabled:opacity-50"
        >
          {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFile}
        />
      </div>
      {entry.documents.length === 0 ? (
        <p className="text-xs text-[#CDBFF4]/60">No documents attached.</p>
      ) : (
        <div className="space-y-1.5">
          {entry.documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 text-sm bg-[#160C34] border border-[#D4AF37]/20 rounded-lg px-3 py-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span className="truncate text-[#F8F5FF] text-xs">{d.filename ?? 'Document'}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <button onClick={() => view(d.id)} className="text-[#D4AF37] hover:underline text-xs inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button
                  onClick={() => entry.entryId && del.mutate({ entryId: entry.entryId, docId: d.id })}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main modal ──────────────────────────────────────────────────── */

export function LedgerEntryModal({
  mode,
  entry,
  onClose,
}: {
  mode: Mode
  entry?: LedgerEntry
  onClose: () => void
}) {
  const [pick, setPick] = useState<AssetPick | null>(null)
  const [form, setForm] = useState<FormState>(() => (entry ? fromEntry(entry) : emptyForm()))
  // After a save, hold the persisted entry so documents can be managed inline.
  const [savedEntry, setSavedEntry] = useState<LedgerEntry | null>(
    mode === 'edit' && entry?.entryId ? entry : null
  )

  const create = useCreateLedgerEntry()
  const update = useUpdateLedgerEntry()
  const overlay = useSaveLedgerOverlay()
  const saving = create.isPending || update.isPending || overlay.isPending

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const addCollateral = () =>
    setForm((f) => ({
      ...f,
      collateral: [...f.collateral, { project: '', unitNo: '', configuration: '', sbua: null, unitCost: null }],
    }))
  const updateCollateral = (i: number, patch: Partial<LedgerCollateral>) =>
    setForm((f) => ({
      ...f,
      collateral: f.collateral.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    }))
  const removeCollateral = (i: number) =>
    setForm((f) => ({ ...f, collateral: f.collateral.filter((_, idx) => idx !== i) }))

  const handleSave = () => {
    const payload = fieldsPayload(form)
    if (mode === 'add') {
      if (!pick) return
      create.mutate(
        {
          ...payload,
          opportunityId: pick.kind === 'opportunity' ? pick.option.id : undefined,
          propertyId: pick.kind === 'property' ? pick.option.id : undefined,
        },
        { onSuccess: (data) => setSavedEntry(data) }
      )
    } else if (entry) {
      if (entry.kind === 'manual' && entry.entryId) {
        update.mutate(
          { entryId: entry.entryId, body: payload },
          { onSuccess: (data) => setSavedEntry(data) }
        )
      } else if (entry.kind === 'derived' && entry.sourceType && entry.sourceId) {
        overlay.mutate(
          { ...payload, sourceType: entry.sourceType, sourceId: entry.sourceId },
          { onSuccess: (data) => setSavedEntry(data) }
        )
      }
    }
  }

  const assetTitle = pick?.option.title ?? entry?.projectName ?? ''
  const showForm = mode === 'edit' || pick !== null

  return createPortal(
    <div className="modal-overlay p-4 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex flex-col rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh]"
        style={{ background: 'linear-gradient(160deg, #2A1753 0%, #1F1243 55%, #160C34 100%)', border: '1px solid #D4AF37' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/30 shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-[#F8F5FF] text-lg truncate">
              {mode === 'add' ? 'Add Investment' : 'Edit Investment'}
            </h2>
            {assetTitle && <p className="text-xs text-[#CDBFF4] truncate">{assetTitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#CDBFF4]/10 transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-[#CDBFF4]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!showForm ? (
            <AssetPicker onPick={setPick} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Registered Name</label>
                  <input className={inputCls} value={form.registeredName} onChange={(e) => set('registeredName', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Opportunity Code</label>
                  <input className={inputCls} value={form.opportunityCode} onChange={(e) => set('opportunityCode', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <input className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Configuration</label>
                  <input className={inputCls} value={form.configuration} onChange={(e) => set('configuration', e.target.value)} placeholder="e.g. 3 BHK, 2.5 BHK" />
                </div>
                <div>
                  <label className={labelCls}>Base Value (₹)</label>
                  <input type="number" min={0} className={inputCls} value={form.baseValue} onChange={(e) => set('baseValue', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>GST (₹)</label>
                  <input type="number" min={0} className={inputCls} value={form.gst} onChange={(e) => set('gst', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Total Value (₹)</label>
                  <input type="number" min={0} className={inputCls} value={form.totalValue} onChange={(e) => set('totalValue', e.target.value)} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.gstPaid} onChange={(e) => set('gstPaid', e.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />
                    <span className="text-sm text-[#F8F5FF]">GST Paid</span>
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Type of Investment</label>
                  <input className={inputCls} value={form.typeOfInvestment} onChange={(e) => set('typeOfInvestment', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Referred By</label>
                  <input className={inputCls} value={form.referredBy} onChange={(e) => set('referredBy', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Extra Sq. Ft</label>
                  <input type="number" min={0} className={inputCls} value={form.extraSqft} onChange={(e) => set('extraSqft', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Sweep On OC (Loan) (₹)</label>
                  <input type="number" min={0} className={inputCls} value={form.sweepOnOcLoan} onChange={(e) => set('sweepOnOcLoan', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Latest Updates</label>
                  <textarea rows={2} className={inputCls} value={form.latestUpdates} onChange={(e) => set('latestUpdates', e.target.value)} />
                </div>
              </div>

              {/* Collateral */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className={labelCls}>Collateral</p>
                  <button onClick={addCollateral} className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Add unit
                  </button>
                </div>
                {form.collateral.length === 0 ? (
                  <p className="text-xs text-[#CDBFF4]/60">No collateral units added.</p>
                ) : (
                  <div className="space-y-2">
                    {form.collateral.map((c, i) => (
                      <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                        <input className={`${inputCls} col-span-3`} placeholder="Project" value={c.project ?? ''} onChange={(e) => updateCollateral(i, { project: e.target.value })} />
                        <input className={`${inputCls} col-span-2`} placeholder="Unit No" value={c.unitNo ?? ''} onChange={(e) => updateCollateral(i, { unitNo: e.target.value })} />
                        <input className={`${inputCls} col-span-2`} placeholder="Config" value={c.configuration ?? ''} onChange={(e) => updateCollateral(i, { configuration: e.target.value })} />
                        <input className={`${inputCls} col-span-2`} type="number" placeholder="SBUA" value={c.sbua ?? ''} onChange={(e) => updateCollateral(i, { sbua: e.target.value === '' ? null : Number(e.target.value) })} />
                        <input className={`${inputCls} col-span-2`} type="number" placeholder="Unit Cost" value={c.unitCost ?? ''} onChange={(e) => updateCollateral(i, { unitCost: e.target.value === '' ? null : Number(e.target.value) })} />
                        <button onClick={() => removeCollateral(i)} className="col-span-1 flex justify-center text-red-400 hover:text-red-300" aria-label="Remove unit">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents (after the row exists) */}
              {savedEntry?.entryId ? (
                <div className="pt-2 border-t border-[#D4AF37]/20">
                  <DocumentsSection entry={savedEntry} />
                </div>
              ) : (
                <p className="text-[11px] text-[#CDBFF4]/60 pt-2 border-t border-[#D4AF37]/20">
                  Save this investment to attach documents.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {showForm && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#D4AF37]/30 shrink-0">
            <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg text-[#CDBFF4] hover:bg-[#CDBFF4]/10 transition-colors">
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-5 py-2 rounded-lg font-semibold bg-[#D4AF37] text-[#160C34] hover:bg-[#e3c14e] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {savedEntry ? 'Save changes' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
