import { useState } from 'react'
import { PortalLayout } from '@/components/layout'
import { Badge } from '@/components/ui'
import {
  useAdminReferralSummary,
  useAdminReferralDetails,
  type AdminReferralSummary,
} from '@/hooks/useAdminReferrals'
import { formatINR } from '@/lib/formatters'
import {
  Users,
  Gift,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react'

/* ── helpers ─────────────────────────────────────────────────────── */

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Summary Row ─────────────────────────────────────────────────── */

function SummaryRow({
  s,
  expanded,
  onToggle,
}: {
  s: AdminReferralSummary
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-wrap items-center gap-4 w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-stone-50 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
          {s.referrerName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{s.referrerName}</p>
          <p className="text-xs text-gray-400">{s.referrerEmail}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="font-mono font-bold text-gray-900">{s.totalReferrals}</p>
          <p className="text-[10px] text-gray-400 uppercase">Total</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-emerald-600">{s.successfulReferrals}</p>
          <p className="text-[10px] text-gray-400 uppercase">Rewarded</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-amber-600">{s.pendingReferrals}</p>
          <p className="text-[10px] text-gray-400 uppercase">Pending</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-gray-900">{formatINR(s.totalRewardEarned)}</p>
          <p className="text-[10px] text-gray-400 uppercase">Earned</p>
        </div>
      </div>

      {expanded ? (
        <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      )}
    </button>
  )
}

/* ── Detail Panel ────────────────────────────────────────────────── */

function DetailPanel({ referrerId }: { referrerId: string }) {
  const { data: details, isLoading } = useAdminReferralDetails(referrerId)

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )

  if (!details || details.length === 0)
    return <p className="text-sm text-gray-400 text-center py-4">No referral details found.</p>

  return (
    <div className="bg-stone-50 border-b border-gray-100 px-4 py-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] text-gray-400 uppercase">
            <th className="text-left pb-2 font-semibold">Referee</th>
            <th className="text-left pb-2 font-semibold">Type</th>
            <th className="text-left pb-2 font-semibold">Property</th>
            <th className="text-left pb-2 font-semibold">Code</th>
            <th className="text-center pb-2 font-semibold">Status</th>
            <th className="text-center pb-2 font-semibold">Investments</th>
            <th className="text-center pb-2 font-semibold">Reward</th>
            <th className="text-left pb-2 font-semibold">Joined</th>
            <th className="text-left pb-2 font-semibold">Referred</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {details.map((d) => (
            <tr key={d.id} className="hover:bg-white transition-colors">
              <td className="py-2">
                <p className="font-medium text-gray-900">{d.refereeName}</p>
                <p className="text-xs text-gray-400">{d.refereeEmail}</p>
              </td>
              <td className="py-2">
                <Badge
                  variant={d.referralType === 'property' ? 'success' : 'neutral'}
                  size="sm"
                >{d.referralType}</Badge>
              </td>
              <td className="py-2 text-gray-700 max-w-[160px] truncate">{d.opportunityTitle ?? '—'}</td>
              <td className="py-2 font-mono text-xs text-gray-600">{d.codeUsed}</td>
              <td className="py-2 text-center">
                {d.refereeStatus === 'invested' ? (
                  <Badge variant="success" size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>Invested</Badge>
                ) : d.refereeStatus === 'active' ? (
                  <Badge variant="info" size="sm" icon={<Clock className="h-3.5 w-3.5" />}>Active</Badge>
                ) : (
                  <Badge variant="neutral" size="sm" icon={<Clock className="h-3.5 w-3.5" />}>Stale</Badge>
                )}
              </td>
              <td className="py-2 text-center font-mono font-bold text-gray-900">{d.refereeTotalInvestments}</td>
              <td className="py-2 text-center">
                {d.firstInvestmentRewarded ? (
                  <Badge variant="success" size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>{formatINR(d.rewardAmount)}</Badge>
                ) : (
                  <span className="text-[11px] text-gray-400">—</span>
                )}
              </td>
              <td className="py-2 text-gray-500 text-xs">{fmtDate(d.refereeJoinedAt)}</td>
              <td className="py-2 text-gray-500 text-xs">{fmtDate(d.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function AdminReferralsPage() {
  const { data: summaries, isLoading } = useAdminReferralSummary()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = (summaries ?? []).filter(
    (s) =>
      s.referrerName.toLowerCase().includes(search.toLowerCase()) ||
      s.referrerEmail.toLowerCase().includes(search.toLowerCase()),
  )

  const totalReferred = filtered.reduce((n, s) => n + s.totalReferrals, 0)
  const totalRewarded = filtered.reduce((n, s) => n + s.successfulReferrals, 0)
  const totalEarned = filtered.reduce((n, s) => n + s.totalRewardEarned, 0)

  return (
    <PortalLayout variant="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="section-title text-2xl">Referral Management</h1>
          <p className="text-gray-500 mt-1">
            Track all platform &amp; property referrals, referee mappings, and reward payouts.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="stat-card-icon bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Referrers</p>
              <p className="font-mono text-lg font-bold text-gray-900">{filtered.length}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="stat-card-icon bg-blue-50">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Referrals</p>
              <p className="font-mono text-lg font-bold text-gray-900">{totalReferred}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="stat-card-icon bg-emerald-50">
              <Gift className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Rewarded</p>
              <p className="font-mono text-lg font-bold text-emerald-600">{totalRewarded}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="stat-card-icon bg-amber-50">
              <Gift className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Earned</p>
              <p className="font-mono text-lg font-bold text-gray-900">{formatINR(totalEarned)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search referrer name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No referrals found.</p>
            </div>
          ) : (
            filtered.map((s) => (
              <div key={s.referrerId}>
                <SummaryRow
                  s={s}
                  expanded={expandedId === s.referrerId}
                  onToggle={() => setExpandedId(expandedId === s.referrerId ? null : s.referrerId)}
                />
                {expandedId === s.referrerId && <DetailPanel referrerId={s.referrerId} />}
              </div>
            ))
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
