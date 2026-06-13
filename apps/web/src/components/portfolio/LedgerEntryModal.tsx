/**
 * LedgerEntryModal — add / edit a row of the Investment Ledger.
 *
 * Add flow:  step 1 pick a listed asset (Opportunity / Property), step 2 fill the form.
 * Edit flow: form pre-filled; derived rows persist via the overlay endpoint, manual rows via PUT.
 * Documents can be staged in the same form and are uploaded right after the row is saved;
 * the popup closes automatically once everything succeeds.
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
  AlertCircle,
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
  type LedgerDocument,
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

/**
 * Minimal, non-blocking-on-required validation: nothing is mandatory, we only
 * flag amount fields that were typed but aren't a valid non-negative number.
 */
function validate(f: FormState): Record<string, string> {
  const errs: Record<string, string> = {}
  const numFields: [keyof FormState, string][] = [
    ['baseValue', 'Base Value'],
    ['gst', 'GST'],
    ['totalValue', 'Total Value'],
    ['extraSqft', 'Extra Sq. Ft'],
    ['sweepOnOcLoan', 'Sweep On OC (Loan)'],
  ]
  for (const [key, label] of numFields) {
    const raw = String(f[key]).trim()
    if (raw !== '' && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) {
      errs[key] = `${label} must be a non-negative number`
    }
  }
  f.collateral.forEach((c, i) => {
    if (c.sbua != null && (!Number.isFinite(Number(c.sbua)) || Number(c.sbua) < 0))
      errs[`collateral.${i}.sbua`] = 'SBUA must be ≥ 0'
    if (c.unitCost != null && (!Number.isFinite(Number(c.unitCost)) || Number(c.unitCost) < 0))
      errs[`collateral.${i}.unitCost`] = 'Unit Cost must be ≥ 0'
  })
  return errs
}

const inputBase =
  'w-full text-sm rounded-lg border bg-[#160C34] px-3 py-2 text-[#F8F5FF] placeholder-[#CDBFF4]/40 focus:outline-none focus:ring-2'
const inputOk = 'border-[#D4AF37]/30 focus:ring-[#D4AF37]/40'
const inputErr = 'border-red-500/70 focus:ring-red-500/40'
const labelCls = 'text-[11px] text-[#CDBFF4] mb-1 block uppercase tracking-wide'
const COLLATERAL_GRID = 'grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_auto] gap-2 items-center'

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" /> {msg}
    </p>
  )
}

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
          className={`${inputBase} ${inputOk} pl-9`}
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

/* ── Documents (existing uploaded + newly staged) ─────────────────── */

