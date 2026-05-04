import { useState, useMemo } from 'react'
import { Unlock, Lock } from 'lucide-react'
import { useFeatureMatrix, useUpdateFeatureMatrix } from '@/hooks/useVaultFeatures'
import { CenteredLoader } from './shared'

const VAULT_TYPES = ['wealth', 'safe', 'community'] as const
const ROLES = ['investor', 'builder', 'admin', 'super_admin'] as const
const FEATURE_KEYS = [
  'view_vault', 'create_opportunity', 'invest', 'community_post',
  'community_reply', 'view_analytics', 'manage_media', 'export_data',
  'admin_panel', 'approve_content',
] as const

export default function VaultFeatureMatrixTab() {
  const { data: flags, isLoading } = useFeatureMatrix()
  const updateMatrix = useUpdateFeatureMatrix()
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})

  const matrix = useMemo(() => {
    const m: Record<string, boolean> = {}
    if (flags) {
      for (const f of flags) {
        m[`${f.vaultType}:${f.role}:${f.featureKey}`] = f.enabled
      }
    }
    return m
  }, [flags])

  const getVal = (v: string, r: string, k: string) => {
    const key = `${v}:${r}:${k}`
    return key in pendingChanges ? pendingChanges[key] : !!matrix[key]
  }

  const toggle = (v: string, r: string, k: string) => {
    const key = `${v}:${r}:${k}`
    const cur = key in pendingChanges ? pendingChanges[key] : !!matrix[key]
    setPendingChanges((p) => ({ ...p, [key]: !cur }))
  }

  const hasPending = Object.keys(pendingChanges).length > 0

  const handleSave = () => {
    const updates = Object.entries(pendingChanges).map(([key, enabled]) => {
      const [vault_type, role, feature_key] = key.split(':') as [string, string, string]
      return { vault_type, role, feature_key, enabled }
    })
    updateMatrix.mutate(updates, { onSuccess: () => setPendingChanges({}) })
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-theme-primary">Vault Feature Matrix</h2>
        {hasPending && (
          <div className="flex gap-2">
            <button
              onClick={() => setPendingChanges({})}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-theme text-theme-secondary hover:bg-theme-surface transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={updateMatrix.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {updateMatrix.isPending ? 'Saving…' : `Save ${Object.keys(pendingChanges).length} change(s)`}
            </button>
          </div>
        )}
      </div>

      {VAULT_TYPES.map((vault) => (
        <div key={vault} className="rounded-xl border border-theme bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-4 py-3 bg-theme-surface border-b border-theme">
            <h3 className="font-semibold text-theme-primary capitalize">{vault} Vault</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left px-4 py-2 text-theme-tertiary font-medium">Feature</th>
                  {ROLES.map((r) => (
                    <th key={r} className="text-center px-3 py-2 text-theme-tertiary font-medium capitalize">{r.replace('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_KEYS.map((fk) => (
                  <tr key={fk} className="border-b border-theme last:border-0">
                    <td className="px-4 py-2 text-theme-secondary font-mono text-xs">{fk}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="text-center px-3 py-2">
                        <button
                          onClick={() => toggle(vault, r, fk)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            getVal(vault, r, fk)
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500'
                          } ${`${vault}:${r}:${fk}` in pendingChanges ? 'ring-2 ring-primary' : ''}`}
                        >
                          {getVal(vault, r, fk) ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
