/**
 * PersonaSwitcher — inline component rendered inside the profile dropdown.
 * Shows the user's active persona and lets them switch between personas they have,
 * or add a new one. Hidden for admin/super_admin users.
 */

import { useState } from 'react'
import { apiPost } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

const PERSONA_META: Record<string, { label: string; color: string; bg: string }> = {
  investor: { label: 'Investor', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' },
  builder:  { label: 'Builder',  color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
}

export default function PersonaSwitcher() {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const [switching, setSwitching] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  // Don't show for admin/super_admin
  if (['admin', 'super_admin'].includes(user.primaryRole)) return null

  const switchable = (user.roles || []).filter((r) => r !== user.primaryRole && PERSONA_META[r])
  const addable = Object.keys(PERSONA_META).filter((r) => !(user.roles || []).includes(r))

  const handleSwitch = async (role: string) => {
    setSwitching(role)
    setError(null)
    try {
      const res = await apiPost<{
        primaryRole: string
        roles: string[]
        builderApproved: boolean
      }>('/auth/switch-persona', { primary_role: role })

      setUser({
        ...user,
        primaryRole: res.primaryRole,
        roles: res.roles,
        builderApproved: res.builderApproved,
        role: res.primaryRole as typeof user.role,
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to switch persona')
    } finally {
      setSwitching(null)
    }
  }

  const handleAdd = async (role: string) => {
    setAdding(true)
    setError(null)
    try {
      const res = await apiPost<{
        primaryRole: string
        roles: string[]
        builderApproved: boolean
        personaSelectedAt: string
      }>('/auth/add-persona', { role })

      setUser({
        ...user,
        roles: res.roles,
        primaryRole: res.primaryRole,
        builderApproved: res.builderApproved,
        personaSelectedAt: res.personaSelectedAt,
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to add persona')
    } finally {
      setAdding(false)
    }
  }

  const currentMeta = PERSONA_META[user.primaryRole]

  return (
    <div className="px-4 py-3 border-b border-theme">
      {/* Current persona badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-theme-tertiary uppercase tracking-wider">Active Persona</span>
        {currentMeta && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${currentMeta.bg} ${currentMeta.color}`}>
            {currentMeta.label}
          </span>
        )}
      </div>

      {/* Switch options */}
      {switchable.length > 0 && (
        <div className="space-y-1.5">
          {switchable.map((role) => {
            const meta = PERSONA_META[role]
            if (!meta) return null
            return (
              <button
                key={role}
                onClick={() => handleSwitch(role)}
                disabled={switching === role}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-theme-surface hover:bg-theme-surface-hover transition-colors"
              >
                <span className={meta.color}>Switch to {meta.label}</span>
                {switching === role ? (
                  <span className="text-theme-tertiary">…</span>
                ) : (
                  <svg className="h-3.5 w-3.5 text-theme-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Add persona option */}
      {addable.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {addable.map((role) => {
            const meta = PERSONA_META[role]
            if (!meta) return null
            return (
              <button
                key={role}
                onClick={() => handleAdd(role)}
                disabled={adding}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-theme-secondary/30 hover:border-theme-secondary/50 hover:bg-theme-surface transition-colors"
              >
                <span className="text-theme-secondary">Add {meta.label} persona</span>
                {adding ? (
                  <span className="text-theme-tertiary">…</span>
                ) : (
                  <svg className="h-3.5 w-3.5 text-theme-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
