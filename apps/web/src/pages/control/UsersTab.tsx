import { useState } from 'react'
import { Search, Edit3, Check, X, Loader2 } from 'lucide-react'
import { Select, Badge } from '@/components/ui'
import { useControlUsers, useUpdateUserRole } from '@/hooks/useControlCentre'
import { ROLE_LABELS, type UserRole } from '@/lib/constants'

export default function UsersTab() {
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
      <h2 className="font-display text-xl font-bold text-theme-primary">Users & Roles</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-theme pl-9 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-64"
            placeholder="Search by email or name…"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All Roles"
          options={[{ value: '', label: 'All Roles' }, ...Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))]}
          size="sm"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-theme-surface border-b border-theme">
              <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">KYC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-theme-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {isLoading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></td></tr>
            ) : !users || users.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-theme-tertiary">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-theme-surface/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-theme-primary">{u.fullName}</p>
                    <p className="text-xs text-theme-tertiary">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingUser === u.id ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRole}
                          onChange={setSelectedRole}
                          placeholder="Select…"
                          options={Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                          size="sm"
                        />
                        <button
                          onClick={() => handleSaveRole(u.id)}
                          disabled={!selectedRole || updateRole.isPending}
                          className="p-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-40"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingUser(null); setSelectedRole('') }}
                          className="p-1 rounded bg-theme-surface text-theme-tertiary hover:bg-[var(--bg-surface-hover)]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium bg-theme-surface-hover text-theme-secondary px-2 py-0.5 rounded">
                        {ROLE_LABELS[u.role as UserRole] ?? u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.kycStatus === 'approved' ? 'success' : u.kycStatus === 'rejected' ? 'danger' : 'warning'} size="sm">
                      {u.kycStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-theme-tertiary whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingUser !== u.id && (
                      <button
                        onClick={() => { setEditingUser(u.id); setSelectedRole(u.role) }}
                        className="p-1.5 rounded-lg border border-theme hover:bg-theme-surface text-theme-tertiary hover:text-theme-secondary"
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
