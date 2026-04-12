import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { EmptyState, Badge } from '@/components/ui'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { VaultComingSoonPortfolioCard } from '@/components/VaultComingSoonOverlay'
import {
  usePortfolioSummary,
  usePortfolioProperties,
  useRecentTransactions,
  useVaultWisePortfolio,
  type VaultPortfolioItem,
  type PortfolioProperty,
  type RecentTransaction,
} from '@/hooks/usePortfolio'
import { useUserActivities, type UserActivityItem } from '@/hooks/useOpportunityActions'
import {
  Building2,
  Rocket,
  Users,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Clock,
  PieChart,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
  Heart,
  Share2,
  FileCheck,
} from 'lucide-react'

/* ── Vault metadata ──────────────────────────────────────────────── */

const VAULT_META: Record<
  string,
  { label: string; color: string; gradient: string; icon: typeof Building2; accent: string }
> = {
  wealth: {
    label: 'Wealth Vault',
    color: 'text-primary',
    gradient: 'from-primary to-primary-dark',
    icon: Building2,
    accent: 'border-primary/30 bg-primary/5',
  },
  opportunity: {
    label: 'Opportunity Vault',
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-violet-700',
    icon: Rocket,
    accent: 'border-violet-200 bg-violet-50',
  },
  community: {
    label: 'Community Vault',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-emerald-700',
    icon: Users,
    accent: 'border-emerald-200 bg-emerald-50',
  },
}

/* ── Formatters ──────────────────────────────────────────────────── */

