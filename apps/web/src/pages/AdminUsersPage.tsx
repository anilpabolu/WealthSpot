import { PortalLayout } from '@/components/layout'
import { useState } from 'react'
import {
  Users, Shield, Search, MoreHorizontal,
  CheckCircle, XCircle, Clock, Eye, Ban, UserPlus,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

type UserRole = 'investor' | 'builder' | 'lender' | 'admin'
type KycStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: UserRole
  kyc_status: KycStatus
  is_active: boolean
  created_at: string
  investment_count?: number
}

// ── Mock Data ─────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: '1', full_name: 'Anita Verma', email: 'anita@email.com', role: 'investor', kyc_status: 'APPROVED', is_active: true, created_at: '2025-01-15', investment_count: 3 },
  { id: '2', full_name: 'Vikram Singh', email: 'vikram@email.com', role: 'investor', kyc_status: 'IN_PROGRESS', is_active: true, created_at: '2025-02-20', investment_count: 0 },
  { id: '3', full_name: 'Rajesh Constructions', email: 'rajesh@builders.com', role: 'builder', kyc_status: 'APPROVED', is_active: true, created_at: '2024-12-01', investment_count: 0 },
  { id: '4', full_name: 'Meena Capital LLC', email: 'meena@lenders.com', role: 'lender', kyc_status: 'APPROVED', is_active: true, created_at: '2025-03-10', investment_count: 0 },
  { id: '5', full_name: 'Karan Patel', email: 'karan@email.com', role: 'investor', kyc_status: 'NOT_STARTED', is_active: false, created_at: '2025-05-01', investment_count: 0 },
  { id: '6', full_name: 'Deepak Sharma', email: 'deepak@email.com', role: 'investor', kyc_status: 'UNDER_REVIEW', is_active: true, created_at: '2025-04-18', investment_count: 1 },
]

// ── Helpers ───────────────────────────────────────────────────────────────

const kycBadge: Record<KycStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  APPROVED: { bg: 'bg-green-100 text-green-700', text: 'Approved', icon: CheckCircle },
  REJECTED: { bg: 'bg-red-100 text-red-700', text: 'Rejected', icon: XCircle },
  UNDER_REVIEW: { bg: 'bg-yellow-100 text-yellow-700', text: 'Under Review', icon: Clock },
  IN_PROGRESS: { bg: 'bg-blue-100 text-blue-700', text: 'In Progress', icon: Clock },
  NOT_STARTED: { bg: 'bg-gray-100 text-gray-500', text: 'Not Started', icon: Clock },
}

const roleBadge: Record<UserRole, string> = {
  investor: 'bg-primary/10 text-primary',
  builder: 'bg-orange-100 text-orange-700',
  lender: 'bg-cyan-100 text-cyan-700',
  admin: 'bg-purple-100 text-purple-700',
}

// ── Component ─────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [kycFilter, setKycFilter] = useState<KycStatus | ''>('')

  const filtered = MOCK_USERS.filter((u) => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (roleFilter && u.role !== roleFilter) return false
    if (kycFilter && u.kyc_status !== kycFilter) return false
    return true
  })

  return (
    <PortalLayout variant="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">{MOCK_USERS.length} registered users</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition">
            <UserPlus className="h-4 w-4" />
            Invite User
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: MOCK_USERS.length, icon: Users, color: 'text-primary' },
            { label: 'Investors', value: MOCK_USERS.filter(u => u.role === 'investor').length, icon: Users, color: 'text-green-600' },
            { label: 'KYC Pending', value: MOCK_USERS.filter(u => u.kyc_status === 'UNDER_REVIEW').length, icon: Shield, color: 'text-yellow-600' },
            { label: 'Inactive', value: MOCK_USERS.filter(u => !u.is_active).length, icon: Ban, color: 'text-red-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border-2 border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          >
            <option value="">All Roles</option>
            <option value="investor">Investor</option>
            <option value="builder">Builder</option>
            <option value="lender">Lender</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value as KycStatus | '')}
          >
            <option value="">All KYC</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user) => {
                  const kyc = kycBadge[user.kyc_status]
                  const KycIcon = kyc.icon
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${kyc.bg}`}>
                          <KycIcon className="h-3 w-3" />
                          {kyc.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="View details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="More options">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No users match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
