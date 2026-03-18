import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import {
  Users, Building2, IndianRupee, ShieldCheck, ArrowRight,
  AlertTriangle, Clock, FileCheck, TrendingUp,
} from 'lucide-react'

const MOCK_ADMIN = {
  totalAum: 420000000,
  totalUsers: 8245,
  activeProperties: 45,
  pendingKyc: 12,
  pendingApprovals: 3,
  revenue: 6300000,
  complianceScore: 98.5,
}

const MOCK_ALERTS = [
  { id: '1', type: 'warning' as const, text: '12 KYC verifications pending review', action: '/portal/admin/kyc' },
  { id: '2', type: 'warning' as const, text: '3 property listings awaiting approval', action: '/portal/admin/properties' },
  { id: '3', type: 'info' as const, text: 'Monthly compliance report due in 5 days', action: '/portal/admin/compliance' },
]

const MOCK_RECENT = [
  { text: 'New builder "RST Infra" registered', time: '30 min ago' },
  { text: 'Property "Lakeside Villas" submitted for review', time: '1 hour ago' },
  { text: 'Investment of ₹5,00,000 in Skyline Towers', time: '2 hours ago' },
  { text: 'KYC approved for user ID #4523', time: '3 hours ago' },
  { text: 'Monthly payout processed — ₹12.5L distributed', time: '1 day ago' },
]

export default function AdminDashboardPage() {
  return (
    <PortalLayout variant="admin">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-500 mt-1">Platform management dashboard</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total AUM"
            value={formatINRCompact(MOCK_ADMIN.totalAum)}
            icon={<IndianRupee className="h-5 w-5 text-primary" />}
            delta="+12.5%"
            deltaPositive
          />
          <MetricCard
            label="Total Users"
            value={MOCK_ADMIN.totalUsers.toLocaleString('en-IN')}
            icon={<Users className="h-5 w-5 text-primary" />}
            delta="+340 this month"
            deltaPositive
          />
          <MetricCard
            label="Active Properties"
            value={String(MOCK_ADMIN.activeProperties)}
            icon={<Building2 className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Compliance Score"
            value={formatPercent(MOCK_ADMIN.complianceScore)}
            icon={<ShieldCheck className="h-5 w-5 text-success" />}
          />
        </div>

        {/* Alerts */}
        {MOCK_ALERTS.length > 0 && (
          <div className="space-y-2">
            {MOCK_ALERTS.map((alert) => (
              <Link
                key={alert.id}
                to={alert.action}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                    : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                }`}
              >
                <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                  alert.type === 'warning' ? 'text-warning' : 'text-info'
                }`} />
                <span className="text-sm text-gray-700 flex-1">{alert.text}</span>
                <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/portal/admin/kyc" className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                <FileCheck className="h-6 w-6 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">KYC Queue</p>
                  <p className="text-xs text-gray-500">{MOCK_ADMIN.pendingKyc} pending</p>
                </div>
              </Link>
              <Link to="/portal/admin/properties" className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Properties</p>
                  <p className="text-xs text-gray-500">{MOCK_ADMIN.pendingApprovals} to approve</p>
                </div>
              </Link>
              <Link to="/portal/admin/users" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <Users className="h-6 w-6 text-gray-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">User Mgmt</p>
                  <p className="text-xs text-gray-500">{MOCK_ADMIN.totalUsers} users</p>
                </div>
              </Link>
              <Link to="/portal/admin/analytics" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <TrendingUp className="h-6 w-6 text-gray-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">Revenue: {formatINRCompact(MOCK_ADMIN.revenue)}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-gray-900">Recent Activity</h2>
              <Link to="/portal/admin/audit" className="text-sm text-primary hover:underline flex items-center gap-1">
                Audit Log <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_RECENT.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue summary card */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold">Platform Fees</p>
              <p className="font-mono text-lg font-bold text-gray-900 mt-1">{formatINRCompact(4500000)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold">WealthPass</p>
              <p className="font-mono text-lg font-bold text-gray-900 mt-1">{formatINRCompact(890000)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold">Builder Fees</p>
              <p className="font-mono text-lg font-bold text-gray-900 mt-1">{formatINRCompact(650000)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold">Other</p>
              <p className="font-mono text-lg font-bold text-gray-900 mt-1">{formatINRCompact(260000)}</p>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
