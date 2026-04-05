import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import { formatINRCompact, formatPercent, formatDate } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import {
  Banknote, TrendingUp, Clock, CheckCircle2, ArrowRight,
  Calendar,
} from 'lucide-react'

const MOCK_SUMMARY = {
  totalLent: 25000000,
  activeLoans: 5,
  avgReturn: 12.5,
  pendingRepayments: 3,
  totalReturned: 3200000,
  nextRepaymentDate: '2026-04-15',
}

const MOCK_LOANS = [
  {
    id: '1', property: 'Skyline Towers', builder: 'ABC Developers', amount: 5000000,
    returnRate: 13.0, disbursed: '2025-11-01', maturity: '2026-11-01', status: 'active',
    repaid: 1250000,
  },
  {
    id: '2', property: 'Harbour Point', builder: 'XYZ Builders', amount: 8000000,
    returnRate: 12.0, disbursed: '2025-09-15', maturity: '2026-09-15', status: 'active',
    repaid: 4000000,
  },
  {
    id: '3', property: 'Green Valley', builder: 'PQR Group', amount: 3000000,
    returnRate: 14.0, disbursed: '2025-06-01', maturity: '2026-06-01', status: 'active',
    repaid: 2250000,
  },
]

const MOCK_OPPORTUNITIES = [
  {
    id: 'a', property: 'Lakeside Villas', city: 'Chennai', amount: 10000000,
    returnRate: 13.5, tenure: '12 months', builder: 'RST Infra',
  },
  {
    id: 'b', property: 'Metro Hub', city: 'Hyderabad', amount: 7000000,
    returnRate: 11.8, tenure: '9 months', builder: 'EFG Developers',
  },
]

export default function LenderDashboardPage() {
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Lent"
            value={formatINRCompact(MOCK_SUMMARY.totalLent)}
            icon={<Banknote className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Active Loans"
            value={String(MOCK_SUMMARY.activeLoans)}
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          />
          <MetricCard
            label="Avg. Return"
            value={formatPercent(MOCK_SUMMARY.avgReturn)}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Pending Repayments"
            value={String(MOCK_SUMMARY.pendingRepayments)}
            icon={<Clock className="h-5 w-5 text-warning" />}
          />
        </div>

        {/* Upcoming repayment alert */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Next repayment on {formatDate(MOCK_SUMMARY.nextRepaymentDate)}</p>
            <p className="text-xs text-gray-600 mt-0.5">₹12,50,000 expected from Skyline Towers</p>
          </div>
        </div>

        {/* Active Loans */}
        <div className="card overflow-hidden">
          <div className="p-6 pb-3 flex items-center justify-between">
            <h2 className="section-title text-lg">Active Loans</h2>
            <Link to="/portal/investor/lender/loans" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-500">Property / Builder</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Amount</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Return</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Maturity</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-500">Repaid</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_LOANS.map((loan) => {
                  const repaidPct = Math.round((loan.repaid / loan.amount) * 100)
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{loan.property}</p>
                        <p className="text-xs text-gray-500">{loan.builder}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{formatINRCompact(loan.amount)}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-primary">{formatPercent(loan.returnRate)}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{formatDate(loan.maturity)}</td>
                      <td className="px-6 py-4 min-w-[120px]">
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full bg-success rounded-full" style={{ width: `${repaidPct}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{repaidPct}% repaid</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="pill-active">{loan.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
          <div className="grid sm:grid-cols-2 gap-4">
            {MOCK_OPPORTUNITIES.map((opp) => (
              <div key={opp.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{opp.property}</h3>
                    <p className="text-xs text-gray-500">{opp.city} · {opp.builder}</p>
                  </div>
                  <span className="pill-upcoming">New</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-mono font-semibold text-gray-900">{formatINRCompact(opp.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Returns</p>
                    <p className="font-mono font-semibold text-primary">{formatPercent(opp.returnRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tenure</p>
                    <p className="font-semibold text-gray-900">{opp.tenure}</p>
                  </div>
                </div>
                <button className="btn-primary w-full text-sm">Express Interest</button>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </PortalLayout>
  )
}
