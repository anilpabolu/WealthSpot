import { useCallback, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Paperclip,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import {
  ASSESSMENT_CATEGORIES,
  humanStatus,
  iconForCategory,
  type AssessmentSubItem,
  type AssessmentSubItemRead,
} from '@/lib/assessments'
import {
  useOpportunityAssessments,
  useSaveAssessmentBulk,
  useUploadAssessmentDocument,
  type BulkAssessmentItem,
} from '@/hooks/useShield'
import { ShieldDot } from './ShieldDot'

interface Props {
  opportunityId: string
}

/**
 * Editable builder panel on the listing detail page.
 * Renders all 7 Shield categories as accordions. Each sub-item shows
 * an input matching its inputType, file upload, existing documents,
 * reviewer notes (read-only) and a status dot. Locked when passed/NA.
 */
export function BuilderShieldPanel({ opportunityId }: Props) {
  const { data, isLoading } = useOpportunityAssessments(opportunityId)
  const saveBulk = useSaveAssessmentBulk()
  const uploadDoc = useUploadAssessmentDocument()
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})

  // Local draft answers keyed by subcategory code
  const [draft, setDraft] = useState<Record<string, string>>({})
  const dirtyRef = useRef(false)

  const setAnswer = useCallback((code: string, value: string) => {
    dirtyRef.current = true
    setDraft((d) => ({ ...d, [code]: value }))
  }, [])

  const handleSave = useCallback(() => {
    if (!data) return
    const items: BulkAssessmentItem[] = []
    for (const cat of ASSESSMENT_CATEGORIES) {
      for (const sub of cat.subItems) {
        const val = draft[sub.code]
        if (val !== undefined) {
          items.push({
            categoryCode: cat.code,
            subcategoryCode: sub.code,
            builderAnswer: { value: val },
          })
        }
      }
    }
    if (items.length === 0) return
    saveBulk.mutate({ opportunityId, items }, {
      onSuccess: () => { dirtyRef.current = false },
    })
  }, [data, draft, opportunityId, saveBulk])

  if (isLoading) {
    return (
      <div className="card p-6 flex items-center gap-2 text-theme-tertiary">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading Shield assessment…</span>
      </div>
    )
  }

  if (!data) return null

  return (
    <section className="card p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={20}
            className={data.certified ? 'text-emerald-500' : 'text-theme-tertiary'}
          />
          <h2 className="text-lg font-bold text-theme-primary">
            WealthSpot Shield — Your Answers
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveBulk.isPending}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          {saveBulk.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save Answers
        </button>
      </header>

      <p className="text-[12px] text-theme-secondary">
        {data.passedCount} of {data.totalCount} checks resolved. Fill in as
        much as you can — our review team will follow up for missing evidence.
      </p>

      <div className="space-y-2">
        {data.categories.map((catRead) => {
          const cat = ASSESSMENT_CATEGORIES.find((c) => c.code === catRead.code)
          if (!cat) return null
          const Icon = iconForCategory(cat.icon)
          const open = openCats[cat.code] ?? false
          return (
            <div
              key={cat.code}
              className="rounded-xl border border-theme overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenCats((s) => ({ ...s, [cat.code]: !open }))
                }
                className="w-full flex items-center gap-3 px-4 py-3 bg-theme-surface hover:bg-theme-card transition"
              >
                <span className={cat.accentColor}>
                  <Icon size={18} />
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-semibold text-theme-primary">
                    {cat.name}
                  </span>
                  <span className="block text-[11px] text-theme-tertiary">
                    {catRead.passedCount}/{catRead.totalCount} passed ·{' '}
                    {humanStatus(catRead.status)}
                  </span>
                </span>
                <ShieldDot status={catRead.status} size="md" pulse />
                {open ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
              {open && (
                <div className="divide-y divide-theme bg-theme-card/60">
                  {catRead.subItems.map((subRead) => {
                    const subSpec = cat.subItems.find(
                      (s) => s.code === subRead.code,
                    )
                    if (!subSpec) return null
                    return (
                      <SubItemEditor
                        key={subRead.code}
                        opportunityId={opportunityId}
                        catCode={cat.code}
                        spec={subSpec}
                        read={subRead}
                        draftValue={draft[subRead.code]}
                        onChange={setAnswer}
                        uploadDoc={uploadDoc}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {saveBulk.isSuccess && (
        <p className="text-xs text-emerald-500 font-medium">
          ✓ Answers saved successfully
        </p>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-item editor row                                                */
/* ------------------------------------------------------------------ */

function SubItemEditor({
  opportunityId,
  catCode,
  spec,
  read,
  draftValue,
  onChange,
  uploadDoc,
}: {
  opportunityId: string
  catCode: string
  spec: AssessmentSubItem
  read: AssessmentSubItemRead
  draftValue: string | undefined
  onChange: (code: string, value: string) => void
  uploadDoc: ReturnType<typeof useUploadAssessmentDocument>
}) {
  const locked = read.status === 'passed' || read.status === 'not_applicable'
  const value =
    draftValue ?? (read.builderAnswer as { value?: string } | null)?.value ?? ''
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length === 0) return
      uploadDoc.mutate({
        opportunityId,
        category: catCode,
        subcategory: spec.code,
        files,
      })
      e.target.value = ''
    },
    [catCode, opportunityId, spec.code, uploadDoc],
  )

  return (
    <div className={`px-5 py-3 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <label className="block text-[12px] font-semibold text-theme-primary">
            {spec.label}
          </label>
          <div className="text-[11px] text-theme-tertiary">
            {spec.promptForBuilder}
          </div>
        </div>
        <ShieldDot status={read.status} size="sm" />
      </div>

      {/* Input field */}
      {spec.inputType === 'select' ? (
        <select
          className="input w-full text-sm mt-1"
          value={value}
          disabled={locked}
          onChange={(e) => onChange(spec.code, e.target.value)}
        >
          <option value="">— Select —</option>
          {spec.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : spec.inputType === 'boolean' ? (
        <div className="flex items-center gap-3 text-sm mt-1">
          {['yes', 'no'].map((v) => (
            <label
              key={v}
              className="flex items-center gap-1 text-theme-primary"
            >
              <input
                type="radio"
                name={`shield-${catCode}-${spec.code}`}
                value={v}
                checked={value === v}
                disabled={locked}
                onChange={() => onChange(spec.code, v)}
              />
              <span className="capitalize">{v}</span>
            </label>
          ))}
        </div>
      ) : spec.inputType === 'number' ? (
        <input
          type="number"
          className="input w-full text-sm mt-1"
          value={value}
          disabled={locked}
          onChange={(e) => onChange(spec.code, e.target.value)}
          placeholder="Enter a number"
        />
      ) : (
        <textarea
          className="input w-full text-sm mt-1"
          rows={2}
          value={value}
          disabled={locked}
          onChange={(e) => onChange(spec.code, e.target.value)}
          placeholder="Your answer…"
        />
      )}

      {/* File upload */}
      {spec.requiresDocument && !locked && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80"
          >
            <Upload size={12} />
            Upload evidence
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFile}
          />
          {uploadDoc.isPending && (
            <Loader2 size={12} className="animate-spin text-primary" />
          )}
        </div>
      )}

      {/* Existing documents */}
      {read.documents.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {read.documents.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1 text-[11px] text-theme-secondary bg-theme-surface rounded px-2 py-0.5"
            >
              <Paperclip size={10} />
              {doc.filename ?? 'Document'}
              {doc.sizeBytes != null && (
                <span className="text-theme-tertiary">
                  ({(doc.sizeBytes / 1024).toFixed(0)} KB)
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Reviewer note (read-only for builder) */}
      {read.reviewerNote && (
        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 rounded px-2 py-1 border border-amber-500/20">
          Reviewer: {read.reviewerNote}
        </p>
      )}
    </div>
  )
}
