import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Bell,
  FileVideo,
  FileSpreadsheet,
  Settings,
  Loader2,
  Edit3,
  Check,
  X,
  Search,
} from 'lucide-react'
import { UserButton } from '@clerk/react'
import {
  useControlDashboard,
  useControlConfigs,
  useUpdateConfig,
  useControlUsers,
  useUpdateUserRole,
} from '@/hooks/useControlCentre'
import { useApprovalStats } from '@/hooks/useApprovals'
import { ROLE_LABELS, type UserRole } from '@/lib/constants'

/* ------------------------------------------------------------------ */
/*  Side-nav sections                                                  */
/* ------------------------------------------------------------------ */

type Section = 'dashboard' | 'users' | 'approvals' | 'notifications' | 'content' | 'templates' | 'platform'

const SECTIONS: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'approvals', label: 'Approval Config', icon: ClipboardCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'content', label: 'Content & Videos', icon: FileVideo },
  { id: 'templates', label: 'Templates', icon: FileSpreadsheet },
  { id: 'platform', label: 'Platform Settings', icon: Settings },
]

/* ------------------------------------------------------------------ */
/*  Dashboard Tab                                                      */
/* ------------------------------------------------------------------ */

function DashboardTab() {
  const { data, isLoading } = useControlDashboard()
  const { data: approvalStats } = useApprovalStats()

  if (isLoading) return <CenteredLoader />
  if (!data) return <p className="text-gray-400 text-center py-12">Failed to load dashboard</p>

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl font-bold text-gray-900">Platform Overview</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.totalUsers} color="text-primary bg-primary/5" />
        <StatCard label="Pending Approvals" value={approvalStats?.pending ?? data.pendingApprovals} color="text-amber-600 bg-amber-50" />
        <StatCard label="Opportunities" value={data.totalOpportunities} color="text-violet-600 bg-violet-50" />
        <StatCard label="Active Configs" value={data.activeConfigs} color="text-emerald-600 bg-emerald-50" />
      </div>

      {/* Role distribution */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Role Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(data.roleDistribution).map(([role, count]) => (
            <div key={role} className="rounded-lg border border-gray-200 px-4 py-3 bg-white">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{ROLE_LABELS[role as UserRole] ?? role}</p>
              <p className="text-lg font-bold font-mono text-gray-900 mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Users & Roles Tab                                                  */
/* ------------------------------------------------------------------ */

function UsersTab() {
  const [roleFilter, setRoleFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { data: users, isLoading } = useControlUsers({ role: roleFilter || undefined, search: searchTerm || undefined })
  const updateRole = useUpdateUserRole()
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')

  const handleSaveRole = async (userId: string) => {
    if (!selectedRole) return
    await updateRole.mutateAsync({ userId, role: selectedRole })
    setEditingUser(null)
    setSelectedRole('')
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-gray-900">Users & Roles</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-64"
            placeholder="Search by email or name…"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary outline-none"
        >
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></td></tr>
            ) : !users || users.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-400">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingUser === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="text-xs rounded border border-gray-300 px-2 py-1 focus:border-primary outline-none"
                        >
                          <option value="">Select…</option>
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveRole(u.id)}
                          disabled={!selectedRole || updateRole.isPending}
                          className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingUser(null); setSelectedRole('') }}
                          className="p-1 rounded bg-gray-50 text-gray-400 hover:bg-gray-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {ROLE_LABELS[u.role as UserRole] ?? u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      u.kycStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      u.kycStatus === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingUser !== u.id && (
                      <button
                        onClick={() => { setEditingUser(u.id); setSelectedRole(u.role) }}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                        title="Change role"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Config Section Tab (generic for approvals/notifications/etc.)      */
/* ------------------------------------------------------------------ */

function ConfigTab({ section, title }: { section: string; title: string }) {
  const { data: configs, isLoading } = useControlConfigs(section)
  const updateConfig = useUpdateConfig()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleSave = async (id: string) => {
    let parsed: unknown
    try { parsed = JSON.parse(editValue) } catch { parsed = editValue }
    await updateConfig.mutateAsync({ id, value: parsed })
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-gray-900">{title}</h2>

      {isLoading ? (
        <CenteredLoader />
      ) : !configs || configs.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No configurations found for this section</p>
      ) : (
        <div className="space-y-3">
          {configs.map((cfg) => (
            <div key={cfg.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{cfg.key}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {cfg.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  {cfg.description && <p className="text-xs text-gray-400 mt-0.5">{cfg.description}</p>}

                  {editingId === cfg.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                      <button
                        onClick={() => handleSave(cfg.id)}
                        disabled={updateConfig.isPending}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-gray-500 mt-1 break-all">
                      {typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value)}
                    </p>
                  )}
                </div>

                {editingId !== cfg.id && (
                  <button
                    onClick={() => { setEditingId(cfg.id); setEditValue(typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value)) }}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 shrink-0"
                    title="Edit value"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl px-5 py-4 ${color}`}>
      <p className="text-2xl font-bold font-mono">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  )
}

function CenteredLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CommandControlPage() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-[1400px] px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/vaults" className="flex items-center gap-2 shrink-0">
              <Shield className="h-8 w-8 text-primary" />
              <span className="font-display text-xl font-bold tracking-tight text-gray-900">
                Wealth<span className="text-primary">Spot</span>
              </span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-red-600">Command Control Centre</span>
          </div>
          <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9 ring-2 ring-red-200' } }} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 mx-auto max-w-[1400px] w-full">
        {/* Side Nav */}
        <aside className="w-56 shrink-0 border-r border-gray-200 bg-white py-6 px-3 hidden md:block">
          <nav className="space-y-1">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              const active = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile section picker */}
        <div className="md:hidden sticky top-16 z-40 bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              const active = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 sm:p-8">
          {activeSection === 'dashboard' && <DashboardTab />}
          {activeSection === 'users' && <UsersTab />}
          {activeSection === 'approvals' && <ConfigTab section="approvals" title="Approval Configuration" />}
          {activeSection === 'notifications' && <ConfigTab section="notifications" title="Notification Settings" />}
          {activeSection === 'content' && <ConfigTab section="content" title="Content & Video Management" />}
          {activeSection === 'templates' && <ConfigTab section="templates" title="Template Configuration" />}
          {activeSection === 'platform' && <ConfigTab section="platform" title="Platform Settings" />}
        </main>
      </div>
    </div>
  )
}
