import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { usePropertyInvestmentDetail } from '@/hooks/usePortfolio'
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Wallet,
  IndianRupee,
  Loader2,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

function formatINR(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PropertyPortfolioDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = usePropertyInvestmentDetail(propertyId)

  return (
    <div className="min-h-screen flex flex-col bg-theme-surface">
      <Navbar />

      <main className="flex-1">
        <div className="page-section">
          <div className="page-section-container space-y-8 max-w-3xl mx-auto">

            {/* Back */}
            <button onClick={() => navigate('/portfolio')} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium">
              <ArrowLeft className="h-4 w-4" /> Back to Portfolio
            </button>

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}

            {error && (
              <div className="text-center py-20 text-red-500 text-sm">Failed to load property details.</div>
            )}

            {data && (
              <>
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-display font-bold text-theme-primary">{data.propertyName}</h1>
                  <p className="text-sm text-theme-tertiary mt-1">{data.city} · {data.assetType}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="stat-card">
                    <div className="stat-card-icon bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mt-3">Total Invested</p>
                    <p className="text-xl font-bold font-mono text-theme-primary">{formatINR(data.totalInvested)}</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon bg-primary/10"><IndianRupee className="h-5 w-5 text-primary" /></div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mt-3">Current Value</p>
                    <p className="text-xl font-bold font-mono text-theme-primary">{formatINR(data.currentValue)}</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon bg-emerald-100 dark:bg-emerald-900/30"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mt-3">Appreciation</p>
                    <p className={`text-xl font-bold font-mono ${data.appreciationPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {data.appreciationPct >= 0 ? '+' : ''}{data.appreciationPct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-theme-tertiary">
                      {formatINR(data.originalUnitPrice)} → {formatINR(data.currentUnitPrice)}/unit
                    </p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mt-3">Holdings</p>
                    <p className="text-xl font-bold font-mono text-theme-primary">{data.totalUnits} units</p>
                    <p className="text-xs text-theme-tertiary">{data.investmentCount} investment{data.investmentCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Individual Investments */}
                <section>
                  <h2 className="section-title text-lg mb-3">Your Investments</h2>
                  <div className="rounded-xl border border-theme bg-[var(--bg-surface)] divide-y divide-theme">
                    {data.investments.map((inv) => (
                      <div key={inv.investmentId} className="flex items-center gap-4 px-4 py-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-theme-primary">{inv.units} units @ {formatINR(inv.unitPrice)}/unit</p>
                          <p className="text-xs text-theme-tertiary">{fmtDate(inv.investedAt)}</p>
                        </div>
                        <p className="text-sm font-mono font-bold text-theme-primary">{formatINR(inv.amount)}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Appreciation History */}
                {data.appreciationHistory.length > 0 && (
                  <section>
                    <h2 className="section-title text-lg mb-3">Appreciation History</h2>
                    <div className="rounded-xl border border-theme bg-[var(--bg-surface)] divide-y divide-theme">
                      {data.appreciationHistory.map((e) => {
                        const pctChange = e.oldValuation > 0 ? ((e.newValuation - e.oldValuation) / e.oldValuation * 100) : 0
                        return (
                          <div key={e.id} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-theme-primary">
                                    {formatINR(e.oldValuation)} → {formatINR(e.newValuation)}
                                  </p>
                                  <p className="text-xs text-theme-tertiary flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {fmtDate(e.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-sm font-mono font-semibold ${pctChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                              </span>
                            </div>
                            {e.note && <p className="text-xs text-theme-tertiary mt-1.5 ml-11">{e.note}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}
              </>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
