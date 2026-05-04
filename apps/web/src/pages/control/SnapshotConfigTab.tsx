import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useSnapshotConfig, useUpdateSnapshotConfig } from '@/hooks/usePortfolio'
import { useToastStore } from '@/stores/toastStore'
import { CenteredLoader } from './shared'

const SNAPSHOT_SECTION_DEFS: { key: string; label: string; description: string }[] = [
  { key: 'property_details', label: 'Project Details', description: 'City, asset type, phase, description' },
  { key: 'appreciation_history', label: 'Appreciation History', description: 'Timeline of valuation events' },
  { key: 'payout_schedule', label: 'Payout Schedule', description: 'Safe vault payout frequency info' },
  { key: 'co_investors', label: 'Co-Investors', description: 'Investor count, funding progress, founder' },
  { key: 'timeline', label: 'Timeline', description: 'Investment date and hold duration' },
  { key: 'documents', label: 'Documents', description: 'Linked project PDFs and files' },
]

export default function SnapshotConfigTab() {
  const { data: config, isLoading } = useSnapshotConfig()
  const updateConfig = useUpdateSnapshotConfig()
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [saving, setSaving] = useState(false)

  const activeSections = selected ?? new Set(config?.sections ?? [])

  const toggle = (key: string) => {
    const next = new Set(activeSections)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelected(next)
  }

  const handleSave = async () => {
    setSaving(true)
    const addToast = useToastStore.getState().addToast
    try {
      await updateConfig.mutateAsync(Array.from(activeSections))
      addToast({ type: 'success', title: 'Snapshot sections saved' })
    } catch {
      addToast({ type: 'error', title: 'Failed to save snapshot config' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Snapshot Sections</h2>
        <p className="text-sm text-theme-secondary mt-1">Choose which sections investors see when they click the eye icon on a holding card.</p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl border border-theme p-5">
        <div className="grid md:grid-cols-2 gap-4">
          {SNAPSHOT_SECTION_DEFS.map((def) => (
            <label
              key={def.key}
              className="flex items-start gap-3 cursor-pointer group rounded-lg p-3 hover:bg-theme-surface transition-colors"
            >
              <input
                type="checkbox"
                checked={activeSections.has(def.key)}
                onChange={() => toggle(def.key)}
                className="mt-0.5 h-4 w-4 rounded border-theme accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-theme-primary group-hover:text-primary transition-colors">{def.label}</p>
                <p className="text-xs text-theme-tertiary mt-0.5">{def.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
