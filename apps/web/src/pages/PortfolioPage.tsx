import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { EmptyState, Badge } from '@/components/ui'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useContent } from '@/hooks/useSiteContent'
import { VaultComingSoonPortfolioCard } from '@/components/VaultComingSoonOverlay'
import {
  usePortfolioSummary,
  usePortfolioHoldings,
  useSnapshotConfig,
  useOpportunityAppreciationHistory,
  useRecentTransactions,
  useVaultWisePortfolio,
  type VaultPortfolioItem,
  type RecentTransaction,
  type HoldingItem,
} from '@/hooks/usePortfolio'
import { useUserActivities, type UserActivityItem } from '@/hooks/useOpportunityActions'
import { useOverallProgress } from '@/hooks/useProfiling'
import { useUserStore } from '@/stores/user.store'
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
  BarChart3,
  Loader2,
  Heart,
  Share2,
  FileCheck,
  Eye,
  X,
  ExternalLink,
  MapPin,
  Calendar,
} from 'lucide-react'

/* ── Vault metadata ──────────────────────────────────────────────── */

const VAULT_META: Record<
  string,
  { label: string; color: string; gradient: string; icon: typeof Building2; accent: string }
> = {
  wealth: {
    label: 'Wealth Vault',
    color: 'text-[#D4AF37]',
    gradient: 'from-[#1B2A4A] via-[#2D4A7A] to-[#1B3A5A]',
    icon: Building2,
    accent: 'border-[#D4AF37]/20 bg-[#F5F0E1] dark:bg-[#1B2A4A]/30',
  },
  safe: {
    label: 'Safe Vault',
    color: 'text-[#20E3B2]',
    gradient: 'from-[#0D4A3A] via-[#145C47] to-[#0A3A2E]',
    icon: Rocket,
    accent: 'border-[#20E3B2]/20 bg-[#F0FBF8] dark:bg-[#0D4A3A]/30',
  },
  community: {
    label: 'Community Vault',
    color: 'text-[#065F46] dark:text-amber-300',
    gradient: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    icon: Users,
    accent: 'border-[#065F46]/20 bg-[#FFFBEB] dark:bg-[#D97706]/20',
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
              trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {sub}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary">{label}</p>
      <p className="text-xl font-bold font-mono text-theme-primary mt-0.5">{value}</p>
      {sub && !trend && <p className="text-xs text-theme-tertiary mt-0.5">{sub}</p>}
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-theme-tertiary">Invested</p>
            <p className="font-mono text-sm font-bold text-theme-primary">{formatINR(vault.totalInvested)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-theme-tertiary">Current Value</p>
            <p className="font-mono text-sm font-bold text-theme-primary">{formatINR(vault.currentValue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-theme-tertiary">Returns</p>
            <p className={`font-mono text-sm font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{formatINR(vault.returns)} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-theme-tertiary">Expected IRR</p>
            <p className={`font-mono text-sm font-bold ${meta.color}`}>
              {vault.expectedIrr != null ? `${vault.expectedIrr}%` : '—'}
            </p>
          </div>
        </div>
        {vault.avgDurationDays > 0 && (
          <div className="flex items-center gap-2 text-xs text-theme-tertiary">
            <Clock className="h-3.5 w-3.5" />
            Avg. hold: {Math.round(vault.avgDurationDays)} days
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Geographic Spread Panel ─────────────────────────────────────── */

function CityDistributionPanel({ data }: { data: Array<{ city: string; percentage: number; value: number }> }) {
  if (!data || data.length === 0)
    return <p className="text-sm text-theme-tertiary text-center py-6">No investment data available.</p>
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={`city-${i}`} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-theme-primary flex items-center gap-1">
              <MapPin className="h-3 w-3 text-theme-tertiary" />
              {d.city}
            </span>
            <span className="text-theme-tertiary">
              {d.percentage.toFixed(0)}% &middot; {formatINR(d.value)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-theme-surface-hover overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${d.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── IRR Breakdown Panel ─────────────────────────────────────────── */

function IrrBreakdownPanel({ vaults, portfolioXirr }: { vaults: VaultPortfolioItem[]; portfolioXirr?: number }) {
  if (!vaults || vaults.length === 0)
    return <p className="text-sm text-theme-tertiary text-center py-6">IRR data unavailable.</p>
  return (
    <div className="space-y-4">
      {vaults.map((v) => {
        const meta = VAULT_META[v.vaultType]
        const hasActual = v.actualIrr != null
        return (
          <div key={v.vaultType} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  VAULT_BADGE[v.vaultType] ?? 'bg-theme-surface-hover text-theme-tertiary'
                }`}
              >
                {meta?.label ?? v.vaultType}
              </span>
              {v.opportunityCount > 0 && (
                <span className="text-[10px] text-theme-tertiary">
                  {v.opportunityCount} investment{v.opportunityCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-theme-surface-hover px-3 py-2">
                <p className="text-theme-tertiary mb-0.5">Expected IRR</p>
                <p className={`font-mono font-bold ${meta?.color ?? 'text-theme-primary'}`}>
                  {v.expectedIrr != null ? `${v.expectedIrr}%` : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-theme-surface-hover px-3 py-2">
                <p className="text-theme-tertiary mb-0.5">Actual XIRR</p>
                <p
                  className={`font-mono font-bold ${
                    hasActual && v.actualIrr! > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-secondary'
                  }`}
                >
                  {hasActual ? `${v.actualIrr!.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>
          </div>
        )
      })}
      {portfolioXirr != null && (
        <div className="pt-3 border-t border-theme flex justify-between items-center">
          <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Portfolio XIRR</span>
          <span
            className={`font-mono font-bold text-sm ${
              portfolioXirr > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-primary'
            }`}
          >
            {portfolioXirr > 0 ? '+' : ''}{portfolioXirr.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}


/* ── Holding Row (responsive: card on mobile, table row on md+) ──── */

const VAULT_BADGE: Record<string, string> = {
  wealth: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  safe: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  community: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
}

function HoldingRow({ h, onSnap }: { h: HoldingItem; onSnap: () => void }) {
  const isPositive = h.returnPct >= 0

  return (
    <div className="group border border-theme rounded-lg bg-[var(--bg-surface)] px-4 py-3 hover:bg-theme-surface transition-colors">
      {/* Mobile layout */}
      <div className="flex items-start gap-3 md:hidden">
        <div className="h-10 w-10 rounded-lg bg-theme-surface-hover overflow-hidden shrink-0">
          {h.projectImage ? (
            <img src={h.projectImage} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-theme-tertiary"><Building2 className="h-5 w-5" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-theme-primary truncate">{h.projectTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${VAULT_BADGE[h.vaultType] ?? 'bg-theme-surface-hover text-theme-tertiary'}`}>{h.vaultType}</span>
            {h.city && <span className="text-xs text-theme-tertiary truncate">{h.city}</span>}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-theme-tertiary">Invested</p>
              <p className="text-sm font-mono font-bold text-theme-primary">{formatINR(h.investedAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-theme-tertiary">Current Value</p>
              <p className="text-sm font-mono font-bold text-theme-primary">{formatINR(h.currentValue)}</p>
              <p className={`text-xs font-mono ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{h.returnPct.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onSnap}
          title="View snapshot"
          className="p-1.5 rounded-lg hover:bg-primary/10 text-theme-tertiary hover:text-primary transition-colors"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-theme-surface-hover overflow-hidden shrink-0">
            {h.projectImage ? (
              <img src={h.projectImage} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-theme-tertiary"><Building2 className="h-4 w-4" /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-theme-primary truncate">{h.projectTitle}</p>
            <p className="text-xs text-theme-tertiary truncate">{h.city ?? '—'}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-theme-tertiary">Invested</p>
          <p className="text-sm font-mono font-semibold text-theme-primary">{formatINR(h.investedAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-theme-tertiary">Current Value</p>
          <p className="text-sm font-mono font-semibold text-theme-primary">{formatINR(h.currentValue)}</p>
          <p className={`text-xs font-mono ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{h.returnPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${VAULT_BADGE[h.vaultType] ?? 'bg-theme-surface-hover text-theme-tertiary'}`}>
            {h.vaultType}
          </span>
        </div>
        <button
          onClick={onSnap}
          title="View snapshot"
          className="p-1.5 rounded-lg hover:bg-primary/10 text-theme-tertiary hover:text-primary transition-colors"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ── Holding Detail Modal ────────────────────────────────────────── */

function HoldingDetailModal({
  holding,
  sections,
  onClose,
}: {
  holding: HoldingItem
  sections: string[]
  onClose: () => void
}) {
  const { data: appreciationHistory } = useOpportunityAppreciationHistory(
    sections.includes('appreciation_history') ? holding.opportunityId : null
  )

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90dvh] overflow-y-auto shadow-2xl z-10">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-theme px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {holding.projectImage ? (
              <img src={holding.projectImage} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" loading="lazy" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-theme-surface-hover flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-theme-tertiary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-theme-primary truncate">{holding.projectTitle}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${VAULT_BADGE[holding.vaultType] ?? 'bg-theme-surface-hover text-theme-tertiary'}`}>{holding.vaultType}</span>
                {holding.city && <span className="text-xs text-theme-tertiary">{holding.city}</span>}
                {holding.status && <span className="text-xs text-theme-tertiary capitalize">{holding.status}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-surface-hover text-theme-tertiary hover:text-theme-primary shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Always-visible: core stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-theme-surface px-4 py-3">
              <p className="text-xs text-theme-tertiary">Invested</p>
              <p className="text-base font-mono font-bold text-theme-primary mt-0.5">{formatINR(holding.investedAmount)}</p>
            </div>
            <div className="rounded-lg bg-theme-surface px-4 py-3">
              <p className="text-xs text-theme-tertiary">Current Value</p>
              <p className={`text-base font-mono font-bold mt-0.5 ${holding.returnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {formatINR(holding.currentValue)}
              </p>
            </div>
            <div className="rounded-lg bg-theme-surface px-4 py-3">
              <p className="text-xs text-theme-tertiary">Returns</p>
              <p className={`text-base font-mono font-bold mt-0.5 ${holding.returns >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {holding.returns >= 0 ? '+' : ''}{formatINR(holding.returns)}
              </p>
            </div>
            <div className="rounded-lg bg-theme-surface px-4 py-3">
              <p className="text-xs text-theme-tertiary">Return %</p>
              <p className={`text-base font-mono font-bold mt-0.5 ${holding.returnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {holding.returnPct >= 0 ? '+' : ''}{holding.returnPct.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* IRR section */}
          {sections.includes('irr') && (
            <div>
              <h4 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-2">IRR Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-theme-surface px-3 py-2.5 text-center">
                  <p className="text-[10px] text-theme-tertiary">Expected</p>
                  <p className="text-sm font-mono font-bold text-theme-primary">{holding.expectedIrr != null ? `${holding.expectedIrr}%` : '—'}</p>
                </div>
                <div className="rounded-lg bg-theme-surface px-3 py-2.5 text-center">
                  <p className="text-[10px] text-theme-tertiary">Actual</p>
                  <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{holding.actualIrr != null ? `${holding.actualIrr}%` : '—'}</p>
                </div>
                <div className="rounded-lg bg-theme-surface px-3 py-2.5 text-center">
                  <p className="text-[10px] text-theme-tertiary">Appreciation</p>
                  <p className="text-sm font-mono font-bold text-theme-primary">{holding.appreciationPct != null ? `${holding.appreciationPct >= 0 ? '+' : ''}${holding.appreciationPct.toFixed(1)}%` : '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Property details */}
          {sections.includes('property_details') && (
            <div>
              <h4 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-2">Project Details</h4>
              <div className="rounded-lg border border-theme p-3 space-y-2 text-sm">
                {holding.assetType && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-theme-tertiary shrink-0" />
                    <span className="text-theme-secondary capitalize">{holding.assetType}</span>
                  </div>
                )}
                {holding.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-theme-tertiary shrink-0" />
                    <span className="text-theme-secondary">{holding.city}{holding.address ? ` · ${holding.address}` : ''}</span>
                  </div>
                )}
                {holding.projectPhase && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-theme-tertiary shrink-0" />
                    <span className="text-theme-secondary capitalize">{holding.projectPhase}</span>
                  </div>
                )}
                {holding.tagline && (
                  <p className="text-theme-secondary text-xs italic">&ldquo;{holding.tagline}&rdquo;</p>
                )}
                {holding.description && (
                  <p className="text-theme-secondary text-xs line-clamp-3">{holding.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Payout schedule (safe vault) */}
          {sections.includes('payout_schedule') && holding.payoutFrequency && (
            <div>
              <h4 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-2">Payout Schedule</h4>
              <div className="rounded-lg bg-theme-surface px-4 py-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-theme-tertiary shrink-0" />
                <span className="text-sm text-theme-primary capitalize">{holding.payoutFrequency} payouts</span>
              </div>
            </div>
          )}

          {/* Appreciation history */}
          {sections.includes('appreciation_history') && holding.investmentType === 'opportunity' && (
            <div>
              <h4 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-2">Appreciation History</h4>
              {!appreciationHistory || appreciationHistory.length === 0 ? (
                <p className="text-xs text-theme-tertiary py-2">No appreciation events yet.</p>
              ) : (
                <div className="space-y-2">
                  {appreciationHistory.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg border border-theme px-3 py-2 text-xs">
                      <div>
                        <span className="font-semibold text-theme-primary">
                          {formatINR(e.oldValuation)} → {formatINR(e.newValuation)}
                        </span>
                        {e.note && <p className="text-theme-tertiary mt-0.5">{e.note}</p>}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{(((e.newValuation - e.oldValuation) / (e.oldValuation || 1)) * 100).toFixed(1)}%
                        </span>
                        <p className="text-theme-tertiary">{new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Co-investors */}
          {sections.includes('co_investors') && holding.investmentType === 'opportunity' && (
            <div>
              <h4 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-2">Co-Investors</h4>
              <div className="rounded-lg border border-theme px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-theme-tertiary" />
                    <span className="text-theme-primary">{holding.investorCount ?? 0} investor{(holding.investorCount ?? 0) !== 1 ? 's' : ''}</span>
                  </div>
                  {holding.founderName && (
                    <span className="text-xs text-theme-tertiary">by {holding.founderName}</span>
                  )}
                </div>
                {holding.raisedAmount != null && holding.targetAmount != null && holding.targetAmount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-theme-tertiary mb-1">
                      <span>{formatINR(holding.raisedAmount)} raised</span>
                      <span>{((holding.raisedAmount / holding.targetAmount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-theme-surface-hover rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${Math.min((holding.raisedAmount / holding.targetAmount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {sections.includes('timeline') && (
            <div>
              <h4 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-2">Timeline</h4>
              <div className="rounded-lg border border-theme px-4 py-3 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-theme-tertiary shrink-0" />
                <span className="text-theme-secondary">Invested on </span>
                <span className="font-medium text-theme-primary">
                  {new Date(holding.investedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}

          {/* Project link */}
          {holding.projectSlug && (
            <a
              href={`/opportunity/${holding.projectSlug}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-theme text-sm font-semibold text-theme-primary hover:bg-theme-surface transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Project
            </a>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

/* ── Unified Activity Feed ───────────────────────────────────────── */

const TXN_COLORS: Record<string, string> = {
  investment: 'bg-primary/10 text-primary',
  payout: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  referral_bonus: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  wealthpass: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
}

const ACTIVITY_META: Record<string, { icon: typeof Heart; color: string; label: string }> = {
  liked: { icon: Heart, color: 'bg-red-50 dark:bg-red-900/30 text-red-500', label: 'Liked' },
  unliked: { icon: Heart, color: 'bg-theme-surface-hover text-theme-tertiary', label: 'Unliked' },
  shared: { icon: Share2, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500', label: 'Shared' },
  invested: { icon: ArrowDownRight, color: 'bg-primary/10 text-primary', label: 'Invested' },
  eoi_submitted: { icon: FileCheck, color: 'bg-violet-50 dark:bg-violet-900/30 text-violet-500', label: 'Expressed Interest' },
}

type UnifiedActivityItem =
  | { kind: 'financial'; data: RecentTransaction; date: Date }
  | { kind: 'activity'; data: UserActivityItem; date: Date }

function UnifiedActivityRow({
  item,
  onNavigate,
}: {
  item: UnifiedActivityItem
  onNavigate?: (slug: string) => void
}) {
  if (item.kind === 'financial') {
    const t = item.data
    const isInvestment = t.type === 'investment'
    const color = TXN_COLORS[t.type] ?? 'bg-theme-surface-hover text-theme-secondary'
    return (
      <div className="flex items-center gap-3 py-3 border-b border-theme last:border-0">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
          {isInvestment ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-theme-primary truncate">
            {t.propertyTitle || t.type.replace(/_/g, ' ')}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-theme-tertiary">
              {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            {t.vaultType && (
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                  VAULT_BADGE[t.vaultType] ?? 'bg-theme-surface-hover text-theme-tertiary'
                }`}
              >
                {VAULT_META[t.vaultType]?.label ?? t.vaultType}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-mono font-bold ${
              isInvestment ? 'text-theme-primary' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isInvestment ? '' : '+'}{formatINR(Math.abs(t.amount))}
          </p>
          <Badge variant={t.status === 'confirmed' || t.status === 'completed' ? 'success' : 'warning'} size="xs">
            {t.status}
          </Badge>
        </div>
      </div>
    )
  }

  const a = item.data
  const meta = ACTIVITY_META[a.activityType] ?? {
    icon: Clock,
    color: 'bg-theme-surface-hover text-theme-secondary',
    label: a.activityType,
  }
  const Icon = meta.icon
  return (
    <button
      onClick={a.resourceSlug && onNavigate ? () => onNavigate(a.resourceSlug!) : undefined}
      className="flex items-center gap-3 py-3 border-b border-theme last:border-0 w-full text-left hover:bg-theme-surface transition-colors"
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-theme-primary truncate">{a.resourceTitle}</p>
        <p className="text-xs text-theme-tertiary">
          {a.createdAt
            ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : ''}
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
  const [selectedHolding, setSelectedHolding] = useState<HoldingItem | null>(null)
  const [activityPage, setActivityPage] = useState(0)
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary()
  const { data: holdings, isLoading: holdingsLoading } = usePortfolioHoldings()
  const { data: snapshotConfig } = useSnapshotConfig()
  const { data: transactions, isLoading: txnLoading } = useRecentTransactions(20)
  const { data: vaultData, isLoading: vaultLoading } = useVaultWisePortfolio()
  const { data: activities } = useUserActivities(15)
  const { isVaultEnabled } = useVaultConfig()

  // Investor gate: must have completed at least one vault's DNA
  const userRole = useUserStore((s) => s.user?.role)
  const isInvestorRole = userRole === 'investor'
  const { data: overallProgress, isLoading: progressLoading } = useOverallProgress()
  const hasAnyDna = overallProgress ? Object.values(overallProgress.vaults).some((v) => v.isComplete) : false

  // CMS content (hooks must be called before any early return)
  const heroBadge = useContent('portfolio', 'hero_badge', 'Portfolio')
  const heroTitle = useContent('portfolio', 'hero_title', 'The War Chest')
  const heroSubtitle = useContent('portfolio', 'hero_subtitle', 'Your empire-in-progress \u2014 every asset, every return, all in one place.')
  const sectionVaults = useContent('portfolio', 'section_vaults', 'Vault-Wise Breakdown')
  const sectionAlloc = useContent('portfolio', 'section_alloc', 'Geographic Spread')
  const sectionReturns = useContent('portfolio', 'section_returns', 'IRR Performance')
  const sectionHoldings = useContent('portfolio', 'section_holdings', 'Holdings')
  const sectionActivity = useContent('portfolio', 'section_activity', 'Recent Activity')
  const emptyHoldings = useContent('portfolio', 'empty_holdings', 'No Holdings Yet')
  const emptyHoldingsMsg = useContent('portfolio', 'empty_holdings_msg', 'Start investing to see your portfolio here.')
  const emptyTxns = useContent('portfolio', 'empty_txns', 'No Activity Yet')
  const emptyTxnsMsg = useContent('portfolio', 'empty_txns_msg', 'Your activity and transactions will appear here.')

  if (isInvestorRole && !progressLoading && !hasAnyDna) {
    return (
      <div className="min-h-screen flex flex-col bg-theme-surface">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <EmptyState
            icon={Wallet}
            title="Complete Your Profile First"
            message="You need to complete at least one vault's DNA profiling before accessing your portfolio."
            actionLabel="Go to Profiling"
            onAction={() => navigate('/profiling')}
          />
        </main>
        <Footer />
      </div>
    )
  }

  const unifiedFeed: UnifiedActivityItem[] = [
    ...(transactions ?? []).map((t): UnifiedActivityItem => ({
      kind: 'financial',
      data: t,
      date: new Date(t.date),
    })),
    ...(activities ?? []).map((a): UnifiedActivityItem => ({
      kind: 'activity',
      data: a,
      date: new Date(a.createdAt),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50)

  const PAGE_SIZE = 10
  const visibleFeed = unifiedFeed.slice(0, (activityPage + 1) * PAGE_SIZE)

  const isLoading = summaryLoading || vaultLoading
  const disabledVaultIds = ['safe', 'community'].filter((id) => !isVaultEnabled(id))

  return (
    <div className="min-h-screen flex flex-col bg-theme-surface">
      <Navbar />

      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">{heroBadge}</span>
          <h1 className="page-hero-title">{heroTitle}</h1>
          <p className="page-hero-subtitle">{heroSubtitle}</p>
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
                  <h2 className="section-title text-xl">{sectionVaults}</h2>
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
                {/* Geographic Spread */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <MapPin className="h-5 w-5 text-theme-tertiary" />
                    <h3 className="section-title text-lg">{sectionAlloc}</h3>
                  </div>
                  <CityDistributionPanel data={summary?.cityDistribution ?? []} />
                </div>

                {/* IRR Performance */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="h-5 w-5 text-theme-tertiary" />
                    <h3 className="section-title text-lg">{sectionReturns}</h3>
                  </div>
                  <IrrBreakdownPanel vaults={vaultData?.vaults ?? []} portfolioXirr={summary?.xirr} />
                </div>
              </section>

              {/* ── Holdings ──────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="section-title text-xl">{sectionHoldings}</h2>
                  {holdings && holdings.length > 0 && (
                    <span className="text-xs text-theme-tertiary font-medium">{holdings.length} holding{holdings.length === 1 ? '' : 's'}</span>
                  )}
                </div>
                {holdingsLoading ? (
                  <LoadingState />
                ) : !holdings || holdings.length === 0 ? (
                  <EmptyState icon={Building2} title={emptyHoldings} message={emptyHoldingsMsg} />
                ) : (
                  <div className="space-y-2">
                    {holdings.map((h) => (
                      <HoldingRow key={h.id} h={h} onSnap={() => setSelectedHolding(h)} />
                    ))}
                  </div>
                )}
              </section>

              {selectedHolding && (
                <HoldingDetailModal
                  holding={selectedHolding}
                  sections={snapshotConfig?.sections ?? ['irr', 'appreciation_history', 'payout_schedule', 'documents', 'co_investors', 'property_details', 'timeline']}
                  onClose={() => setSelectedHolding(null)}
                />
              )}

              {/* ── Recent Activity ───────────────────────────────── */}
              {/* Recent Activity (unified) */}
              <section>
                <h2 className="section-title text-xl">{sectionActivity}</h2>
                {txnLoading ? (
                  <LoadingState />
                ) : unifiedFeed.length === 0 ? (
                  <EmptyState icon={Clock} title={emptyTxns} message={emptyTxnsMsg} />
                ) : (
                  <div className="rounded-xl border border-theme bg-[var(--bg-surface)] p-4">
                    {visibleFeed.map((item) => (
                      <UnifiedActivityRow
                        key={`${item.kind}-${item.data.id}`}
                        item={item}
                        onNavigate={(slug) => navigate(`/opportunity/${slug}`)}
                      />
                    ))}
                    {visibleFeed.length < unifiedFeed.length && (
                      <button
                        onClick={() => setActivityPage((p) => p + 1)}
                        className="mt-3 w-full text-xs font-medium text-theme-secondary hover:text-primary py-2 rounded-lg border border-theme hover:border-primary/40 transition-colors"
                      >
                        Load more ({unifiedFeed.length - visibleFeed.length} remaining)
                      </button>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
