import { PortalLayout } from '@/components/layout'
import { useState } from 'react'
import { Select, DataTable, Badge, type Column } from '@/components/ui'
import {
  Users, Shield, Search, MoreHorizontal,
  CheckCircle, XCircle, Clock, Eye, Ban, UserPlus, Loader2,
} from 'lucide-react'
import { useControlUsers } from '@/hooks/useControlCentre'

// ── Types ─────────────────────────────────────────────────────────────────

type UserRole = 'investor' | 'builder' | 'lender' | 'admin'
type KycStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

interface AdminUser {
  id: string
  fullName: string
  email: string
  role: string
  kycStatus: string
  isActive: boolean
  createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────

const kycBadge: Record<KycStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  APPROVED: { bg: 'bg-green-100 text-green-700', text: 'Approved', icon: CheckCircle },
  REJECTED: { bg: 'bg-red-100 text-red-700 dark:text-red-300', text: 'Rejected', icon: XCircle },
  UNDER_REVIEW: { bg: 'bg-yellow-100 text-yellow-700', text: 'Under Review', icon: Clock },
  IN_PROGRESS: { bg: 'bg-blue-100 text-blue-700 dark:text-blue-300', text: 'In Progress', icon: Clock },
  NOT_STARTED: { bg: 'bg-theme-surface-hover text-theme-secondary', text: 'Not Started', icon: Clock },
}

const roleBadge: Record<UserRole, string> = {
  investor: 'bg-primary/10 text-primary',
  builder: 'bg-orange-100 text-orange-700 dark:text-orange-300',
  lender: 'bg-cyan-100 text-cyan-700 dark:text-cyan-300',
  admin: 'bg-purple-100 text-purple-700 dark:text-purple-300',
}

// ── Component ─────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [kycFilter, setKycFilter] = useState<KycStatus | ''>('')

  const { data: users = [], isLoading } = useControlUsers({
    role: roleFilter || undefined,
    search: search || undefined,
  })

  const filtered = users.filter((u) => {
    if (kycFilter && u.kycStatus !== kycFilter) return false
    return true
  })

  return (
    <PortalLayout variant="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title text-2xl">User Management</h1>
            <p className="text-theme-secondary mt-1">{users.length} registered users</p>
          </div>
          <button className="btn-primary inline-flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite User
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'text-primary' },
            { label: 'Investors', value: users.filter(u => u.role === 'investor').length, icon: Users, color: 'text-green-600' },
            { label: 'KYC Pending', value: users.filter(u => u.kycStatus === 'UNDER_REVIEW').length, icon: Shield, color: 'text-yellow-600' },
            { label: 'Inactive', value: users.filter(u => !u.isActive).length, icon: Ban, color: 'text-red-600 dark:text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-theme-secondary">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border-2 border-theme rounded-lg text-sm focus:outline-none focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as UserRole | '')}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'investor', label: 'Investor' },
              { value: 'builder', label: 'Builder' },
              { value: 'lender', label: 'Lender' },
              { value: 'admin', label: 'Admin' },
            ]}
            size="sm"
          />
          <Select
            value={kycFilter}
            onChange={(v) => setKycFilter(v as KycStatus | '')}
            options={[
              { value: '', label: 'All KYC' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'UNDER_REVIEW', label: 'Under Review' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'NOT_STARTED', label: 'Not Started' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
            size="sm"
          />
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-theme-secondary">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading users…
          </div>
        ) : (
        <DataTable
          data={filtered}
          keyExtractor={(user) => user.id}
          emptyMessage="No users match your filters"
          columns={[
            {
              key: 'user',
              header: 'User',
              render: (user) => (
                <div>
                  <p className="font-medium text-theme-primary">{user.fullName}</p>
                  <p className="text-xs text-theme-secondary">{user.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (user) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[user.role as UserRole] ?? 'bg-theme-surface-hover text-theme-secondary'}`}>
                  {user.role}
                </span>
              ),
            },
            {
              key: 'kyc',
              header: 'KYC Status',
              render: (user) => {
                const kyc = kycBadge[user.kycStatus as KycStatus] ?? kycBadge.NOT_STARTED
                const KycIcon = kyc.icon
                return (
                  <Badge variant={user.kycStatus === 'APPROVED' ? 'success' : user.kycStatus === 'REJECTED' ? 'danger' : user.kycStatus === 'UNDER_REVIEW' ? 'warning' : 'info'} icon={<KycIcon className="h-3 w-3" />}>
                    {kyc.text}
                  </Badge>
                )
              },
            },
            {
              key: 'status',
              header: 'Status',
              render: (user) => (
                <Badge variant={user.isActive ? 'success' : 'danger'} dot>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'joined',
              header: 'Joined',
              sortable: true,
              sortValue: (user) => new Date(user.createdAt).getTime(),
              render: (user) => (
                <span className="text-theme-secondary">
                  {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: () => (
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-secondary" title="View details">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-secondary" title="More options">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ] as Column<AdminUser>[]}
        />
        )}
      </div>
    </PortalLayout>
  )
}