function formatINR(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

/* ── Stat Card ───────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Wallet
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className="stat-card-icon bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && trend !== 'neutral' && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              trend === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {sub}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">{value}</p>
      {sub && !trend && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

/* ── Vault Breakdown Card ────────────────────────────────────────── */

function VaultBreakdownCard({ vault }: { vault: VaultPortfolioItem }) {
  const meta = VAULT_META[vault.vaultType]
  if (!meta) return null
  const Icon = meta.icon
  const pct = vault.totalInvested > 0 ? vault.returnPct : 0
  const isPositive = pct >= 0

  return (
    <div className={`rounded-xl border ${meta.accent} overflow-hidden`}>
      <div className={`bg-gradient-to-r ${meta.gradient} px-5 py-4`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-white">{meta.label}</h3>
            <p className="text-white/70 text-xs">
              {vault.opportunityCount} opportunity{vault.opportunityCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Invested</p>
            <p className="font-mono text-sm font-bold text-gray-900">{formatINR(vault.totalInvested)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Current Value</p>
            <p className="font-mono text-sm font-bold text-gray-900">{formatINR(vault.currentValue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Returns</p>
            <p className={`font-mono text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{formatINR(vault.returns)} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Expected IRR</p>
            <p className={`font-mono text-sm font-bold ${meta.color}`}>
              {vault.expectedIrr != null ? `${vault.expectedIrr}%` : '—'}
            </p>
          </div>
        </div>
        {vault.avgDurationDays > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            Avg. hold: {Math.round(vault.avgDurationDays)} days
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Simple Bar Chart ────────────────────────────────────────────── */

function AllocationChart({ data }: { data: Array<{ type: string; percentage: number; value: number }> }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No allocation data yet.</p>
  const total = data.reduce((s, d) => s + d.value, 0)
  const colors = ['bg-primary', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-4 rounded-full bg-gray-100 overflow-hidden flex">
        {data.map((d, i) => (
          <div
            key={d.type}
            className={`${colors[i % colors.length]} transition-all`}
            style={{ width: `${d.percentage}%` }}
            title={`${d.type}: ${d.percentage}%`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {data.map((d, i) => (
          <div key={d.type} className="flex items-center gap-2 text-xs">
            <div className={`h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`} />
            <span className="text-gray-600">{d.type}</span>
            <span className="font-mono font-semibold text-gray-900">{d.percentage.toFixed(0)}%</span>
            <span className="text-gray-400">({formatINR(total > 0 ? d.value : 0)})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Monthly Returns Mini Bar Chart ──────────────────────────────── */

function MonthlyReturnsChart({ data }: { data: Array<{ month: string; returns: number; invested: number }> }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No monthly data yet.</p>
  const maxVal = Math.max(...data.map((d) => Math.max(d.returns, d.invested)), 1)

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-32">
        {data.slice(-12).map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5 justify-end h-full">
            <div
              className="w-full bg-emerald-400 rounded-t"
              style={{ height: `${(d.returns / maxVal) * 100}%`, minHeight: d.returns > 0 ? '2px' : 0 }}
              title={`Returns: ${formatINR(d.returns)}`}
            />
            <div
              className="w-full bg-primary/30 rounded-t"
              style={{ height: `${(d.invested / maxVal) * 100}%`, minHeight: d.invested > 0 ? '2px' : 0 }}
              title={`Invested: ${formatINR(d.invested)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-hidden">
        {data.slice(-12).map((d) => (
          <div key={d.month} className="flex-1 text-center">
            <span className="text-[9px] text-gray-400 truncate block">{d.month}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 justify-center text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Returns</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary/30" /> Invested</span>
      </div>
    </div>
  )
}

/* ── Property Row (expandable) ───────────────────────────────────── */

function PropertyRow({ p }: { p: PortfolioProperty }) {
  const [expanded, setExpanded] = useState(false)
  const isPositive = p.returnPercentage >= 0

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-stone-50 text-left">
        <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
          {p.propertyImage ? (
            <img src={p.propertyImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-300"><Building2 className="h-5 w-5" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{p.propertyTitle}</p>
          <p className="text-xs text-gray-400">{p.propertyCity} · {p.assetType}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono font-bold text-gray-900">{formatINR(p.currentValue)}</p>
          <p className={`text-xs font-mono ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{p.returnPercentage.toFixed(1)}%
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="border-t border-gray-100 bg-stone-50/50 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div><span className="text-gray-400 block">Invested</span><span className="font-mono font-semibold">{formatINR(p.investedAmount)}</span></div>
          <div><span className="text-gray-400 block">Units</span><span className="font-mono font-semibold">{p.units}</span></div>
          <div><span className="text-gray-400 block">IRR</span><span className="font-mono font-semibold">{p.irr ? `${p.irr}%` : '—'}</span></div>
          <div><span className="text-gray-400 block">Since</span><span className="font-mono font-semibold">{new Date(p.investedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        </div>
      )}
    </div>
  )
}

/* ── Transaction Row ─────────────────────────────────────────────── */

const TXN_COLORS: Record<string, string> = {
  investment: 'bg-primary/10 text-primary',
  payout: 'bg-emerald-50 text-emerald-600',
  referral_bonus: 'bg-amber-50 text-amber-600',
  wealthpass: 'bg-violet-50 text-violet-600',
}

function TransactionRow({ t }: { t: RecentTransaction }) {
  const color = TXN_COLORS[t.type] ?? 'bg-gray-100 text-gray-600'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase ${color}`}>
        {t.type === 'investment' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{t.propertyTitle || t.type.replace('_', ' ')}</p>
        <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-mono font-bold ${t.type === 'investment' ? 'text-gray-900' : 'text-emerald-600'}`}>
          {t.type === 'investment' ? '-' : '+'}{formatINR(t.amount)}
        </p>
        <Badge variant={t.status === 'confirmed' || t.status === 'completed' ? 'success' : 'warning'} size="xs">
          {t.status}
        </Badge>
      </div>
    </div>
  )
}

/* ── Activity Row (liked, shared, etc.) ──────────────────────────── */

const ACTIVITY_META: Record<string, { icon: typeof Heart; color: string; label: string }> = {
  liked: { icon: Heart, color: 'bg-red-50 text-red-500', label: 'Liked' },
  unliked: { icon: Heart, color: 'bg-gray-100 text-gray-400', label: 'Unliked' },
  shared: { icon: Share2, color: 'bg-blue-50 text-blue-500', label: 'Shared' },
  invested: { icon: ArrowDownRight, color: 'bg-primary/10 text-primary', label: 'Invested' },
  eoi_submitted: { icon: FileCheck, color: 'bg-violet-50 text-violet-500', label: 'Expressed Interest' },
}

function ActivityRow({ a, onClick }: { a: UserActivityItem; onClick?: () => void }) {
  const meta = ACTIVITY_META[a.activityType] ?? { icon: Clock, color: 'bg-gray-100 text-gray-500', label: a.activityType }
  const Icon = meta.icon
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 w-full text-left hover:bg-stone-50 transition-colors"
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{a.resourceTitle}</p>
        <p className="text-xs text-gray-400">
          {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
        </p>
      </div>
      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${meta.color}`}>
        {meta.label}
      </span>
    </button>
  )
}

/* ── Loading placeholder ─────────────────────────────────────────── */

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  )
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function PortfolioPage() {
  const navigate = useNavigate()
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary()
  const { data: properties, isLoading: propsLoading } = usePortfolioProperties()
  const { data: transactions, isLoading: txnLoading } = useRecentTransactions(10)
  const { data: vaultData, isLoading: vaultLoading } = useVaultWisePortfolio()
  const { data: activities } = useUserActivities(10)
  const { isVaultEnabled } = useVaultConfig()

  const isLoading = summaryLoading || vaultLoading
  const disabledVaultIds = ['opportunity', 'community'].filter((id) => !isVaultEnabled(id))

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Portfolio</span>
          <h1 className="page-hero-title">The War Chest</h1>
          <p className="page-hero-subtitle">Your empire-in-progress — every asset, every return, all in one place.</p>
        </div>
      </section>

      <main className="flex-1">
        <div className="page-section">
          <div className="page-section-container space-y-10">

          {isLoading && <LoadingState />}

          {!isLoading && (
            <>
              {/* ── Grand Summary Cards ───────────────────────────── */}
              <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Invested"
                    value={formatINR(vaultData?.grandTotalInvested ?? summary?.totalInvested ?? 0)}
                    icon={Wallet}
                  />
                  <StatCard
                    label="Current Value"
                    value={formatINR(vaultData?.grandCurrentValue ?? summary?.currentValue ?? 0)}
                    icon={IndianRupee}
                  />
                  <StatCard
                    label="Total Returns"
                    value={formatINR(vaultData?.grandReturns ?? summary?.totalReturns ?? 0)}
                    sub={`${(vaultData?.grandReturnPct ?? 0) > 0 ? '+' : ''}${(vaultData?.grandReturnPct ?? 0).toFixed(1)}%`}
                    icon={TrendingUp}
                    trend={(vaultData?.grandReturns ?? 0) >= 0 ? 'up' : 'down'}
                  />
                  <StatCard
                    label="XIRR"
                    value={summary?.xirr != null ? `${summary.xirr.toFixed(1)}%` : '—'}
                    sub={summary?.propertiesCount ? `${summary.propertiesCount} properties · ${summary.citiesCount} cities` : undefined}
                    icon={BarChart3}
                  />
                </div>
              </section>

              {/* ── Vault-Wise Breakdown ──────────────────────────── */}
              {(vaultData && vaultData.vaults.length > 0 || disabledVaultIds.length > 0) && (
                <section>
                  <h2 className="section-title text-xl">Vault-Wise Breakdown</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {vaultData?.vaults.map((v) => (
                      <VaultBreakdownCard key={v.vaultType} vault={v} />
                    ))}
                    {disabledVaultIds
                      .filter((id) => !vaultData?.vaults.some((v) => v.vaultType === id))
                      .map((id) => {
                        const meta = VAULT_META[id]
                        return meta ? (
                          <VaultComingSoonPortfolioCard
                            key={id}
                            vaultId={id}
                            icon={meta.icon}
                            label={meta.label}
                            gradient={meta.gradient}
                            accent={meta.accent}
                          />
                        ) : null
                      })}
                  </div>
                </section>
              )}

              {/* ── Charts Row ────────────────────────────────────── */}
              <section className="grid lg:grid-cols-2 gap-6">
                {/* Asset Allocation */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <PieChart className="h-5 w-5 text-gray-400" />
                    <h3 className="section-title text-lg">Asset Allocation</h3>
                  </div>
                  <AllocationChart data={summary?.assetAllocation ?? []} />
                </div>

                {/* Monthly Returns */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                    <h3 className="section-title text-lg">Monthly Returns</h3>
                  </div>
                  <MonthlyReturnsChart data={summary?.monthlyReturns ?? []} />
                </div>
              </section>

              {/* ── Holdings ──────────────────────────────────────── */}
              <section>
                <h2 className="section-title text-xl">Holdings</h2>
                {propsLoading ? (
                  <LoadingState />
                ) : !properties || properties.length === 0 ? (
                  <EmptyState icon={Building2} title="No Holdings Yet" message="Start investing to see your portfolio here." />
                ) : (
                  <div className="space-y-2">
                    {properties.map((p) => (
                      <PropertyRow key={p.propertyId} p={p} />
                    ))}
                  </div>
                )}
              </section>

              {/* ── Recent Activity ───────────────────────────────── */}
              {activities && activities.length > 0 && (
                <section>
                  <h2 className="section-title text-xl">Recent Activity</h2>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    {activities.map((a) => (
                      <ActivityRow
                        key={a.id}
                        a={a}
                        onClick={a.resourceSlug ? () => navigate(`/opportunity/${a.resourceSlug}`) : undefined}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Recent Transactions ────────────────────────────── */}
              <section>
                <h2 className="section-title text-xl">Recent Transactions</h2>
                {txnLoading ? (
                  <LoadingState />
                ) : !transactions || transactions.length === 0 ? (
                  <EmptyState icon={Clock} title="No Transactions" message="No transactions yet." />
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    {transactions.map((t) => (
                      <TransactionRow key={t.id} t={t} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  )
}
