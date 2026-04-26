import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, Paperclip } from 'lucide-react'
import {
  ASSESSMENT_CATEGORIES,
  iconForCategory,
  type AssessmentSubItem,
} from '@/lib/assessments'

export interface BuilderAnswer {
  categoryCode: string
  subcategoryCode: string
  value: string
  files: File[]
  isPublic: boolean
}

interface BuilderShieldStepProps {
  answers: Record<string, BuilderAnswer>
  onChange: (key: string, answer: BuilderAnswer) => void
}

/**
 * Shield wizard step for the builder listing creation flow.
 *
 * All inputs are optional — builders can submit the listing with
 * zero answers. Admin will request missing evidence during review.
 */
export function BuilderShieldStep({ answers, onChange }: BuilderShieldStepProps) {
  const [open, setOpen] = useState<string | null>(ASSESSMENT_CATEGORIES[0]?.code ?? null)

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-[12px] text-theme-secondary">
        <strong className="text-theme-primary">WealthSpot Shield.</strong> Fill
        as much as you can — everything on this step is optional at submit. Our
        review team will follow up for whatever is missing.
      </div>

      {ASSESSMENT_CATEGORIES.map((cat) => {
        const isOpen = open === cat.code
        const Icon = iconForCategory(cat.icon)
        return (
          <div key={cat.code} className="rounded-xl border border-theme overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : cat.code)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-theme-surface hover:bg-theme-card transition"
            >
              <span className={cat.accentColor}>
                <Icon size={18} />
              </span>
              <span className="flex-1 text-left text-sm font-semibold text-theme-primary">
                {cat.name}
              </span>
              <span className="text-[11px] text-theme-tertiary">
                {cat.subItems.length} items
              </span>
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isOpen && (
              <div className="divide-y divide-theme bg-theme-card/60">
                {cat.subItems.map((sub) => (
                  <SubItemEditor
                    key={sub.code}
                    cat={cat.code}
                    sub={sub}
                    answer={answers[sub.code]}
                    onChange={(a) => onChange(sub.code, a)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SubItemEditor({
  cat,
  sub,
  answer,
  onChange,
}: {
  cat: string
  sub: AssessmentSubItem
  answer: BuilderAnswer | undefined
  onChange: (a: BuilderAnswer) => void
}) {
  const value = answer?.value ?? ''
  const files = answer?.files ?? []
  const isPublicVal = answer?.isPublic ?? true

  function set(nextValue: string) {
    onChange({
      categoryCode: cat,
      subcategoryCode: sub.code,
      value: nextValue,
      files,
      isPublic: isPublicVal,
    })
  }
  function setFiles(next: File[]) {
    onChange({
      categoryCode: cat,
      subcategoryCode: sub.code,
      value,
      files: next,
      isPublic: isPublicVal,
    })
  }
  function setIsPublic(next: boolean) {
    onChange({
      categoryCode: cat,
      subcategoryCode: sub.code,
      value,
      files,
      isPublic: next,
    })
  }

  return (
    <div className="px-5 py-3">
      <label className="block text-[12px] font-semibold text-theme-primary">
        {sub.label}
      </label>
      <div className="text-[11px] text-theme-tertiary mb-2">
        {sub.promptForBuilder}
      </div>
      {sub.inputType === 'select' ? (
        <select
          className="input w-full text-sm"
          value={value}
          onChange={(e) => set(e.target.value)}
        >
          <option value="">— Select —</option>
          {sub.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : sub.inputType === 'boolean' ? (
        <div className="flex items-center gap-3 text-sm">
          {['yes', 'no'].map((v) => (
            <label key={v} className="flex items-center gap-1 text-theme-primary">
              <input
                type="radio"
                name={`${cat}-${sub.code}`}
                value={v}
                checked={value === v}
                onChange={() => set(v)}
              />
              <span className="capitalize">{v}</span>
            </label>
          ))}
        </div>
      ) : sub.inputType === 'number' ? (
        <input
          type="number"
          className="input w-full text-sm"
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder="Enter a number"
        />
      ) : (
        <textarea
          className="input w-full text-sm"
          rows={2}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder="Your answer…"
        />
      )}
      {sub.requiresDocument && (
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          <label className="inline-flex items-center gap-1 cursor-pointer text-primary hover:text-primary/80">
            <Paperclip size={12} />
            <span>Attach evidence</span>
            <input
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) =>
                setFiles(Array.from(e.target.files ?? []))
              }
            />
          </label>
          {files.length > 0 && (
            <span className="text-theme-tertiary">
              {files.length} file(s) queued
            </span>
          )}
        </div>
      )}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setIsPublic(!isPublicVal)}
          className={[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition',
            isPublicVal
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
              : 'border-theme bg-theme-surface text-theme-tertiary',
          ].join(' ')}
        >
          {isPublicVal ? <Eye size={12} /> : <EyeOff size={12} />}
          <span>{isPublicVal ? 'Visible to investors' : 'Admin review only'}</span>
        </button>
      </div>
    </div>
  )
}