function DocumentsField({
  entryId,
  existing,
  setExisting,
  pending,
  setPending,
}: {
  entryId: string | null
  existing: LedgerDocument[]
  setExisting: (docs: LedgerDocument[]) => void
  pending: File[]
  setPending: (files: File[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const del = useDeleteLedgerDocument()
  const getUrl = useLedgerDocumentUrl()

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) setPending([...pending, ...files])
    e.target.value = ''
  }
  const view = async (docId: string) => {
    if (!entryId) return
    const res = await getUrl.mutateAsync({ entryId, docId })
    window.open(res.url, '_blank', 'noopener')
  }
  const removeExisting = (docId: string) => {
    if (!entryId) return
    del.mutate({ entryId, docId })
    setExisting(existing.filter((d) => d.id !== docId))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={labelCls}>Documents</p>
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" /> Attach
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFiles}
        />
      </div>
      {existing.length === 0 && pending.length === 0 ? (
        <p className="text-xs text-[#CDBFF4]/60">No documents attached.</p>
      ) : (
        <div className="space-y-1.5">
          {existing.map((d) => (
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
                <button onClick={() => removeExisting(d.id)} className="text-red-400 hover:text-red-300" aria-label="Delete document">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          ))}
          {pending.map((f, i) => (
            <div
              key={`pending-${i}`}
              className="flex items-center justify-between gap-2 text-sm bg-[#160C34] border border-dashed border-[#D4AF37]/30 rounded-lg px-3 py-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-[#CDBFF4] shrink-0" />
                <span className="truncate text-[#F8F5FF] text-xs">{f.name}</span>
                <span className="text-[10px] text-[#CDBFF4]/60 shrink-0">pending</span>
              </span>
              <button
                onClick={() => setPending(pending.filter((_, idx) => idx !== i))}
                className="text-red-400 hover:text-red-300 shrink-0"
                aria-label="Remove pending file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [existingDocs, setExistingDocs] = useState<LedgerDocument[]>(entry?.documents ?? [])
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const create = useCreateLedgerEntry()
  const update = useUpdateLedgerEntry()
  const overlay = useSaveLedgerOverlay()
  const upload = useUploadLedgerDocument()

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => {
      if (!e[k as string]) return e
      const { [k as string]: _drop, ...rest } = e
      return rest
    })
  }

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

  const handleSave = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaveError(false)
    setBusy(true)
    const payload = fieldsPayload(form)
    try {
      let saved: LedgerEntry | null = null
      if (mode === 'add') {
        if (!pick) return
        saved = await create.mutateAsync({
          ...payload,
          opportunityId: pick.kind === 'opportunity' ? pick.option.id : undefined,
          propertyId: pick.kind === 'property' ? pick.option.id : undefined,
        })
      } else if (entry) {
        if (entry.kind === 'manual' && entry.entryId) {
          saved = await update.mutateAsync({ entryId: entry.entryId, body: payload })
        } else if (entry.kind === 'derived' && entry.sourceType && entry.sourceId) {
          saved = await overlay.mutateAsync({
            ...payload,
            sourceType: entry.sourceType,
            sourceId: entry.sourceId,
          })
        }
      }

      // Upload any staged documents against the now-persisted row, then close.
      if (saved?.entryId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await upload.mutateAsync({ entryId: saved.entryId, file })
        }
      }
      onClose()
    } catch {
      setSaveError(true)
    } finally {
      setBusy(false)
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
                  <input className={`${inputBase} ${inputOk}`} value={form.registeredName} onChange={(e) => set('registeredName', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Opportunity Code</label>
                  <input className={`${inputBase} ${inputOk}`} value={form.opportunityCode} onChange={(e) => set('opportunityCode', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <input className={`${inputBase} ${inputOk}`} value={form.status} onChange={(e) => set('status', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Configuration</label>
                  <input className={`${inputBase} ${inputOk}`} value={form.configuration} onChange={(e) => set('configuration', e.target.value)} placeholder="e.g. 3 BHK, 2.5 BHK" />
                </div>
                <div>
                  <label className={labelCls}>Base Value (₹)</label>
                  <input type="number" min={0} className={`${inputBase} ${errors.baseValue ? inputErr : inputOk}`} value={form.baseValue} onChange={(e) => set('baseValue', e.target.value)} />
                  <FieldError msg={errors.baseValue} />
                </div>
                <div>
                  <label className={labelCls}>GST (₹)</label>
                  <input type="number" min={0} className={`${inputBase} ${errors.gst ? inputErr : inputOk}`} value={form.gst} onChange={(e) => set('gst', e.target.value)} />
                  <FieldError msg={errors.gst} />
                </div>
                <div>
                  <label className={labelCls}>Total Value (₹)</label>
                  <input type="number" min={0} className={`${inputBase} ${errors.totalValue ? inputErr : inputOk}`} value={form.totalValue} onChange={(e) => set('totalValue', e.target.value)} />
                  <FieldError msg={errors.totalValue} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.gstPaid} onChange={(e) => set('gstPaid', e.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />
                    <span className="text-sm text-[#F8F5FF]">GST Paid</span>
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Type of Investment</label>
                  <input className={`${inputBase} ${inputOk}`} value={form.typeOfInvestment} onChange={(e) => set('typeOfInvestment', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Referred By</label>
                  <input className={`${inputBase} ${inputOk}`} value={form.referredBy} onChange={(e) => set('referredBy', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Extra Sq. Ft</label>
                  <input type="number" min={0} className={`${inputBase} ${errors.extraSqft ? inputErr : inputOk}`} value={form.extraSqft} onChange={(e) => set('extraSqft', e.target.value)} />
                  <FieldError msg={errors.extraSqft} />
                </div>
                <div>
                  <label className={labelCls}>Sweep On OC (Loan) (₹)</label>
                  <input type="number" min={0} className={`${inputBase} ${errors.sweepOnOcLoan ? inputErr : inputOk}`} value={form.sweepOnOcLoan} onChange={(e) => set('sweepOnOcLoan', e.target.value)} />
                  <FieldError msg={errors.sweepOnOcLoan} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Latest Updates</label>
                  <textarea rows={2} className={`${inputBase} ${inputOk}`} value={form.latestUpdates} onChange={(e) => set('latestUpdates', e.target.value)} />
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
                    <div className={`${COLLATERAL_GRID} px-0.5`}>
                      <span className="text-[10px] uppercase tracking-wider text-[#CDBFF4]/70">Project</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#CDBFF4]/70">Unit No</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#CDBFF4]/70">Configuration</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#CDBFF4]/70 text-right">SBUA</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#CDBFF4]/70 text-right">Unit Cost</span>
                      <span className="w-7" />
                    </div>
                    {form.collateral.map((c, i) => (
                      <div key={i} className={COLLATERAL_GRID}>
                        <input className={`${inputBase} ${inputOk}`} placeholder="Project" value={c.project ?? ''} onChange={(e) => updateCollateral(i, { project: e.target.value })} />
                        <input className={`${inputBase} ${inputOk}`} placeholder="Unit No" value={c.unitNo ?? ''} onChange={(e) => updateCollateral(i, { unitNo: e.target.value })} />
                        <input className={`${inputBase} ${inputOk}`} placeholder="Config" value={c.configuration ?? ''} onChange={(e) => updateCollateral(i, { configuration: e.target.value })} />
                        <input className={`${inputBase} ${errors[`collateral.${i}.sbua`] ? inputErr : inputOk} text-right`} type="number" min={0} placeholder="SBUA" value={c.sbua ?? ''} onChange={(e) => updateCollateral(i, { sbua: e.target.value === '' ? null : Number(e.target.value) })} />
                        <input className={`${inputBase} ${errors[`collateral.${i}.unitCost`] ? inputErr : inputOk} text-right`} type="number" min={0} placeholder="Unit Cost" value={c.unitCost ?? ''} onChange={(e) => updateCollateral(i, { unitCost: e.target.value === '' ? null : Number(e.target.value) })} />
                        <button onClick={() => removeCollateral(i)} className="flex justify-center text-red-400 hover:text-red-300" aria-label="Remove unit">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="pt-2 border-t border-[#D4AF37]/20">
                <DocumentsField
                  entryId={entry?.entryId ?? null}
                  existing={existingDocs}
                  setExisting={setExistingDocs}
                  pending={pendingFiles}
                  setPending={setPendingFiles}
                />
              </div>

              {saveError && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" /> Something went wrong while saving. Please try again.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {showForm && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#D4AF37]/30 shrink-0">
            <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg text-[#CDBFF4] hover:bg-[#CDBFF4]/10 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={busy}
              className="text-sm px-5 py-2 rounded-lg font-semibold bg-[#D4AF37] text-[#160C34] hover:bg-[#e3c14e] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
