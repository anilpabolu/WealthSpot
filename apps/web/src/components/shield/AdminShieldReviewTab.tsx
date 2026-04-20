import { useCallback, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Flag,
  Loader2,
  MinusCircle,
  Search,
  ShieldCheck,
} from 'lucide-react'
import {
  ASSESSMENT_CATEGORIES,
  findCategory,
  humanStatus,
  iconForCategory,
  type AssessmentSubItemRead,
} from '@/lib/assessments'
import {
  useOpportunityAssessments,
  useReviewAssessment,
  useDownloadAssessmentDocument,
} from '@/hooks/useShield'
import { useOpportunities, type OpportunityItem } from '@/hooks/useOpportunities'
import { ShieldMetricsCard } from './ShieldMetricsCard'
import { ShieldDot } from './ShieldDot'

const VAULT_FILTERS = [
  { value: '', label: 'All Vaults' },
  { value: 'wealth', label: 'Wealth Vault' },
  { value: 'opportunity', label: 'Opportunity Vault' },
  { value: 'community', label: 'Community Vault' },
]

/**
 * Standalone admin tab inside Command Control for reviewing
 * Shield assessments across all opportunities.
 *
 * Layout: vault filter + opportunity list (left) → per sub-item review (right).
 */
export function AdminShieldReviewTab() {
  const [vaultFilter, setVaultFilter] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null)
  const { data: pageData, isLoading: oppsLoading } = useOpportunities({
    vaultType: vaultFilter || undefined,
    page: 1,
  })

  const opps = useMemo(() => {
    const list = pageData?.items ?? []
    if (!searchQ.trim()) return list
    const q = searchQ.toLowerCase()
    return list.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.slug.toLowerCase().includes(q) ||
        (o.city ?? '').toLowerCase().includes(q),
    )
  }, [pageData, searchQ])

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-theme-primary">
        Shield Review
      </h2>

      {/* Analytics strip */}
      <ShieldMetricsCard />

      {/* Main layout */}
      <div className="flex gap-6 min-h-[600px]">
        {/* Left — opportunity list */}
        <div className="w-80 shrink-0 space-y-3">
          <select
            value={vaultFilter}
            onChange={(e) => {
              setVaultFilter(e.target.value)
              setSelectedOpp(null)
            }}
            className="input w-full text-sm"
          >
            {VAULT_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary"
            />
            <input
              type="text"
              placeholder="Search listings…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="input w-full text-sm pl-8"
            />
          </div>

          <div className="space-y-1 max-h-[520px] overflow-y-auto">
            {oppsLoading && (
              <div className="flex items-center gap-2 py-8 justify-center text-theme-tertiary text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            )}
            {!oppsLoading && opps.length === 0 && (
              <p className="text-sm text-theme-tertiary py-4 text-center">
                No listings found
              </p>
            )}
            {opps.map((o) => (
              <OppListItem
                key={o.id}
                opp={o}
                active={selectedOpp === o.id}
                onSelect={() => setSelectedOpp(o.id)}
              />
            ))}
          </div>
        </div>

        {/* Right — review panel */}
        <div className="flex-1 min-w-0">
          {selectedOpp ? (
            <ReviewPanel opportunityId={selectedOpp} />
          ) : (
            <div className="flex items-center justify-center h-full text-theme-tertiary text-sm">
              Select a listing from the left to review its Shield assessment
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Small opportunity row                                              */
/* ------------------------------------------------------------------ */
function OppListItem({
  opp,
  active,
  onSelect,
}: {
  opp: OpportunityItem
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
        active
          ? 'bg-primary/10 border border-primary/30'
          : 'border border-transparent hover:bg-theme-card'
      }`}
    >
      <span className="block text-sm font-medium text-theme-primary truncate">
        {opp.title}
      </span>
      <span className="flex items-center gap-2 text-[11px] text-theme-tertiary mt-0.5">
        <span className="capitalize">{opp.vaultType}</span>
        <span>·</span>
        <span className="capitalize">{opp.status}</span>
        {opp.city && (
          <>
            <span>·</span>
            <span>{opp.city}</span>
          </>
        )}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Full review panel for one opportunity                              */
/* ------------------------------------------------------------------ */
function ReviewPanel({ opportunityId }: { opportunityId: string }) {
  const { data, isLoading } = useOpportunityAssessments(opportunityId)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center text-theme-tertiary text-sm">
        <Loader2 size={14} className="animate-spin" /> Loading assessment…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <ShieldCheck
          size={20}
          className={data.certified ? 'text-emerald-500' : 'text-theme-tertiary'}
        />
        <span className="text-sm font-bold text-theme-primary">
          {data.passedCount}/{data.totalCount} passed
        </span>
        {data.certified && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
            Certified
          </span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          {ASSESSMENT_CATEGORIES.map((cat) => {
            const cr = data.categories.find((c) => c.code === cat.code)
            return (
              <ShieldDot
                key={cat.code}
                status={cr?.status ?? 'not_started'}
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
                  {catRead.subItems.map((sub) => (
                    <ReviewSubItemRow
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

      {/* Risk flags */}
      {data.risks.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            Active Risk Flags
          </span>
          <ul className="mt-2 space-y-1.5">
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
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Per sub-item review row                                            */
/* ------------------------------------------------------------------ */
function ReviewSubItemRow({
  opportunityId,
  sub,
}: {
  opportunityId: string
  sub: AssessmentSubItemRead
}) {
  const review = useReviewAssessment()
  const download = useDownloadAssessmentDocument()
  const [note, setNote] = useState(sub.reviewerNote ?? '')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>(
    sub.riskSeverity ?? 'medium',
  )

  const verdictBtn = (
    action: 'pass' | 'flag' | 'na',
    label: string,
    icon: React.ReactNode,
    color: string,
  ) => (
    <button
      type="button"
      disabled={review.isPending}
      onClick={() =>
        review.mutate({
          opportunityId,
          subcategoryCode: sub.code,
          action,
          reviewerNote: note || undefined,
          riskSeverity: action === 'flag' ? severity : undefined,
        })
      }
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${color}`}
    >
      {icon}
      {label}
    </button>
  )

  const handleDownload = useCallback(
    (mediaId: string) => {
      download.mutate(
        { opportunityId, mediaId },
        {
          onSuccess: (doc) => {
            if (doc.url) window.open(doc.url, '_blank')
          },
        },
      )
    },
    [download, opportunityId],
  )

  const spec = ASSESSMENT_CATEGORIES.flatMap((c) => c.subItems).find(
    (s) => s.code === sub.code,
  )

  return (
    <div className="px-5 py-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="block text-[12px] font-semibold text-theme-primary">
            {spec?.label ?? sub.code}
          </span>
          {spec && (
            <span className="block text-[11px] text-theme-tertiary">
              {spec.promptForBuilder}
            </span>
          )}
        </div>
        <ShieldDot status={sub.status} size="sm" />
      </div>

      {/* Builder answer */}
      {sub.builderAnswer && (
        <div className="text-[12px] text-theme-primary bg-theme-surface rounded px-3 py-2 border border-theme">
          <span className="text-theme-tertiary">Builder answer: </span>
          {typeof (sub.builderAnswer as Record<string, unknown>)?.value === 'string'
            ? (sub.builderAnswer as Record<string, unknown>).value as string
            : JSON.stringify(sub.builderAnswer)}
        </div>
      )}

      {/* Documents */}
      {sub.documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sub.documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => handleDownload(doc.id)}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 bg-primary/5 rounded px-2 py-1"
            >
              <Download size={10} />
              {doc.filename ?? 'Document'}
              {doc.sizeBytes != null && (
                <span className="text-theme-tertiary">
                  ({(doc.sizeBytes / 1024).toFixed(0)} KB)
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Reviewer note input */}
      <textarea
        className="input w-full text-[12px]"
        rows={1}
        placeholder="Reviewer note…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Verdict buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {verdictBtn(
          'pass',
          'Pass',
          <Check size={12} />,
          sub.status === 'passed'
            ? 'bg-emerald-500 text-white'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
        )}
        {verdictBtn(
          'flag',
          'Flag',
          <Flag size={12} />,
          sub.status === 'flagged'
            ? 'bg-amber-500 text-white'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
        )}
        {verdictBtn(
          'na',
          'N/A',
          <MinusCircle size={12} />,
          sub.status === 'not_applicable'
            ? 'bg-slate-500 text-white'
            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20',
        )}

        {/* Severity selector (visible near flag) */}
        <select
          value={severity}
          onChange={(e) =>
            setSeverity(e.target.value as 'low' | 'medium' | 'high')
          }
          className="text-[11px] rounded border border-theme bg-theme-surface px-2 py-0.5 text-theme-secondary"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {review.isPending && (
          <Loader2 size={12} className="animate-spin text-primary" />
        )}
      </div>
    </div>
  )
}
