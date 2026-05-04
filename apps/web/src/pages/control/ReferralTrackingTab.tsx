import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, CheckCircle2, Clock, Gift } from 'lucide-react'
import {
  useAdminReferralSummary,
  useAdminReferralDetails,
  type AdminReferralSummary as RefSummary,
} from '@/hooks/useAdminReferrals'
import { formatINR } from '@/lib/formatters'
import { CenteredLoader } from './shared'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function RefBadge({ text, variant }: { text: string; variant: 'success' | 'warning' | 'neutral' | 'info' }) {
  const cls =
    variant === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
      : variant === 'warning'
        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        : variant === 'info'
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'bg-theme-surface-hover text-theme-secondary'
  return <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
}

function RefSummaryRow({ s, expanded, onToggle }: { s: RefSummary; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-wrap items-center gap-4 w-full text-left px-4 py-3 border-b border-theme last:border-0 hover:bg-theme-surface transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-[180px]">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
          {s.referrerName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-primary">{s.referrerName}</p>
          <p className="text-xs text-theme-tertiary">{s.referrerEmail}</p>
        </div>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <div className="text-center">
          <p className="font-mono font-bold text-theme-primary">{s.totalReferrals}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Total</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.successfulReferrals}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Rewarded</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{s.pendingReferrals}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Pending</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-theme-primary">{formatINR(s.totalRewardEarned)}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Earned</p>
        </div>
      </div>
      {expanded ? <ChevronUp className="h-4 w-4 text-theme-tertiary shrink-0" /> : <ChevronDown className="h-4 w-4 text-theme-tertiary shrink-0" />}
    </button>
  )
}

function RefDetailPanel({ referrerId }: { referrerId: string }) {
  const { data: details, isLoading } = useAdminReferralDetails(referrerId)
  if (isLoading) return <CenteredLoader />
  if (!details || details.length === 0) return <p className="text-sm text-theme-tertiary text-center py-4">No referral details found.</p>

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="bg-theme-surface border-b border-theme px-4 py-3 overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="text-[10px] text-theme-tertiary uppercase">
            <th className="text-left pb-2 font-semibold">Referee</th>
            <th className="text-left pb-2 font-semibold">Type</th>
            <th className="text-left pb-2 font-semibold">Property</th>
            <th className="text-center pb-2 font-semibold">User Status</th>
            <th className="text-center pb-2 font-semibold">Investments</th>
            <th className="text-center pb-2 font-semibold">Reward</th>
            <th className="text-left pb-2 font-semibold">Joined</th>
            <th className="text-left pb-2 font-semibold">Referred</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme">
          {details.map((d) => (
            <tr key={d.id} className="hover:bg-[var(--bg-surface)] transition-colors">
              <td className="py-2">
                <p className="font-medium text-theme-primary">{d.refereeName}</p>
                <p className="text-xs text-theme-tertiary">{d.refereeEmail}</p>
              </td>
              <td className="py-2">
                <RefBadge text={d.referralType} variant={d.referralType === 'property' ? 'success' : 'neutral'} />
              </td>
              <td className="py-2 text-theme-primary max-w-[140px] truncate">{d.opportunityTitle ?? '—'}</td>
              <td className="py-2 text-center">
                {d.refereeStatus === 'invested' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Invested
                  </span>
                ) : d.refereeStatus === 'active' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500">
                    <Clock className="h-3.5 w-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-theme-tertiary">
                    <Clock className="h-3.5 w-3.5" /> Stale
                  </span>
                )}
              </td>
              <td className="py-2 text-center font-mono font-bold text-theme-primary">{d.refereeTotalInvestments}</td>
              <td className="py-2 text-center">
                {d.firstInvestmentRewarded ? (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(d.rewardAmount)}</span>
                ) : (
                  <span className="text-[11px] text-theme-tertiary">—</span>
                )}
              </td>
              <td className="py-2 text-theme-secondary text-xs">{fmtDate(d.refereeJoinedAt)}</td>
              <td className="py-2 text-theme-secondary text-xs">{fmtDate(d.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ReferralTrackingTab                                                */
/* ------------------------------------------------------------------ */

export default function ReferralTrackingTab() {
  const { data: summaries, isLoading } = useAdminReferralSummary()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => (summaries ?? []).filter(
    (s) =>
      s.referrerName.toLowerCase().includes(search.toLowerCase()) ||
      s.referrerEmail.toLowerCase().includes(search.toLowerCase()),
  ), [summaries, search])

  const { totalReferred, totalRewarded, totalEarned, totalPending } = useMemo(() => ({
    totalReferred: filtered.reduce((n, s) => n + s.totalReferrals, 0),
    totalRewarded: filtered.reduce((n, s) => n + s.successfulReferrals, 0),
    totalEarned: filtered.reduce((n, s) => n + s.totalRewardEarned, 0),
    totalPending: filtered.reduce((n, s) => n + s.pendingReferrals, 0),
  }), [filtered])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Referral Tracking</h2>
        <p className="text-sm text-theme-secondary mt-1">
          Track who referred whom, whether they invested or stayed stale, and referral reward payouts.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl bg-primary/5 px-4 py-3">
          <p className="font-mono text-xl font-bold text-primary">{filtered.length}</p>
          <p className="text-xs font-medium text-theme-secondary">Referrers</p>
        </div>
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 px-4 py-3">
          <p className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">{totalReferred}</p>
          <p className="text-xs font-medium text-theme-secondary">Total Referrals</p>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
          <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalRewarded}</p>
          <p className="text-xs font-medium text-theme-secondary">Rewarded</p>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
          <p className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">{totalPending}</p>
          <p className="text-xs font-medium text-theme-secondary">Pending</p>
        </div>
        <div className="rounded-xl bg-theme-surface-hover px-4 py-3">
          <p className="font-mono text-xl font-bold text-theme-primary">{formatINR(totalEarned)}</p>
          <p className="text-xs font-medium text-theme-secondary">Total Earned</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
        <input
          type="text"
          placeholder="Search referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-theme text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      <div className="rounded-xl border border-theme bg-[var(--bg-surface)] overflow-hidden">
        {isLoading ? (
          <CenteredLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-10 w-10 text-theme-tertiary mx-auto mb-3" />
            <p className="text-theme-secondary text-sm">No referrals found.</p>
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.referrerId}>
              <RefSummaryRow
                s={s}
                expanded={expandedId === s.referrerId}
                onToggle={() => setExpandedId(expandedId === s.referrerId ? null : s.referrerId)}
              />
              {expandedId === s.referrerId && <RefDetailPanel referrerId={s.referrerId} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
