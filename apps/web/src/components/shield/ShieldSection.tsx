import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, EyeOff, ShieldCheck, Eye } from 'lucide-react'
import {
  ASSESSMENT_CATEGORIES,
  findCategory,
  findSubItem,
  humanStatus,
  iconForCategory,
  type AssessmentSubItemRead,
} from '@/lib/assessments'
import { useOpportunityAssessments } from '@/hooks/useShield'
import { ShieldDot } from './ShieldDot'
import { ShieldDocLink } from './ShieldDocLink'
import { ShieldInfoModal } from './ShieldInfoModal'

interface ShieldSectionProps {
  opportunityId: string
  mode?: 'public' | 'builder'
}

/**
 *
 * Renders collapsible category rows with glowing dots, reviewer notes,
 * evidence download links (gated), and a "Risks you should know" strip.
 */
export function ShieldSection({ opportunityId }: ShieldSectionProps) {
  const { data, isLoading } = useOpportunityAssessments(opportunityId)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [showPopup, setShowPopup] = useState(false)

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
      <ShieldInfoModal open={showPopup} onClose={() => setShowPopup(false)} />
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={20}
              className={certified ? 'text-emerald-500' : 'text-theme-tertiary'}
            />
            <h2 className="text-lg font-bold text-theme-primary">
              Due Diligence
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
            <button onClick={() => setShowPopup(true)} className="ml-2 text-[#D4AF37] hover:underline inline-flex items-center gap-1 font-semibold">
              Learn more
            </button>
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

      <div className="space-y-3">
        {data.categories.map((catRead) => {
          const cat = findCategory(catRead.code)
          if (!cat) return null
          const Icon = iconForCategory(cat.icon)
          const open = openCats[cat.code] ?? false
          return (
            <div
              key={cat.code}
              className="rounded-xl border border-theme overflow-hidden bg-theme-surface/30 shadow-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenCats((s) => ({ ...s, [cat.code]: !open }))
                }
                className="w-full flex items-center gap-3 px-5 py-4 bg-theme-surface hover:bg-theme-card transition"
              >
                <span className={cat.accentColor}>
                  <Icon size={20} />
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-[15px] font-semibold text-theme-primary">
                    {cat.name}
                  </span>
                  <span className="block text-[12px] text-theme-tertiary mt-0.5">
                    {catRead.passedCount}/{catRead.totalCount} passed ·{' '}
                    {humanStatus(catRead.status)}
                  </span>
                </span>
                <ShieldDot status={catRead.status} size="md" pulse />
                {open ? <ChevronDown size={18} className="text-theme-tertiary" /> : <ChevronRight size={18} className="text-theme-tertiary" />}
              </button>
              {open && (
                <div className="w-full overflow-x-auto border-t border-theme/50">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-theme-surface/50 text-[11px] uppercase tracking-wider text-theme-tertiary border-b border-theme/50">
                        <th className="py-3 px-5 font-semibold w-[45%]">Question</th>
                        <th className="py-3 px-5 font-semibold w-[40%]">Answer</th>
                        <th className="py-3 px-5 font-semibold text-center w-[15%]">Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme/50">
                      {catRead.subItems.map((sub) => (
                        <SubItemRow
                          key={sub.code}
                          opportunityId={opportunityId}
                          categoryCode={catRead.code}
                          sub={sub}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {data.risks.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Risks you should know
            </span>
          </div>
          <ul className="space-y-2">
            {data.risks.map((r) => (
              <li key={r.id} className="text-[13px] text-theme-primary">
                <span className="font-semibold">{r.label}</span>
                <span className="text-theme-tertiary">
                  {' '}
                  · severity {r.severity}
                </span>
                {r.note && (
                  <span className="block text-theme-secondary text-[12px] mt-0.5">
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

function extractAnswerValue(
  builderAnswer: Record<string, unknown> | null | undefined,
): string | null {
  if (!builderAnswer) return null
  const v = builderAnswer.value ?? builderAnswer.text
  return v !== null && v !== undefined && v !== '' ? String(v) : null
}

function SubItemRow({
  opportunityId,
  categoryCode,
  sub,
}: {
  opportunityId: string
  categoryCode: string
  sub: AssessmentSubItemRead
}) {
  const subDef = findSubItem(categoryCode, sub.code)
  const visibleDocs = sub.documents.filter((d) => !d.locked)
  const answerValue = extractAnswerValue(
    sub.builderAnswer as Record<string, unknown> | null,
  )

  return (
    <tr className="hover:bg-theme-surface/50 transition-colors group">
      <td className="py-4 px-5 align-top">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <ShieldDot status={sub.status} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[13px] font-semibold text-theme-primary leading-snug">
                {sub.label}
              </span>
              {!sub.isPublic && (
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-theme-tertiary bg-theme-surface border border-theme rounded-full px-1.5 py-0.5 whitespace-nowrap">
                  <EyeOff size={10} />
                  Hidden
                </span>
              )}
            </div>
            {subDef?.promptForBuilder && (
              <p className="text-[11px] text-theme-secondary/80 leading-relaxed mt-1">
                {subDef.promptForBuilder}
              </p>
            )}
            {sub.reviewerNote && (
              <div className="mt-2.5 text-[11px] text-theme-secondary bg-theme-surface rounded-md p-2.5 border-l-2 border-amber-500/50 shadow-sm">
                <span className="font-semibold text-theme-primary mr-1">Reviewer Note:</span>
                {sub.reviewerNote}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-5 align-top border-l border-theme/30 bg-theme-surface/10">
        {answerValue !== null ? (
          <div className="text-[13px] text-theme-primary leading-relaxed">
            {answerValue}
          </div>
        ) : (
          <span className="text-[12px] text-theme-tertiary italic opacity-70">
            No answer provided yet
          </span>
        )}
      </td>
      <td className="py-4 px-5 align-top text-center border-l border-theme/30 bg-theme-surface/20">
        <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[40px]">
          {visibleDocs.length > 0 ? (
            visibleDocs.map((d) => (
              <ShieldDocLink
                key={d.id}
                opportunityId={opportunityId}
                doc={d}
                variant="icon"
              />
            ))
          ) : (
            <button
              disabled
              className="p-2 rounded-full bg-theme-surface/50 text-theme-tertiary/30 cursor-not-allowed"
              title="No document available"
            >
              <Eye size={18} className="opacity-50" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
