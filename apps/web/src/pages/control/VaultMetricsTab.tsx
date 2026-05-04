import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useVaultMetricsConfig } from '@/hooks/useVaultMetricsConfig'
import { useControlConfigs, useUpdateConfig } from '@/hooks/useControlCentre'
import { ALL_VAULT_METRICS, VAULT_METRICS_REGISTRY } from '@/pages/VaultsPage'
import { useToastStore } from '@/stores/toastStore'
import { CenteredLoader } from './shared'

const VAULT_LABELS: Record<string, string> = {
  wealth: 'Wealth Vault',
  safe: 'Safe Vault',
  community: 'Community Vault',
}

export default function VaultMetricsTab() {
  const { data: metricsConfig, isLoading: metricsLoading } = useVaultMetricsConfig()
  const { data: allConfigs, isLoading: configsLoading } = useControlConfigs('vault_metrics')
  const updateConfig = useUpdateConfig()
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<Record<string, Set<string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (metricsConfig && Object.keys(localState).length === 0) {
      const init: Record<string, Set<string>> = {}
      for (const vaultId of Object.keys(ALL_VAULT_METRICS)) {
        init[vaultId] = new Set(metricsConfig[vaultId] ?? ALL_VAULT_METRICS[vaultId])
      }
      setLocalState(init)
    }
  }, [metricsConfig]) // eslint-disable-line react-hooks/exhaustive-deps

  if (metricsLoading || configsLoading) return <CenteredLoader />

  const toggle = (vaultId: string, metric: string) => {
    setLocalState((prev) => {
      const updated = { ...prev }
      const set = new Set(updated[vaultId] ?? [])
      if (set.has(metric)) set.delete(metric)
      else set.add(metric)
      updated[vaultId] = set
      return updated
    })
  }

  const handleSave = async () => {
    if (!allConfigs) return
    setSaving(true)
    const addToast = useToastStore.getState().addToast
    try {
      const keyMap: Record<string, string> = { wealth: 'wealth_metrics', safe: 'safe_metrics', community: 'community_metrics' }
      for (const vaultId of Object.keys(ALL_VAULT_METRICS)) {
        const config = allConfigs.find((c) => c.key === keyMap[vaultId])
        if (!config) continue
        const metrics = ALL_VAULT_METRICS[vaultId]?.filter((m) => localState[vaultId]?.has(m)) ?? []
        await updateConfig.mutateAsync({ id: config.id, value: { metrics } })
      }
      queryClient.invalidateQueries({ queryKey: ['vault-metrics-config'] })
      queryClient.invalidateQueries({ queryKey: ['control-centre', 'configs'] })
      addToast({ type: 'success', title: 'Vault metrics saved', message: 'Your metric selections are now live on the vault cards.' })
    } catch {
      addToast({ type: 'error', title: 'Save failed', message: 'Could not save vault metrics. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-theme-primary">Vault Metrics Configuration</h2>
          <p className="text-sm text-theme-secondary mt-1">Choose which metrics appear on each vault card. Changes take effect immediately.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(ALL_VAULT_METRICS).map(([vaultId, metricKeys]) => (
          <div key={vaultId} className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 p-5 space-y-4">
            <h3 className="font-display text-base font-bold text-theme-primary">{VAULT_LABELS[vaultId] ?? vaultId}</h3>
            <div className="space-y-2">
              {metricKeys.map((key) => {
                const def = VAULT_METRICS_REGISTRY[key]
                if (!def) return null
                const checked = localState[vaultId]?.has(key) ?? false
                return (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(vaultId, key)}
                      className="h-4 w-4 rounded border-theme accent-primary"
                    />
                    <span className="text-sm text-theme-secondary group-hover:text-theme-primary transition-colors">{def.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
