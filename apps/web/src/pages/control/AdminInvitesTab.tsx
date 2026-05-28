import { useState } from 'react'
import { Badge } from '@/components/ui'
import { useAdminInvites, useCreateAdminInvite } from '@/hooks/useVaultFeatures'
import { CenteredLoader } from './shared'

export default function AdminInvitesTab() {
  const { data: invites, isLoading } = useAdminInvites()
  const createInvite = useCreateAdminInvite()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')

  const handleInvite = () => {
    if (!email) return
    createInvite.mutate({ email, role }, { onSuccess: () => setEmail('') })
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-theme-primary">Admin Invites</h2>

      <div className="rounded-xl border border-theme bg-[var(--bg-surface)] p-5 space-y-4">
        <h3 className="font-semibold text-theme-primary">Send Invite</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="flex-1 px-4 py-2 rounded-lg border border-theme bg-theme-surface text-theme-primary placeholder:text-theme-tertiary text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
            className="px-4 py-2 rounded-lg border border-theme bg-theme-surface text-theme-primary text-sm"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={createInvite.isPending || !email}
            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {createInvite.isPending ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
        {createInvite.isError && (
          <p className="text-red-500 text-sm">
            {(createInvite.error as any)?.response?.data?.detail || 'Failed to send invite. Please try again.'}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-theme bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-theme">
          <h3 className="font-semibold text-theme-primary">All Invites</h3>
        </div>
        {(!invites || invites.length === 0) ? (
          <p className="text-theme-tertiary text-center py-8 text-sm">No invites yet.</p>
        ) : (
          <div className="divide-y divide-theme">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-theme-primary">{inv.email}</p>
                  <p className="text-xs text-theme-tertiary mt-0.5 capitalize">{inv.role.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === 'accepted' ? 'success' : inv.status === 'expired' ? 'danger' : 'warning'}>
                    {inv.status}
                  </Badge>
                  <span className="text-xs text-theme-tertiary">
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
