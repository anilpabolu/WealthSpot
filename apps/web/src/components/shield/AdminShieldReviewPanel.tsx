import { useMemo, useState } from 'react'
import { Check, Eye, EyeOff, Flag, Loader2, MinusCircle, ShieldCheck } from 'lucide-react'
import {
  ASSESSMENT_CATEGORIES,
  findCategory,
  findSubItem,
  humanStatus,
  iconForCategory,
  type AssessmentSubItemRead,
} from '@/lib/assessments'
import {
  useOpportunityAssessments,
  useReviewAssessment,
  useUpdateAssessmentVisibility,
} from '@/hooks/useShield'
import { ShieldDot } from './ShieldDot'
import { ShieldDocLink } from './ShieldDocLink'

interface AdminShieldReviewPanelProps {
  opportunityId: string
  onAllComplete?: (complete: boolean) => void
}

type VerdictAction = 'pass' | 'flag' | 'na'

/**
 * Embedded inside the ApprovalsPage drawer when the approval is for an
 * opportunity. Admin clicks Pass / Flag / N/A per sub-item and records a
 * reviewer note. Shows a summary strip so the reviewer always knows
 * whether the listing is ready to approve.
 */
export function AdminShieldReviewPanel({
  opportunityId,
  onAllComplete,
}: AdminShieldReviewPanelProps) {
  const { data, isLoading } = useOpportunityAssessments(opportunityId)
  const [activeCat, setActiveCat] = useState<string>(
    ASSESSMENT_CATEGORIES[0]?.code ?? '',
  )

  const complete = useMemo(() => {
    if (!data) return false
    return data.categories.every((c) =>
      c.subItems.every(
        (s) => s.status !== 'not_started' && s.status !== 'in_progress',
      ),
    )
  }, [data])

  useMemo(() => {
    onAllComplete?.(complete)
  }, [complete, onAllComplete])

  if (isLoading || !data) {
    return (
      <div className="card p-6 flex items-center gap-2 text-theme-tertiary">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading Shield review…</span>
      </div>
    )
  }

  const activeCategoryRead = data.categories.find((c) => c.code === activeCat)
  const activeCategorySpec = findCategory(activeCat)

  return (
    <div className="card p-0 overflow-hidden">
      <header className="px-5 py-4 border-b border-theme bg-theme-surface">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={18}
            className={data.certified ? 'text-emerald-500' : 'text-theme-tertiary'}
          />
          <span className="text-sm font-bold text-theme-primary">
            Shield Review
          </span>
          <span className="text-[11px] text-theme-tertiary">
            {data.passedCount}/{data.totalCount} passed
          </span>
          {data.certified && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
              Certified
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ASSESSMENT_CATEGORIES.map((cat) => {
            const catRead = data.categories.find((c) => c.code === cat.code)
            const Icon = iconForCategory(cat.icon)
            const isActive = activeCat === cat.code
            return (
              <button
                key={cat.code}
                type="button"
                onClick={() => setActiveCat(cat.code)}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-theme bg-theme-card text-theme-secondary hover:border-primary/40',
                ].join(' ')}
              >
                <Icon size={13} />
                <span className="font-medium">{cat.name.split(' ')[0]}</span>
                <ShieldDot
                  status={catRead?.status ?? 'not_started'}
                  size="sm"
                />
              </button>
            )
          })}
        </div>
      </header>

      <div className="divide-y divide-theme">
        {activeCategoryRead?.subItems.map((sub) => (
          <AdminSubItemRow
            key={sub.code}
            opportunityId={opportunityId}
            categoryCode={activeCategorySpec?.code ?? ''}
            sub={sub}
          />
        ))}
      </div>
    </div>
  )
}

