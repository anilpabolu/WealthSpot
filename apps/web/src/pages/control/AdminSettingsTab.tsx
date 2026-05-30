import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Edit3, Check, Loader2, ChevronDown, ChevronUp,
  Lock, Unlock, Video, Eye, Play, Bell, FileSpreadsheet,
  Settings, ClipboardCheck, Building2, Users, Palette, LayoutList,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useControlConfigs,
  useCreateConfig,
  useUpdateConfig,
} from '@/hooks/useControlCentre'
import { useAdminEOIFormOptions, useUpdateEOIFormOption, type EOIFormOption } from '@/hooks/useEOI'
import { useToastStore } from '@/stores/toastStore'
import { applyThemePalette } from '@/lib/colorUtils'
import { CenteredLoader } from './shared'

/* ------------------------------------------------------------------ */
/*  ConfigTab (generic)                                                */
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
      <h2 className="font-display text-xl font-bold text-theme-primary">{title}</h2>

      {isLoading ? (
        <CenteredLoader />
      ) : !configs || configs.length === 0 ? (
        <p className="text-theme-tertiary text-center py-12">No configurations found for this section</p>
      ) : (
        <div className="space-y-3">
          {configs.map((cfg) => (
            <div key={cfg.id} className="bg-[var(--bg-card)] backdrop-blur-sm rounded-xl border border-theme/60 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-theme-primary text-sm">{cfg.key}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-theme-surface-hover text-theme-tertiary'}`}>
                      {cfg.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  {cfg.description && <p className="text-xs text-theme-tertiary mt-0.5">{cfg.description}</p>}

                  {editingId === cfg.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded-lg border border-theme px-3 py-1.5 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                      <button
                        onClick={() => handleSave(cfg.id)}
                        disabled={updateConfig.isPending}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-theme-secondary hover:text-theme-primary">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-theme-secondary mt-1 break-all">
                      {typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value)}
                    </p>
                  )}
                </div>

                {editingId !== cfg.id && (
                  <button
                    onClick={() => { setEditingId(cfg.id); setEditValue(typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value)) }}
                    className="p-1.5 rounded-lg border border-theme hover:bg-theme-surface text-theme-tertiary hover:text-theme-secondary shrink-0"
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
/*  NotificationsTab                                                   */
/* ------------------------------------------------------------------ */

function NotificationsTab() {
  const { data: configs, isLoading } = useControlConfigs('notifications')
  const updateConfig = useUpdateConfig()
  const [localMs, setLocalMs] = useState<number>(3000)
  const [saving, setSaving] = useState(false)
  const addToast = useToastStore.getState().addToast

  const row = (configs ?? []).find((c) => c.key === 'toast_interval_ms')

  useEffect(() => {
    if (row?.value) {
      const ms = Number(row.value)
      if (!isNaN(ms) && ms >= 500) setLocalMs(ms)
    }
  }, [row])

  const handleSave = async () => {
    if (!row) return
    setSaving(true)
    try {
      await updateConfig.mutateAsync({ id: row.id, value: localMs })
      useToastStore.getState().setDismissInterval(localMs)
      addToast({ type: 'success', title: 'Notification settings saved', message: `Toasts will now auto-dismiss after ${localMs / 1000}s.` })
    } catch {
      addToast({ type: 'error', title: 'Save failed', message: 'Could not update notification settings.' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-theme-primary">Notification Settings</h2>

      <div className="bg-[var(--bg-card)] rounded-xl border border-theme/60 px-5 py-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-theme-primary">Toast Auto-Dismiss Interval</p>
          <p className="text-xs text-theme-tertiary mt-0.5">How long notification toasts stay visible before auto-dismissing.</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1000}
            max={10000}
            step={500}
            value={localMs}
            onChange={(e) => setLocalMs(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min={1000}
              max={10000}
              step={500}
              value={localMs}
              onChange={(e) => setLocalMs(Math.max(500, Number(e.target.value)))}
              className="w-24 rounded-lg border border-theme px-3 py-1.5 text-sm text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <span className="text-xs text-theme-tertiary">ms</span>
          </div>
        </div>
        <p className="text-xs text-theme-secondary">Current: <strong>{(localMs / 1000).toFixed(1)}s</strong></p>
      </div>

      {(configs ?? []).filter((c) => c.key !== 'toast_interval_ms').map((cfg) => (
        <div key={cfg.id} className="bg-[var(--bg-card)] rounded-xl border border-theme/60 px-5 py-4">
          <p className="font-medium text-theme-primary text-sm">{cfg.key}</p>
          {cfg.description && <p className="text-xs text-theme-tertiary mt-0.5">{cfg.description}</p>}
          <p className="text-xs font-mono text-theme-secondary mt-1">
            {typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value)}
          </p>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !row}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Settings
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  AppearancePanel                                                    */
/* ------------------------------------------------------------------ */

const LIGHT_MODE_BG_OPTIONS = [
  { color: '#ffffff', label: 'Pure White' },
  { color: '#F8F9FA', label: 'Cool White' },
  { color: '#FFFFF0', label: 'Soft Ivory' },
  { color: '#F0F4F0', label: 'Pale Sage' },
  { color: '#F5F0FF', label: 'Light Lavender' },
  { color: '#FFF0F0', label: 'Blush Pink' },
  { color: '#F0F4FF', label: 'Pearl Blue' },
  { color: '#F5F0E6', label: 'Sandy Beige' },
  { color: '#F0FFF4', label: 'Mint Mist' },
  { color: '#F2F3F5', label: 'Frosted Gray' },
]

function AppearancePanel() {
  const { data: configs, isLoading } = useControlConfigs('appearance')
  const createConfig = useCreateConfig()
  const updateConfig = useUpdateConfig()
  const queryClient = useQueryClient()

  const currentCfg = configs?.find((c) => c.key === 'light_mode_bg_color')
  const currentColor = (currentCfg?.value as string) || '#ffffff'

  const [selected, setSelected] = useState<string>(currentColor)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (currentCfg) setSelected((currentCfg.value as string) || '#ffffff')
  }, [currentCfg])

  const handleSelect = (color: string) => {
    setSelected(color)
    setDirty(color !== currentColor)
  }

  const handleSaveApply = async () => {
    if (currentCfg) {
      await updateConfig.mutateAsync({ id: currentCfg.id, value: selected })
    } else {
      await createConfig.mutateAsync({
        section: 'appearance',
        key: 'light_mode_bg_color',
        value: selected,
        description: 'Light mode background color for the platform',
      })
    }
    document.documentElement.style.setProperty('--bg-base', selected)
    applyThemePalette(selected)
    queryClient.invalidateQueries({ queryKey: ['control-configs', 'appearance'] })
    setDirty(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-theme-tertiary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="h-4 w-4 text-theme-tertiary" />
        <p className="text-xs text-theme-secondary">
          Choose a light mode background color. This applies platform-wide when light mode is active.
        </p>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
        {LIGHT_MODE_BG_OPTIONS.map((opt) => (
          <button
            key={opt.color}
            onClick={() => handleSelect(opt.color)}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
              selected === opt.color
                ? 'ring-2 ring-primary bg-primary/5 scale-105'
                : 'hover:bg-[var(--bg-surface-hover)]'
            }`}
            title={opt.label}
          >
            <div
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                selected === opt.color ? 'border-primary shadow-md' : 'border-theme'
              }`}
              style={{ backgroundColor: opt.color }}
            />
            <span className="text-[9px] font-medium text-theme-tertiary text-center leading-tight">
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-theme-secondary">Preview:</div>
        <div className="w-32 h-12 rounded-lg border border-theme shadow-sm" style={{ backgroundColor: selected }} />
        <span className="text-xs font-mono text-theme-tertiary">{selected}</span>
      </div>

      <button
        onClick={handleSaveApply}
        disabled={!dirty || updateConfig.isPending || createConfig.isPending}
        className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-40"
      >
        {(updateConfig.isPending || createConfig.isPending) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Save & Apply
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  VaultManagementPanel                                               */
/* ------------------------------------------------------------------ */

const VAULT_TOGGLE_ITEMS = [
  { key: 'opportunity_vault_enabled', label: 'Safe Vault', emoji: '🔒', description: 'Fixed-return mortgage-backed investment opportunities', icon: Lock, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/30' },
  { key: 'community_vault_enabled', label: 'Community Vault', emoji: '🤝', description: 'Community-driven collaborative investments', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
] as const

function VaultManagementPanel() {
  const { data: configs, isLoading } = useControlConfigs('vaults')
  const updateConfig = useUpdateConfig()
  const queryClient = useQueryClient()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-theme-tertiary" />
      </div>
    )
  }

  const configMap = new Map((configs ?? []).map((c) => [c.key, c]))

  const handleToggle = async (key: string) => {
    const cfg = configMap.get(key)
    if (!cfg) return
    const currentVal = cfg.value as Record<string, unknown>
    const isEnabled = currentVal?.enabled === true
    await updateConfig.mutateAsync({ id: cfg.id, value: { enabled: !isEnabled } })
    queryClient.invalidateQueries({ queryKey: ['vault-config'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-theme-tertiary" />
        <p className="text-xs text-theme-secondary">
          Wealth Vault is always enabled (core product). Toggle the vaults below to show or hide them across the platform.
        </p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
        <Building2 className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-theme-primary">🏛️ Wealth Vault</p>
          <p className="text-xs text-theme-secondary">Real estate investment — always enabled</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          <Unlock className="h-3 w-3" /> Active
        </span>
      </div>

      {VAULT_TOGGLE_ITEMS.map((item) => {
        const cfg = configMap.get(item.key)
        const isEnabled = (cfg?.value as Record<string, unknown>)?.enabled === true
        const Icon = item.icon

        return (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
              isEnabled ? `${item.bg} border-${item.color.replace('text-', '')}/20` : 'bg-theme-surface border-theme'
            }`}
          >
            <Icon className={`h-5 w-5 ${isEnabled ? item.color : 'text-theme-tertiary'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-theme-primary">{item.emoji} {item.label}</p>
              <p className="text-xs text-theme-secondary">{item.description}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              disabled={updateConfig.isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${
                isEnabled ? 'bg-primary' : 'bg-[var(--bg-surface-hover)]'
              }`}
              role="switch"
              aria-checked={isEnabled}
              aria-label={`Toggle ${item.label}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--bg-surface)] shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )
      })}

      <p className="text-[10px] text-theme-tertiary mt-2">
        Changes take effect immediately across web and mobile. Users will see "Coming Soon" for disabled vaults.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  VideoContentPanel                                                  */
/* ------------------------------------------------------------------ */

const VIDEO_TOGGLE_ITEMS = [
  { key: 'intro_videos_enabled', label: 'Intro / How-It-Works Videos', emoji: '🎬', description: 'Landing page intro video, onboarding walkthrough, and browse-mode video overlay', icon: Play, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  { key: 'vault_videos_enabled', label: 'Vault & Pillar Videos', emoji: '🏛️', description: 'Vault intro videos and four-pillar investor type videos on the Vaults page', icon: Video, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  { key: 'property_videos_enabled', label: 'Property Tour Videos', emoji: '🏠', description: 'Virtual tour / walkthrough videos on opportunity detail pages', icon: Eye, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  { key: 'video_management_enabled', label: 'Video Management (Admin)', emoji: '⚙️', description: 'Show or hide the Video Management section in Control Centre', icon: Settings, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
] as const

function VideoContentPanel() {
  const { data: configs, isLoading, isError, refetch } = useControlConfigs('content')
  const updateConfig = useUpdateConfig()
  const createConfig = useCreateConfig()
  const queryClient = useQueryClient()
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})
  const [seeding, setSeeding] = useState(false)
  const seededRef = useRef(false)

  const configMap = useMemo(
    () => new Map((configs ?? []).map((c) => [c.key, c])),
    [configs],
  )

  useEffect(() => {
    if (isLoading || isError || seeding || seededRef.current) return
    const missing = VIDEO_TOGGLE_ITEMS.filter((item) => !configMap.has(item.key))
    if (missing.length === 0) return
    seededRef.current = true
    setSeeding(true)
    ;(async () => {
      try {
        for (const item of missing) {
          await createConfig.mutateAsync({
            section: 'content',
            key: item.key,
            value: { enabled: true },
            description: item.description,
          })
        }
      } catch {
        // seed failed — user can still retry manually
      } finally {
        setSeeding(false)
      }
    })()
  }, [isLoading, isError, seeding, configMap, createConfig])

  if (isLoading || seeding) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-theme-tertiary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load video configuration</p>
        <p className="text-xs text-red-600 dark:text-red-300">The server may be unreachable, or you may not have super-admin permissions.</p>
        <button onClick={() => refetch()} className="text-xs font-medium text-primary hover:underline">Retry</button>
      </div>
    )
  }

  const handleToggle = async (key: string) => {
    const cfg = configMap.get(key)
    if (!cfg) return
    const currentVal = cfg.value as Record<string, unknown>
    const isEnabled = currentVal?.enabled === true
    const newEnabled = !isEnabled

    setOptimistic((prev) => ({ ...prev, [key]: newEnabled }))
    setToggleError(null)

    try {
      await updateConfig.mutateAsync({ id: cfg.id, value: { enabled: newEnabled } })
      setOptimistic((prev) => { const next = { ...prev }; delete next[key]; return next })
      queryClient.invalidateQueries({ queryKey: ['vault-config'] })
    } catch {
      setOptimistic((prev) => { const next = { ...prev }; delete next[key]; return next })
      setToggleError(`Failed to toggle ${VIDEO_TOGGLE_ITEMS.find((i) => i.key === key)?.label ?? key}. Please try again.`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Video className="h-4 w-4 text-theme-tertiary" />
        <p className="text-xs text-theme-secondary">
          Toggle video visibility per category. Disabled categories hide all related video icons, buttons, and overlays across web and mobile.
        </p>
      </div>

      {toggleError && (
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2">
          <p className="text-xs text-red-700 dark:text-red-400">{toggleError}</p>
        </div>
      )}

      {VIDEO_TOGGLE_ITEMS.map((item) => {
        const cfg = configMap.get(item.key)
        const serverEnabled = (cfg?.value as Record<string, unknown>)?.enabled === true
        const isEnabled = item.key in optimistic ? optimistic[item.key] : serverEnabled
        const Icon = item.icon

        return (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
              isEnabled ? `${item.bg} border-${item.color.replace('text-', '')}/20` : 'bg-theme-surface border-theme'
            }`}
          >
            <Icon className={`h-5 w-5 ${isEnabled ? item.color : 'text-theme-tertiary'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-theme-primary">{item.emoji} {item.label}</p>
              <p className="text-xs text-theme-secondary">{item.description}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              disabled={updateConfig.isPending || !cfg}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${
                isEnabled ? 'bg-primary' : 'bg-[var(--bg-surface-hover)]'
              } ${!cfg ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={isEnabled}
              aria-label={`Toggle ${item.label}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--bg-surface)] shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )
      })}

      <p className="text-[10px] text-theme-tertiary mt-2">
        Changes take effect immediately. When a category is disabled, video icons and play buttons are hidden across all pages.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PropertyDisplayPanel                                               */
/* ------------------------------------------------------------------ */

const PROPERTY_EMPTY_MODE_OPTIONS = [
  {
    value: 'show_placeholder',
    label: 'Show placeholder',
    description: 'Show the section heading with an "Ask the builder to fill this section" reminder when no data is present.',
  },
  {
    value: 'hide_empty',
    label: 'Hide empty sections',
    description: 'Completely hide property sections (specs, configurations, amenities) when they contain no data.',
  },
] as const

function PropertyDisplayPanel() {
  const { data: configs, isLoading } = useControlConfigs('content')
  const createConfig = useCreateConfig()
  const updateConfig = useUpdateConfig()
  const queryClient = useQueryClient()

  const currentCfg = configs?.find((c) => c.key === 'property_empty_section_mode')
  const serverValue = (currentCfg?.value as string) ?? 'show_placeholder'

  const [selected, setSelected] = useState(serverValue)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setSelected((currentCfg?.value as string) ?? 'show_placeholder')
  }, [currentCfg])

  const handleSelect = (value: string) => {
    setSelected(value)
    setDirty(value !== serverValue)
  }

  const handleSave = async () => {
    if (currentCfg) {
      await updateConfig.mutateAsync({ id: currentCfg.id, value: selected })
    } else {
      await createConfig.mutateAsync({
        section: 'content',
        key: 'property_empty_section_mode',
        value: selected,
        description: 'Controls whether empty property sections (specs, amenities, configurations) are hidden or shown with a placeholder',
      })
    }
    queryClient.invalidateQueries({ queryKey: ['vault-config'] })
    setDirty(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-theme-tertiary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="h-4 w-4 text-theme-tertiary" />
        <p className="text-xs text-theme-secondary">
          Choose how empty property sections (specs, configurations, amenities) appear on property detail pages — web and mobile both respect this setting.
        </p>
      </div>

      <div className="space-y-3">
        {PROPERTY_EMPTY_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
              selected === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-theme bg-theme-surface hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <span
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                selected === opt.value ? 'border-primary' : 'border-theme-tertiary'
              }`}
            >
              {selected === opt.value && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${selected === opt.value ? 'text-primary' : 'text-theme-primary'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-theme-secondary mt-0.5">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!dirty || updateConfig.isPending || createConfig.isPending}
        className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-40"
      >
        {(updateConfig.isPending || createConfig.isPending) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Save
      </button>

      <p className="text-[10px] text-theme-tertiary">
        Changes take effect immediately across web and mobile property detail pages.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EoiOptionsPanel                                                    */
/* ------------------------------------------------------------------ */

const EOI_FIELD_LABELS: Record<string, string> = {
  investment_timeline: '⏱ Investment Timeline',
  funding_source: '💰 Funding Source',
  purpose: '🎯 Purpose',
  preferred_contact: '📞 Preferred Contact',
}

function EoiOptionsPanel() {
  const { data: optionGroups, isLoading, isError } = useAdminEOIFormOptions()
  const updateOption = useUpdateEOIFormOption()
  const [pending, setPending] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-theme-tertiary" />
      </div>
    )
  }

  if (isError || !optionGroups) {
    return (
      <p className="text-sm text-red-500 py-4">Failed to load EOI form options.</p>
    )
  }

  const handleToggle = async (opt: EOIFormOption) => {
    setPending(opt.id)
    try {
      await updateOption.mutateAsync({ id: opt.id, isActive: !opt.isActive })
    } finally {
      setPending(null)
    }
  }

  const fieldOrder = ['investment_timeline', 'funding_source', 'purpose', 'preferred_contact']

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck className="h-4 w-4 text-theme-tertiary" />
        <p className="text-xs text-theme-secondary">
          Toggle individual options shown in the Express Interest form. Disabled options are hidden from investors but kept in the database.
        </p>
      </div>

      {fieldOrder.map(field => {
        const opts: EOIFormOption[] = optionGroups[field] ?? []
        if (opts.length === 0) return null
        return (
          <div key={field}>
            <p className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2">
              {EOI_FIELD_LABELS[field] ?? field}
            </p>
            <div className="space-y-2">
              {opts.map(opt => {
                const isBusy = pending === opt.id
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                      opt.isActive ? 'bg-primary/5 border-primary/20' : 'bg-[var(--bg-surface)] border-theme'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-primary">{opt.label}</p>
                      <p className="text-[11px] font-mono text-theme-tertiary">{opt.value}</p>
                    </div>
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin text-theme-tertiary shrink-0" />
                    ) : (
                      <button
                        onClick={() => handleToggle(opt)}
                        disabled={updateOption.isPending}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${
                          opt.isActive ? 'bg-primary' : 'bg-[var(--bg-surface-hover)]'
                        }`}
                        role="switch"
                        aria-checked={opt.isActive}
                        aria-label={`Toggle ${opt.label}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--bg-surface)] shadow ring-0 transition duration-200 ease-in-out ${
                            opt.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="text-[10px] text-theme-tertiary">
        Changes take effect immediately. Disabled options are hidden from investors in the Express Interest flow.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  CompanyFormPanel                                                   */
/* ------------------------------------------------------------------ */

const COMPANY_FORM_FIELDS: Array<{ key: string; label: string; description: string }> = [
  { key: 'contactName',   label: 'Contact Name',   description: 'Full name of the primary contact person at the company.' },
  { key: 'contactEmail',  label: 'Contact Email',  description: 'Email address of the primary contact (format-validated when provided).' },
  { key: 'contactPhone',  label: 'Contact Phone',  description: 'Phone number of the primary contact (min 10 digits when provided).' },
  { key: 'addressLine1',  label: 'Address Line 1', description: 'Registered office address of the company.' },
  { key: 'city',          label: 'City',           description: 'City of the registered office.' },
  { key: 'state',         label: 'State',          description: 'State of the registered office.' },
  { key: 'pincode',       label: 'Pincode',        description: '6-digit postal code of the registered office.' },
]

function CompanyFormPanel() {
  const { data: configs, isLoading } = useControlConfigs('company_form')
  const createConfig = useCreateConfig()
  const updateConfig = useUpdateConfig()
  const queryClient = useQueryClient()
  const addToast = useToastStore.getState().addToast

  const row = configs?.find((c) => c.key === 'required_fields')
  const currentFields: string[] = Array.isArray(row?.value) ? (row!.value as string[]) : ['contactName', 'contactEmail', 'contactPhone']
  const [selected, setSelected] = useState<string[]>(currentFields)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (row && Array.isArray(row.value)) {
      setSelected(row.value as string[])
    }
  }, [row])

  const toggle = (key: string) => {
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]
    setSelected(next)
    setDirty(JSON.stringify(next.sort()) !== JSON.stringify(currentFields.slice().sort()))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (row) {
        await updateConfig.mutateAsync({ id: row.id, value: selected })
      } else {
        await createConfig.mutateAsync({
          section: 'company_form',
          key: 'required_fields',
          value: selected,
          description: 'Fields that are mandatory in the company onboarding form',
        })
      }
      queryClient.invalidateQueries({ queryKey: ['control-centre', 'company-form-config'] })
      setDirty(false)
      addToast({ type: 'success', title: 'Company form saved', message: 'Required field rules updated. Changes take effect immediately.' })
    } catch {
      addToast({ type: 'error', title: 'Save failed', message: 'Could not update company form configuration.' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Company Form Validation</h2>
        <p className="text-sm text-theme-tertiary mt-1">
          Toggle which fields are mandatory when a builder registers their company. Always required: Company Name, Entity Type, Vault Category.
        </p>
      </div>

      <div className="space-y-3">
        {COMPANY_FORM_FIELDS.map((field) => {
          const on = selected.includes(field.key)
          return (
            <div key={field.key} className="flex items-center justify-between gap-4 bg-[var(--bg-card)] rounded-xl border border-theme/60 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-theme-primary">{field.label}</p>
                <p className="text-xs text-theme-tertiary mt-0.5">{field.description}</p>
              </div>
              <button
                onClick={() => toggle(field.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  on ? 'bg-primary' : 'bg-theme-surface-hover'
                }`}
                aria-label={`${on ? 'Required' : 'Optional'}: ${field.label}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  on ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-xs font-semibold w-14 text-right shrink-0 ${
                on ? 'text-primary' : 'text-theme-tertiary'
              }`}>{on ? 'Required' : 'Optional'}</span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  OpportunityFormPanel                                               */
/* ------------------------------------------------------------------ */

const OPP_FORM_TOGGLE_ITEMS = [
  {
    key: 'show_investment_config',
    label: 'Investment Configuration',
    emoji: '⚙️',
    description: 'Show the Lumpsum / Unit Configuration mode selector. When hidden, lumpsum is used by default.',
  },
  {
    key: 'show_investment_details',
    label: 'Investment Details',
    emoji: '💰',
    description: 'Show Price per Sq.Ft, Total Project Area, Target Amount, unit configs, etc. When hidden, only Min Investment is collected.',
  },
  {
    key: 'show_amenities',
    label: 'Amenities',
    emoji: '✨',
    description: 'Show the Amenities selector section on the opportunity creation form.',
  },
] as const

function OpportunityFormPanel() {
  const { data: configs, isLoading, isError, refetch } = useControlConfigs('opportunity_form')
  const createConfig = useCreateConfig()
  const updateConfig = useUpdateConfig()
  const queryClient = useQueryClient()
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})
  const [seeding, setSeeding] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const didSeed = useRef(false)

  const configMap = useMemo(
    () => new Map((configs ?? []).map((c) => [c.key, c])),
    [configs]
  )

  // Auto-seed missing configs on first load
  useEffect(() => {
    if (isLoading || isError || didSeed.current || seeding) return
    didSeed.current = true
    ;(async () => {
      setSeeding(true)
      for (const item of OPP_FORM_TOGGLE_ITEMS) {
        if (!configMap.has(item.key)) {
          try {
            await createConfig.mutateAsync({
              section: 'opportunity_form',
              key: item.key,
              value: false,
              description: item.description,
            })
          } catch {
            // seed failed — user can retry by reopening
          }
        }
      }
      setSeeding(false)
    })()
  }, [isLoading, isError, seeding, configMap, createConfig])

  if (isLoading || seeding) return <CenteredLoader />

  if (isError) {
    return (
      <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load opportunity form configuration</p>
        <button onClick={() => refetch()} className="text-xs font-medium text-primary hover:underline">Retry</button>
      </div>
    )
  }

  const handleToggle = async (key: string) => {
    const cfg = configMap.get(key)
    if (!cfg) return
    const newEnabled = !cfg.isActive
    setOptimistic((prev) => ({ ...prev, [key]: newEnabled }))
    setToggleError(null)
    try {
      await updateConfig.mutateAsync({ id: cfg.id, isActive: newEnabled })
      setOptimistic((prev) => { const next = { ...prev }; delete next[key]; return next })
      queryClient.invalidateQueries({ queryKey: ['control-centre', 'opportunity-form-flags'] })
    } catch {
      setOptimistic((prev) => { const next = { ...prev }; delete next[key]; return next })
      setToggleError(`Failed to toggle ${OPP_FORM_TOGGLE_ITEMS.find((i) => i.key === key)?.label ?? key}. Please try again.`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <LayoutList className="h-4 w-4 text-theme-tertiary" />
        <p className="text-xs text-theme-secondary">
          Toggle optional sections on the opportunity creation form. All are hidden by default. When Investment Details is off, only a minimum investment amount is collected.
        </p>
      </div>

      {toggleError && (
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2">
          <p className="text-xs text-red-700 dark:text-red-400">{toggleError}</p>
        </div>
      )}

      {OPP_FORM_TOGGLE_ITEMS.map((item) => {
        const cfg = configMap.get(item.key)
        const serverEnabled = cfg?.isActive === true
        const isEnabled = item.key in optimistic ? optimistic[item.key] : serverEnabled

        return (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-[var(--bg-surface)] border-theme'
            }`}
          >
            <span className="text-xl shrink-0">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-theme-primary">{item.label}</p>
              <p className="text-xs text-theme-secondary">{item.description}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              disabled={updateConfig.isPending || !cfg}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${
                isEnabled ? 'bg-primary' : 'bg-[var(--bg-surface-hover)]'
              } ${!cfg ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={isEnabled}
              aria-label={`Toggle ${item.label}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--bg-surface)] shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )
      })}

      <p className="text-[10px] text-theme-tertiary mt-2">
        Changes take effect immediately on the create opportunity form across all vault types.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  AdminSettingsTab (container)                                       */
/* ------------------------------------------------------------------ */

const ADMIN_SECTIONS = [
  { key: 'opportunity-form', title: 'Opportunity Form Sections', description: 'Show or hide Investment Configuration, Investment Details, and Amenities sections on the opportunity creation form.', icon: LayoutList },
  { key: 'vaults', title: 'Vault Management', description: 'Enable or disable vaults platform-wide. Disabled vaults show "Coming Soon" everywhere.', icon: Lock },
  { key: 'video-content', title: 'Video Content', description: 'Control video visibility per category — intro, vault, property, and admin video management.', icon: Video },
  { key: 'property-display', title: 'Property Display', description: 'Configure how empty property sections (specs, amenities, configurations) appear on property detail pages.', icon: Eye },
  { key: 'company-form', title: 'Company Form Validation', description: 'Configure which fields are mandatory when a builder registers their company.', icon: Building2 },
  { key: 'eoi-options', title: 'EOI Form Options', description: 'Enable or disable options shown in the Express Interest form (timeline, funding source, purpose, contact).', icon: ClipboardCheck },
  { key: 'approvals', title: 'Approval Configuration', description: 'Control approval workflows, thresholds, and auto-approval rules.', icon: ClipboardCheck },
  { key: 'notifications', title: 'Notification Settings', description: 'Manage email, SMS, and in-app notification triggers and templates.', icon: Bell },
  { key: 'templates', title: 'Template Configuration', description: 'Configure document, email, and report templates used across the platform.', icon: FileSpreadsheet },
  { key: 'platform', title: 'Platform Settings', description: 'Core platform parameters — fees, limits, feature flags, and global defaults.', icon: Settings },
  { key: 'appearance', title: 'Appearance & Theme', description: 'Configure light mode background color for the platform.', icon: Palette },
] as const

export default function AdminSettingsTab() {
  const [expanded, setExpanded] = useState<string | null>('vaults')

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-theme-primary">Admin Settings</h2>
      <p className="text-sm text-theme-secondary">Manage all platform configuration in one place — approvals, notifications, templates, and global settings.</p>

      <div className="space-y-3">
        {ADMIN_SECTIONS.map((sec) => {
          const Icon = sec.icon
          const isOpen = expanded === sec.key
          return (
            <div key={sec.key} className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : sec.key)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-theme-surface/50 transition-colors"
              >
                <Icon className="h-5 w-5 text-theme-tertiary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-theme-primary">{sec.title}</p>
                  <p className="text-xs text-theme-tertiary mt-0.5">{sec.description}</p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-theme-tertiary shrink-0" /> : <ChevronDown className="h-4 w-4 text-theme-tertiary shrink-0" />}
              </button>
              {isOpen && (
                <div className="border-t border-theme px-5 py-5">
                  {sec.key === 'opportunity-form' ? <OpportunityFormPanel /> : sec.key === 'vaults' ? <VaultManagementPanel /> : sec.key === 'video-content' ? <VideoContentPanel /> : sec.key === 'property-display' ? <PropertyDisplayPanel /> : sec.key === 'company-form' ? <CompanyFormPanel /> : sec.key === 'eoi-options' ? <EoiOptionsPanel /> : sec.key === 'appearance' ? <AppearancePanel /> : sec.key === 'notifications' ? <NotificationsTab /> : <ConfigTab section={sec.key} title={sec.title} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
