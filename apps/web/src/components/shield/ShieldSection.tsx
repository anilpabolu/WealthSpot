import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import {
  ASSESSMENT_CATEGORIES,
  findCategory,
  humanStatus,
  iconForCategory,
  resultColor,
  resultLabel,
  type AssessmentSubItemRead,
} from '@/lib/assessments'
import { useOpportunityAssessments } from '@/hooks/useShield'
import { ShieldDot } from './ShieldDot'
import { ShieldDocLink } from './ShieldDocLink'

interface ShieldSectionProps {
  opportunityId: string
  mode?: 'public' | 'builder'
}

/**
 * The Shield section that lands on the opportunity detail page +
 * the builder's read-only view of their own listing.
 *
 * Renders collapsible category rows with glowing dots, reviewer notes,
 * evidence download links (gated), and a "Risks you should know" strip.
 */
export function ShieldSection({ opportunityId }: ShieldSectionProps) {
  const { data, isLoading } = useOpportunityAssessments(opportunityId)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})

  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-5 w-48 bg-theme-surface rounded mb-3" />
        <div className="h-3 w-full bg-theme-surface rounded" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const certified = data.certified

  return (
    <section className="card p-6">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={20}
              className={certified ? 'text-emerald-500' : 'text-theme-tertiary'}
            />
            <h2 className="text-lg font-bold text-theme-primary">
              WealthSpot Shield
            </h2>
            {certified && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                Certified
              </span>
            )}
          </div>
          <p className="text-[12px] text-theme-secondary mt-1">
            {data.passedCount} of {data.totalCount} checks passed across all 7
            layers.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {ASSESSMENT_CATEGORIES.map((cat) => {
            const catRead = data.categories.find((c) => c.code === cat.code)
            return (
              <ShieldDot
                key={cat.code}
                status={catRead?.status ?? 'not_started'}
                title={cat.name}
                size="md"
              />
            )
          })}
        </div>
      </header>

      <div className="space-y-2">
        {data.categories.map((catRead) => {
          const cat = findCategory(catRead.code)
          if (!cat) return null
          const Icon = iconForCategory(cat.icon)
          const open = openCats[cat.code] ?? catRead.status === 'flagged'
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
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {open && (
                <div className="divide-y divide-theme">
                  {catRead.subItems.map((sub) => (
                    <SubItemRow
                      key={sub.code}
                      opportunityId={opportunityId}
                      sub={sub}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {data.risks.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Risks you should know
            </span>
          </div>
          <ul className="space-y-1.5">
            {data.risks.map((r) => (
              <li key={r.id} className="text-[12px] text-theme-primary">
                <span className="font-semibold">{r.label}</span>
                <span className="text-theme-tertiary">
                  {' '}
                  · severity {r.severity}
                </span>
                {r.note && (
                  <span className="block text-theme-secondary text-[11px]">
                    {r.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function SubItemRow({
  opportunityId,
  sub,
}: {
  opportunityId: string
  sub: AssessmentSubItemRead
}) {
  const visibleDocs = sub.documents.filter((d) => !d.locked)
  return (
    <div className="px-5 py-3 bg-theme-card/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldDot status={sub.status} size="sm" />
            <span className="text-[13px] font-medium text-theme-primary">
              {sub.label}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${resultColor(sub.status)}`}
            >
              {resultLabel(sub.status)}
            </span>
            <span className="text-[10px] text-theme-tertiary">
              {humanStatus(sub.status)}
            </span>
          </div>
          {sub.reviewerNote && (
            <p className="mt-1 text-[11px] text-theme-secondary italic">
              Reviewer: {sub.reviewerNote}
            </p>
          )}
          {!!sub.builderAnswer?.text && (
            <blockquote className="mt-1.5 pl-3 border-l-2 border-primary/50 text-[11px] text-theme-primary bg-primary/5 rounded-r py-1">
              <span className="text-theme-tertiary font-semibold">Builder answer: </span>
              {String(sub.builderAnswer.text)}
            </blockquote>
          )}
        </div>
      </div>
      {visibleDocs.length > 0 && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleDocs.map((d) => (
            <ShieldDocLink
              key={d.id}
              opportunityId={opportunityId}
              doc={d}
            />
          ))}
        </div>
      )}
    </div>
  )
}
