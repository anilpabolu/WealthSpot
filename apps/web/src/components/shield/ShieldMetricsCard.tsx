import { AlertTriangle, BarChart3, Clock, ShieldCheck } from 'lucide-react'
import { findCategory, findSubItem } from '@/lib/assessments'
import { useShieldMetrics } from '@/hooks/useShield'

/**
 * Dashboard card with Shield funnel + top-flagged sub-items +
 * average time-to-certify + risk-count histogram.
 */
export function ShieldMetricsCard({
  title = 'WealthSpot Shield — operations',
}: {
  title?: string
}) {
  const { data, isLoading } = useShieldMetrics()

  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 w-40 bg-theme-surface rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-theme-surface rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const totalFunnel =
    data.funnel.not_started +
    data.funnel.in_review +
    data.funnel.partial +
    data.funnel.certified

  return (
    <div className="card p-6">
      <header className="flex items-center gap-2 mb-4">
        <ShieldCheck size={18} className="text-emerald-500" />
        <h3 className="text-sm font-bold text-theme-primary">{title}</h3>
        <span className="ml-auto text-[11px] text-theme-tertiary">
          {totalFunnel} opportunities tracked
        </span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FunnelTile
          label="Not started"
          value={data.funnel.not_started}
          accent="text-theme-tertiary"
        />
        <FunnelTile
          label="In review"
          value={data.funnel.in_review}
          accent="text-sky-400"
        />
        <FunnelTile
          label="Partial"
          value={data.funnel.partial}
          accent="text-amber-500"
        />
        <FunnelTile
          label="Certified"
          value={data.funnel.certified}
          accent="text-emerald-500"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-[12px] font-semibold text-theme-primary">
              Most-flagged sub-items
            </span>
          </div>
          {data.topFlagged.length === 0 ? (
            <div className="text-[12px] text-theme-tertiary italic">
              No flagged items yet.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {data.topFlagged.map((f) => {
                const cat = findCategory(f.categoryCode)
                const sub = findSubItem(f.categoryCode, f.subcategoryCode)
                return (
                  <li
                    key={`${f.categoryCode}-${f.subcategoryCode}`}
                    className="flex items-center justify-between gap-2 text-[12px]"
                  >
                    <span className="text-theme-primary">
                      <span className="text-theme-tertiary">
                        {cat?.name.split(' ')[0] ?? f.categoryCode}:
                      </span>{' '}
                      {sub?.label ?? f.subcategoryCode}
                    </span>
                    <span className="text-amber-500 font-semibold">
                      {f.flaggedCount}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-theme bg-theme-surface p-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              <span className="text-[11px] uppercase tracking-wider text-theme-tertiary">
                Avg time-to-certify
              </span>
            </div>
            <div className="mt-1 text-lg font-bold text-theme-primary">
              {data.avgTimeToCertifyDays === null
                ? '—'
                : `${data.avgTimeToCertifyDays.toFixed(1)} days`}
            </div>
          </div>
          <div className="rounded-xl border border-theme bg-theme-surface p-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-[11px] uppercase tracking-wider text-theme-tertiary">
                Risk flags
              </span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-[12px]">
              <RiskCount label="Low" value={data.riskCounts.low} color="text-sky-400" />
              <RiskCount
                label="Med"
                value={data.riskCounts.medium}
                color="text-amber-500"
              />
              <RiskCount
                label="High"
                value={data.riskCounts.high}
                color="text-rose-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FunnelTile({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="rounded-xl border border-theme bg-theme-surface px-3 py-3">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-theme-tertiary mt-0.5">
        {label}
      </div>
    </div>
  )
}

function RiskCount({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="text-center">
      <div className={`font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-theme-tertiary uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
