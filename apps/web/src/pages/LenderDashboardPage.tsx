import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import {
  Banknote, TrendingUp, Clock, CheckCircle2, ArrowRight,
  Loader2,
} from 'lucide-react'
import { DataTable, Badge, type Column } from '@/components/ui'
import { useLenderDashboard, useLenderLoans, type LoanItem } from '@/hooks/useLender'
import { useOpportunities } from '@/hooks/useOpportunities'

export default function LenderDashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useLenderDashboard()
  const { data: loansData, isLoading: loansLoading } = useLenderLoans({ status: 'active' })
  const { data: oppsData } = useOpportunities({ status: 'funding' })

  const loans = loansData?.items ?? []
  const opportunities = oppsData?.items ?? []

  return (
    <PortalLayout variant="lender">
      {/* Hero */}
      <div className="page-hero bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Lender Portal</span>
          <h1 className="page-hero-title">Lender Dashboard</h1>
          <p className="page-hero-subtitle">Manage your lending portfolio — track loans, returns & repayments.</p>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-container space-y-6">

        {/* Metrics */}
        {summaryLoading ? (
          <div className="flex items-center justify-center py-10 text-theme-secondary">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
          </div>
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Lent"
            value={formatINRCompact(summary?.totalLent ?? 0)}
            icon={<Banknote className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Active Loans"
            value={String(summary?.activeLoans ?? 0)}
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          />
          <MetricCard
            label="Interest Earned"
            value={formatINRCompact(summary?.totalInterestEarned ?? 0)}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Upcoming Payments"
            value={String(summary?.upcomingPayments ?? 0)}
            icon={<Clock className="h-5 w-5 text-warning" />}
          />
        </div>
        )}

        {/* Active Loans */}
        <div className="card overflow-hidden">
          <div className="p-6 pb-3 flex items-center justify-between">
            <h2 className="section-title text-lg">Active Loans</h2>
            <Link to="/portal/investor/lender/loans" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4 pt-0">
            {loansLoading ? (
              <div className="flex items-center justify-center py-10 text-theme-secondary">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading loans…
              </div>
            ) : (
            <DataTable
              data={loans}
              keyExtractor={(loan) => loan.id}
              emptyMessage="No active loans"
              columns={[
                {
                  key: 'property',
                  header: 'Property',
                  render: (loan) => (
                    <div>
                      <p className="font-medium text-theme-primary">{loan.propertyTitle ?? '—'}</p>
                      <p className="text-xs text-theme-secondary">{loan.propertyCity ?? ''}</p>
                    </div>
                  ),
                },
                {
                  key: 'amount',
                  header: 'Principal',
                  headerClassName: 'text-right',
                  className: 'text-right font-mono',
                  render: (loan) => <>{formatINRCompact(loan.principal / 100)}</>,
                },
                {
                  key: 'return',
                  header: 'Rate',
                  headerClassName: 'text-right',
                  className: 'text-right font-mono font-semibold text-primary',
                  render: (loan) => <>{formatPercent(loan.interestRate)}</>,
                },
                {
                  key: 'tenure',
                  header: 'Tenure',
                  headerClassName: 'text-right',
                  className: 'text-right text-theme-secondary',
                  render: (loan) => <>{loan.tenureMonths} mo</>,
                },
                {
                  key: 'repaid',
                  header: 'Repaid',
                  className: 'min-w-[120px]',
                  render: (loan) => {
                    const repaidPct = loan.principal > 0 ? Math.round((loan.amountRepaid / loan.principal) * 100) : 0
                    return (
                      <div>
                        <div className="h-1.5 bg-theme-surface-hover rounded-full">
                          <div className="h-full bg-success rounded-full" style={{ width: `${repaidPct}%` }} />
                        </div>
                        <p className="text-xs text-theme-secondary mt-1">{repaidPct}% repaid</p>
                      </div>
                    )
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  headerClassName: 'text-center',
                  className: 'text-center',
                  render: (loan) => <Badge variant={loan.status === 'active' ? 'success' : 'neutral'} size="sm">{loan.status}</Badge>,
                },
              ] as Column<LoanItem>[]}
            />
            )}
          </div>
        </div>

        {/* Lending Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title text-lg">Lending Opportunities</h2>
            <Link to="/portal/investor/lender/opportunities" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {opportunities.length === 0 ? (
            <p className="text-sm text-theme-secondary py-6 text-center">No funding opportunities right now.</p>
          ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-theme-primary">{opp.title}</h3>
                    <p className="text-xs text-theme-secondary">{opp.city}{opp.state ? `, ${opp.state}` : ''}</p>
                  </div>
                  <span className="pill-upcoming">New</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-theme-secondary">Target</p>
                    <p className="font-mono font-semibold text-theme-primary">{formatINRCompact(opp.targetAmount ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-secondary">IRR</p>
                    <p className="font-mono font-semibold text-primary">{formatPercent(opp.targetIrr ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-secondary">Min Invest</p>
                    <p className="font-semibold text-theme-primary">{formatINRCompact(opp.minInvestment ?? 0)}</p>
                  </div>
                </div>
                <Link to={`/opportunities/${opp.slug}`} className="btn-primary w-full text-sm text-center block">
                  View Details
                </Link>
              </div>
            ))}
          </div>
          )}
        </div>
        </div>
      </div>
    </PortalLayout>
  )
}