function AdminSubItemRow({
  opportunityId,
  categoryCode,
  sub,
}: {
  opportunityId: string
  categoryCode: string
  sub: AssessmentSubItemRead
}) {
  const spec = findSubItem(categoryCode, sub.code)
  const review = useReviewAssessment()
  const visibility = useUpdateAssessmentVisibility()
  const [draftNote, setDraftNote] = useState(sub.reviewerNote ?? '')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>(
    sub.riskSeverity ?? 'medium',
  )

  async function runVerdict(action: VerdictAction) {
    await review.mutateAsync({
      opportunityId,
      subcategoryCode: sub.code,
      action,
      reviewerNote: draftNote.trim() || undefined,
      riskSeverity: action === 'flag' ? severity : undefined,
    })
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-2">
        <ShieldDot status={sub.status} size="sm" pulse={sub.status === 'flagged'} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-theme-primary">
            {sub.label}
          </div>
          <div className="text-[11px] text-theme-tertiary uppercase tracking-wider">
            {humanStatus(sub.status)}
            {sub.reviewedAt && (
              <>
                {' · '}
                reviewed {new Date(sub.reviewedAt).toLocaleDateString()}
              </>
            )}
          </div>
          {spec?.promptForBuilder && (
            <div className="text-[11px] text-theme-tertiary mt-0.5">
              Prompt: {spec.promptForBuilder}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            visibility.mutate({
              opportunityId,
              subcategoryCode: sub.code,
              isPublic: !sub.isPublic,
            })
          }
          disabled={visibility.isPending}
          title={
            sub.isPublic
              ? 'Visible to investors — click to hide'
              : 'Hidden from investors — click to show'
          }
          className={[
            'shrink-0 p-1.5 rounded-lg border transition',
            sub.isPublic
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
              : 'border-theme bg-theme-surface text-theme-tertiary',
          ].join(' ')}
        >
          {sub.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {sub.builderAnswer && Object.keys(sub.builderAnswer).length > 0 && (
        <div className="mt-3 rounded-lg bg-theme-surface p-3 text-[12px] text-theme-primary">
          <div className="text-[10px] uppercase tracking-wider text-theme-tertiary mb-1">
            Builder's answer
          </div>
          {renderAnswer(sub.builderAnswer)}
        </div>
      )}

      {sub.documents.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sub.documents.map((d) => (
            <ShieldDocLink
              key={d.id}
              opportunityId={opportunityId}
              doc={d}
            />
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2">
        <textarea
          rows={2}
          className="input w-full text-[12px]"
          placeholder="Reviewer note (optional for pass, recommended for flag)"
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => runVerdict('pass')}
            disabled={review.isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/20 text-[12px] font-semibold disabled:opacity-60"
          >
            <Check size={14} />
            Pass
          </button>
          <button
            type="button"
            onClick={() => runVerdict('flag')}
            disabled={review.isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-600 hover:bg-amber-500/20 text-[12px] font-semibold disabled:opacity-60"
          >
            <Flag size={14} />
            Flag
          </button>
          <button
            type="button"
            onClick={() => runVerdict('na')}
            disabled={review.isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-theme-surface border border-theme text-theme-secondary hover:border-theme-primary text-[12px] font-semibold disabled:opacity-60"
          >
            <MinusCircle size={14} />
            N/A
          </button>
          <select
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value as 'low' | 'medium' | 'high')
            }
            className="input text-[11px] py-1 px-2"
            aria-label="Risk severity"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {review.isPending && (
            <Loader2 size={14} className="animate-spin text-theme-tertiary" />
          )}
        </div>
      </div>
    </div>
  )
}

function renderAnswer(answer: Record<string, unknown>) {
  const entries = Object.entries(answer).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  )
  if (entries.length === 0) {
    return <span className="italic text-theme-tertiary">No answer</span>
  }
  return (
    <ul className="space-y-0.5">
      {entries.map(([k, v]) => (
        <li key={k}>
          <span className="text-theme-tertiary">{k}:</span>{' '}
          <span>{String(v)}</span>
        </li>
      ))}
    </ul>
  )
}
