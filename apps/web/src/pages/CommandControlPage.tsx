import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Toggle, Select, Badge } from '@/components/ui'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import {
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
  HelpCircle,
  Link2,
  Trash2,
  Plus,
  GripVertical,
  MessageCircle,
  Gift,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Kanban,
  ArrowRight,
  User,
  Building2,
  ExternalLink,
  Upload,
  Video,
  Play,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Shield,
  ShieldCheck,
  Briefcase,
  Calendar,
  BarChart3,
  Image,
  FileText,
  Rocket,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  Palette,
} from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useQueryClient } from '@tanstack/react-query'
import {
  useControlDashboard,
  useControlConfigs,
  useCreateConfig,
  useUpdateConfig,
  useControlUsers,
  useUpdateUserRole,
} from '@/hooks/useControlCentre'
import { useApprovalStats } from '@/hooks/useApprovals'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { ROLE_LABELS, type UserRole } from '@/lib/constants'
import { useOpportunities, useUpdateOpportunity } from '@/hooks/useOpportunities'
import {
  useBuilderQuestions,
  useCreateBuilderQuestion,
  useUpdateBuilderQuestion,
  useDeleteBuilderQuestion,
  useCommMappings,
  useCreateCommMapping,
  useDeleteCommMapping,
  type BuilderQuestion,
  type CommMapping,
  useAdminEOIPipeline,
  useUpdateEOIStatus,
  EOI_PIPELINE_STATUSES,
  EOI_STATUS_LABELS,
  type EOIItem,
  type EOIUser,
} from '@/hooks/useEOI'
import {
  useAdminReferralSummary,
  useAdminReferralDetails,
  type AdminReferralSummary as RefSummary,
} from '@/hooks/useAdminReferrals'
import {
  useAdminVideos,
  useVideoPagesMeta,
  useCreateAppVideo,
  useUpdateAppVideo,
  useDeleteAppVideo,
  useUploadAppVideo,
  type AppVideo,
} from '@/hooks/useAppVideos'
import { formatINR, formatINRCompact } from '@/lib/formatters'
import {
  useFeatureMatrix,
  useUpdateFeatureMatrix,
  useAdminInvites,
  useCreateAdminInvite,
} from '@/hooks/useVaultFeatures'
import VaultAnalyticsDashboard from '@/pages/VaultAnalyticsDashboard'
import {
  useListOpportunityMedia,
  useAdminUploadMedia,
  useDeleteMedia,
  useUpdateMedia,
} from '@/hooks/useMediaAdmin'
import {
  useAllSiteContent,
  useUpdateSiteContent,
  useCreateSiteContent,
  useDeleteSiteContent,
  type SiteContentItem,
} from '../hooks/useSiteContent'
import { useVaultMetricsConfig } from '@/hooks/useVaultMetricsConfig'
import {
  useSnapshotConfig,
  useUpdateSnapshotConfig,
} from '@/hooks/usePortfolio'
import { ShieldMetricsCard } from '@/components/shield/ShieldMetricsCard'
import { AdminShieldReviewTab } from '@/components/shield/AdminShieldReviewTab'
import { ALL_VAULT_METRICS, VAULT_METRICS_REGISTRY } from '@/pages/VaultsPage'
import {
  useBuilderUpdates,
  useCreateBuilderUpdate,
  useDeleteBuilderUpdate,
  usePatchBuilderUpdate,
  useUploadBuilderAttachment,
  useDeleteBuilderAttachment,
  type BuilderUpdate,
} from '@/hooks/useBuilderUpdates'
import {
  useAppreciationHistory,
  useCreateAppreciation,
} from '@/hooks/useAppreciation'
import ApprovalsPage from '@/pages/ApprovalsPage'
import { applyThemePalette } from '@/lib/colorUtils'
import { useToastStore } from '@/stores/toastStore'

/* ------------------------------------------------------------------ */
/*  Side-nav sections                                                  */
/* ------------------------------------------------------------------ */

type Section = 'dashboard' | 'vault-analytics' | 'users' | 'admin-settings' | 'content' | 'builder-questions' | 'comm-mapping' | 'answer-questions' | 'referral-tracking' | 'eoi-pipeline' | 'media-management' | 'site-content' | 'vault-features' | 'admin-invites' | 'vault-metrics' | 'deal-lifecycle' | 'builder-updates' | 'approvals' | 'shield-review' | 'snapshot-config'

type SideNavItem = { id: Section; label: string; icon: typeof LayoutDashboard; group?: string }

const SECTIONS: SideNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'vault-analytics', label: 'Vault Analytics', icon: BarChart3, group: 'Overview' },
  { id: 'users', label: 'Users & Roles', icon: Users, group: 'Users' },
  { id: 'referral-tracking', label: 'Referral Tracking', icon: Gift, group: 'Users' },
  { id: 'eoi-pipeline', label: 'EOI Pipeline', icon: Kanban, group: 'Operations' },
  { id: 'deal-lifecycle', label: 'Deal Lifecycle', icon: Briefcase, group: 'Operations' },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, group: 'Operations' },
  { id: 'builder-updates', label: 'Builder Updates', icon: Rocket, group: 'Operations' },
  { id: 'shield-review', label: 'Shield Review', icon: ShieldCheck, group: 'Operations' },
  { id: 'builder-questions', label: 'Builder Questions', icon: HelpCircle, group: 'Operations' },
  { id: 'comm-mapping', label: 'Comm Mapping', icon: Link2, group: 'Operations' },
  { id: 'answer-questions', label: 'Answer Questions', icon: MessageCircle, group: 'Operations' },
  { id: 'media-management', label: 'Media Manager', icon: Image, group: 'Content' },
  { id: 'content', label: 'Content & Videos', icon: FileVideo, group: 'Content' },
  { id: 'site-content', label: 'Site Content (CMS)', icon: FileText, group: 'Content' },
  { id: 'vault-features', label: 'Feature Matrix', icon: Shield, group: 'Settings' },
  { id: 'vault-metrics', label: 'Vault Metrics', icon: BarChart3, group: 'Settings' },
  { id: 'snapshot-config', label: 'Snapshot Sections', icon: Eye, group: 'Settings' },
  { id: 'admin-invites', label: 'Admin Invites', icon: Mail, group: 'Settings' },
  { id: 'admin-settings', label: 'Admin Settings', icon: Settings, group: 'Settings' },
]

/* ------------------------------------------------------------------ */
/*  Dashboard Tab                                                      */
/* ------------------------------------------------------------------ */

function DashboardTab() {
  const { data, isLoading } = useControlDashboard()
  const { data: approvalStats } = useApprovalStats()

  if (isLoading) return <CenteredLoader />
  if (!data) return <p className="text-theme-tertiary text-center py-12">Failed to load dashboard</p>

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl font-bold text-theme-primary">Platform Overview</h2>

      <ShieldMetricsCard />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.totalUsers} color="text-primary bg-primary/5" />
        <StatCard label="Pending Approvals" value={approvalStats?.pending ?? data.pendingApprovals} color="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30" />
        <StatCard label="Opportunities" value={data.totalOpportunities} color="text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30" />
        <StatCard label="Active Configs" value={data.activeConfigs} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" />
      </div>

      {/* Role distribution */}
      <div>
        <h3 className="font-semibold text-theme-primary mb-3">Role Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(data.roleDistribution).map(([role, count]) => (
            <div key={role} className="rounded-lg border border-theme px-4 py-3 bg-[var(--bg-surface)]">
              <p className="text-xs font-medium text-theme-tertiary uppercase tracking-wider">{ROLE_LABELS[role as UserRole] ?? role}</p>
              <p className="text-lg font-bold font-mono text-theme-primary mt-1">{count}</p>
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
/*  Notifications Tab                                                  */
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

      {/* Toast interval setting */}
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

      {/* Other configs (raw) */}
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
/*  Appearance Panel (light mode background color)                     */
/* ------------------------------------------------------------------ */

const LIGHT_MODE_BG_OPTIONS = [
  { color: '#FDFBF5', label: 'Warm Cream' },
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
  const currentColor = (currentCfg?.value as string) || '#FDFBF5'

  const [selected, setSelected] = useState<string>(currentColor)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (currentCfg) setSelected((currentCfg.value as string) || '#FDFBF5')
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

      {/* Color swatches */}
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

      {/* Preview */}
      <div className="flex items-center gap-4">
        <div className="text-xs text-theme-secondary">Preview:</div>
        <div
          className="w-32 h-12 rounded-lg border border-theme shadow-sm"
          style={{ backgroundColor: selected }}
        />
        <span className="text-xs font-mono text-theme-tertiary">{selected}</span>
      </div>

      {/* Save & Apply */}
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
/*  Admin Settings Tab (consolidated config sections)                  */
/* ------------------------------------------------------------------ */

const ADMIN_SECTIONS = [
  { key: 'vaults', title: 'Vault Management', description: 'Enable or disable vaults platform-wide. Disabled vaults show "Coming Soon" everywhere.', icon: Lock },
  { key: 'video-content', title: 'Video Content', description: 'Control video visibility per category — intro, vault, property, and admin video management.', icon: Video },
  { key: 'approvals', title: 'Approval Configuration', description: 'Control approval workflows, thresholds, and auto-approval rules.', icon: ClipboardCheck },
  { key: 'notifications', title: 'Notification Settings', description: 'Manage email, SMS, and in-app notification triggers and templates.', icon: Bell },
  { key: 'templates', title: 'Template Configuration', description: 'Configure document, email, and report templates used across the platform.', icon: FileSpreadsheet },
  { key: 'platform', title: 'Platform Settings', description: 'Core platform parameters — fees, limits, feature flags, and global defaults.', icon: Settings },
  { key: 'appearance', title: 'Appearance & Theme', description: 'Configure light mode background color for the platform.', icon: Palette },
]

const VAULT_TOGGLE_ITEMS = [
  { key: 'opportunity_vault_enabled', label: 'Safe Vault', emoji: '🔒', description: 'Fixed-return mortgage-backed investment opportunities', icon: ShieldCheck, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/30' },
  { key: 'community_vault_enabled', label: 'Community Vault', emoji: '🤝', description: 'Community-driven collaborative investments', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
]

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

const VIDEO_TOGGLE_ITEMS = [
  { key: 'intro_videos_enabled', label: 'Intro / How-It-Works Videos', emoji: '🎬', description: 'Landing page intro video, onboarding walkthrough, and browse-mode video overlay', icon: Play, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  { key: 'vault_videos_enabled', label: 'Vault & Pillar Videos', emoji: '🏛️', description: 'Vault intro videos and four-pillar investor type videos on the Vaults page', icon: Video, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  { key: 'property_videos_enabled', label: 'Property Tour Videos', emoji: '🏠', description: 'Virtual tour / walkthrough videos on opportunity detail pages', icon: Eye, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  { key: 'video_management_enabled', label: 'Video Management (Admin)', emoji: '⚙️', description: 'Show or hide the Video Management section in Control Centre', icon: Settings, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
]

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

  // Auto-seed missing video toggle configs when data has loaded
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
        <button
          onClick={() => refetch()}
          className="text-xs font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const handleToggle = async (key: string) => {
    const cfg = configMap.get(key)
    if (!cfg) return
    const currentVal = cfg.value as Record<string, unknown>
    const isEnabled = currentVal?.enabled === true
    const newEnabled = !isEnabled

    // Optimistic update
    setOptimistic((prev) => ({ ...prev, [key]: newEnabled }))
    setToggleError(null)

    try {
      await updateConfig.mutateAsync({ id: cfg.id, value: { enabled: newEnabled } })
      // Clear optimistic state — fresh data comes from query invalidation
      setOptimistic((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['vault-config'] })
    } catch {
      // Rollback optimistic state
      setOptimistic((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
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

function AdminSettingsTab() {
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
                  {sec.key === 'vaults' ? <VaultManagementPanel /> : sec.key === 'video-content' ? <VideoContentPanel /> : sec.key === 'appearance' ? <AppearancePanel /> : sec.key === 'notifications' ? <NotificationsTab /> : <ConfigTab section={sec.key} title={sec.title} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Builder Questions Tab                                              */
/* ------------------------------------------------------------------ */

function BuilderQuestionsTab() {
  const [selectedOppId, setSelectedOppId] = useState('')
  const { data: oppsData } = useOpportunities({ vaultType: '', status: '' })
  const opps = oppsData?.items ?? []
  const { data: questions = [], isLoading } = useBuilderQuestions(selectedOppId)
  const createQ = useCreateBuilderQuestion()
  const updateQ = useUpdateBuilderQuestion()
  const deleteQ = useDeleteBuilderQuestion()

  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('text')
  const [newOptions, setNewOptions] = useState('')
  const [newRequired, setNewRequired] = useState(false)

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const handleCreate = async () => {
    if (!selectedOppId || !newText.trim()) return
    const opts = newType === 'select' && newOptions.trim()
      ? { choices: newOptions.split(',').map(s => s.trim()).filter(Boolean) }
      : undefined
    await createQ.mutateAsync({
      opportunityId: selectedOppId,
      questionText: newText.trim(),
      questionType: newType,
      options: opts,
      isRequired: newRequired,
      sortOrder: questions.length,
    })
    setNewText('')
    setNewOptions('')
    setNewRequired(false)
  }

  const handleSaveEdit = async (q: BuilderQuestion) => {
    if (!editText.trim()) return
    await updateQ.mutateAsync({
      opportunityId: q.opportunityId,
      questionId: q.id,
      data: { questionText: editText.trim() },
    })
    setEditId(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-theme-primary">Builder Questions</h2>
      <p className="text-sm text-theme-secondary">Manage custom questions that builders can ask investors when they express interest.</p>

      {/* Opportunity picker */}
      <Select
        value={selectedOppId}
        onChange={setSelectedOppId}
        placeholder="Select an Opportunity"
        options={opps.map((o) => ({ value: o.id, label: o.title }))}
        searchable
        className="max-w-md"
      />

      {selectedOppId && (
        <>
          {/* Add new question */}
          <div className="bg-[var(--bg-card)] backdrop-blur-sm rounded-xl border border-theme/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-theme-secondary uppercase">Add Question</p>
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Question text…"
              className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <Select value={newType} onChange={setNewType} options={[
                { value: 'text', label: 'Text' },
                { value: 'number', label: 'Number' },
                { value: 'select', label: 'Select (dropdown)' },
                { value: 'boolean', label: 'Yes / No' },
              ]} size="sm" />
              {newType === 'select' && (
                <input
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="Option1, Option2, Option3"
                  className="flex-1 rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none"
                />
              )}
              <Toggle checked={newRequired} onChange={setNewRequired} label="Required" size="sm" />
              <button onClick={handleCreate} disabled={createQ.isPending || !newText.trim()} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50">
                {createQ.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </div>
          </div>

          {/* Questions list */}
          <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 overflow-hidden">
            {isLoading ? (
              <CenteredLoader />
            ) : questions.length === 0 ? (
              <p className="text-sm text-theme-tertiary text-center py-8">No questions added yet.</p>
            ) : (
              <ul className="divide-y divide-theme">
                {questions.map((q: BuilderQuestion) => (
                  <li key={q.id} className="flex items-center gap-3 px-4 py-3 hover:bg-theme-surface/50">
                    <GripVertical className="h-4 w-4 text-theme-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      {editId === q.id ? (
                        <div className="flex items-center gap-2">
                          <input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded border border-theme px-2 py-1 text-sm focus:border-primary outline-none" />
                          <button onClick={() => handleSaveEdit(q)} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditId(null)} className="text-theme-tertiary hover:text-theme-secondary"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <p className="text-sm text-theme-primary truncate">{q.questionText}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-semibold text-theme-tertiary tracking-wider">{q.questionType}</span>
                        {q.isRequired && <span className="text-[10px] font-semibold text-red-400">Required</span>}
                      </div>
                    </div>
                    <button onClick={() => { setEditId(q.id); setEditText(q.questionText) }} className="text-theme-tertiary hover:text-primary"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => deleteQ.mutate({ opportunityId: q.opportunityId, questionId: q.id })} className="text-theme-tertiary hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Communication Mapping Tab                                          */
/* ------------------------------------------------------------------ */

function CommMappingTab() {
  const [selectedOppId, setSelectedOppId] = useState('')
  const [vaultFilter, setVaultFilter] = useState('')
  const { data: oppsData } = useOpportunities(vaultFilter ? { vaultType: vaultFilter } : undefined)
  const opps = oppsData?.items ?? []
  const { data: mappings = [], isLoading } = useCommMappings(selectedOppId)
  const createMapping = useCreateCommMapping()
  const deleteMapping = useDeleteCommMapping()
  const { data: allUsers } = useControlUsers({})

  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('handler')

  const handleAdd = async () => {
    if (!selectedOppId || !userId) return
    await createMapping.mutateAsync({ opportunityId: selectedOppId, userId, role })
    setUserId('')
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-theme-primary">Communication Mapping</h2>
      <p className="text-sm text-theme-secondary">Assign users to receive notifications for each opportunity&rsquo;s Expression of Interest flow.</p>

      {/* Vault type filter + Opportunity picker */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Vault Type</label>
          <Select
            value={vaultFilter}
            onChange={(v) => { setVaultFilter(v); setSelectedOppId('') }}
            placeholder="All Vaults"
            options={[
              { value: '', label: 'All Vaults' },
              { value: 'wealth', label: 'Wealth Vault' },
              { value: 'safe', label: 'Safe Vault' },
              { value: 'community', label: 'Community Vault' },
            ]}
          />
        </div>
        <div className="flex-1 min-w-[250px]">
          <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Opportunity</label>
          <Select
            value={selectedOppId}
            onChange={setSelectedOppId}
            placeholder="Select an Opportunity"
            options={opps.map((o) => ({ value: o.id, label: `${o.title} (${o.vaultType})` }))}
            searchable
          />
        </div>
      </div>

      {selectedOppId && (
        <>
          {/* Add mapping */}
          <div className="bg-[var(--bg-card)] backdrop-blur-sm rounded-xl border border-theme/60 p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">User</label>
              <Select value={userId} onChange={setUserId} placeholder="Select user…" searchable options={(allUsers ?? []).map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` }))} />
            </div>
            <div className="w-40">
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Role</label>
              <Select value={role} onChange={setRole} options={[
                { value: 'builder', label: 'Builder' },
                { value: 'handler', label: 'Handler' },
                { value: 'admin', label: 'Admin' },
                { value: 'platform_admin', label: 'Platform Admin' },
              ]} />
            </div>
            <button onClick={handleAdd} disabled={createMapping.isPending || !userId} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50">
              {createMapping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          {/* Mappings table */}
          <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 overflow-hidden">
            {isLoading ? (
              <CenteredLoader />
            ) : mappings.length === 0 ? (
              <p className="text-sm text-theme-tertiary text-center py-8">No communication mappings yet.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-theme-surface border-b border-theme">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-theme-secondary uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-theme-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {mappings.map((m: CommMapping) => (
                    <tr key={m.id} className="hover:bg-theme-surface/50">
                      <td className="px-4 py-3 text-theme-primary">{m.userId}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-surface-hover text-theme-primary capitalize">{m.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteMapping.mutate({ mappingId: m.id, opportunityId: selectedOppId })} className="text-theme-tertiary hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
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
/*  Referral Tracking Tab                                               */
/* ------------------------------------------------------------------ */

function RefBadge({ text, variant }: { text: string; variant: 'success' | 'warning' | 'neutral' | 'info' }) {
  const cls =
    variant === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
      : variant === 'warning'
        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        : variant === 'info'
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'bg-theme-surface-hover text-theme-secondary'
  return <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
}

function RefSummaryRow({ s, expanded, onToggle }: { s: RefSummary; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-wrap items-center gap-4 w-full text-left px-4 py-3 border-b border-theme last:border-0 hover:bg-theme-surface transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-[180px]">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
          {s.referrerName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-theme-primary">{s.referrerName}</p>
          <p className="text-xs text-theme-tertiary">{s.referrerEmail}</p>
        </div>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <div className="text-center">
          <p className="font-mono font-bold text-theme-primary">{s.totalReferrals}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Total</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.successfulReferrals}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Rewarded</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{s.pendingReferrals}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Pending</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-theme-primary">{formatINR(s.totalRewardEarned)}</p>
          <p className="text-[10px] text-theme-tertiary uppercase">Earned</p>
        </div>
      </div>
      {expanded ? <ChevronUp className="h-4 w-4 text-theme-tertiary shrink-0" /> : <ChevronDown className="h-4 w-4 text-theme-tertiary shrink-0" />}
    </button>
  )
}

function RefDetailPanel({ referrerId }: { referrerId: string }) {
  const { data: details, isLoading } = useAdminReferralDetails(referrerId)
  if (isLoading) return <CenteredLoader />
  if (!details || details.length === 0) return <p className="text-sm text-theme-tertiary text-center py-4">No referral details found.</p>

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="bg-theme-surface border-b border-theme px-4 py-3 overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="text-[10px] text-theme-tertiary uppercase">
            <th className="text-left pb-2 font-semibold">Referee</th>
            <th className="text-left pb-2 font-semibold">Type</th>
            <th className="text-left pb-2 font-semibold">Property</th>
            <th className="text-center pb-2 font-semibold">User Status</th>
            <th className="text-center pb-2 font-semibold">Investments</th>
            <th className="text-center pb-2 font-semibold">Reward</th>
            <th className="text-left pb-2 font-semibold">Joined</th>
            <th className="text-left pb-2 font-semibold">Referred</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme">
          {details.map((d) => (
            <tr key={d.id} className="hover:bg-[var(--bg-surface)] transition-colors">
              <td className="py-2">
                <p className="font-medium text-theme-primary">{d.refereeName}</p>
                <p className="text-xs text-theme-tertiary">{d.refereeEmail}</p>
              </td>
              <td className="py-2">
                <RefBadge text={d.referralType} variant={d.referralType === 'property' ? 'success' : 'neutral'} />
              </td>
              <td className="py-2 text-theme-primary max-w-[140px] truncate">{d.opportunityTitle ?? '—'}</td>
              <td className="py-2 text-center">
                {d.refereeStatus === 'invested' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Invested
                  </span>
                ) : d.refereeStatus === 'active' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500">
                    <Clock className="h-3.5 w-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-theme-tertiary">
                    <Clock className="h-3.5 w-3.5" /> Stale
                  </span>
                )}
              </td>
              <td className="py-2 text-center font-mono font-bold text-theme-primary">{d.refereeTotalInvestments}</td>
              <td className="py-2 text-center">
                {d.firstInvestmentRewarded ? (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(d.rewardAmount)}</span>
                ) : (
                  <span className="text-[11px] text-theme-tertiary">—</span>
                )}
              </td>
              <td className="py-2 text-theme-secondary text-xs">{fmtDate(d.refereeJoinedAt)}</td>
              <td className="py-2 text-theme-secondary text-xs">{fmtDate(d.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EOI Pipeline Tab (Kanban)                                          */
/* ------------------------------------------------------------------ */

const PIPELINE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  submitted: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  builder_connected: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  deal_in_progress: { bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-700/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  payment_done: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-700/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  deal_completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
}

function EOICard({ eoi, onAdvance, onRevert, onShowUser }: { eoi: EOIItem; onAdvance: (eoiId: string, to: string) => void; onRevert: (eoiId: string, to: string) => void; onShowUser: (user: EOIUser, label: string) => void }) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })

  const currentIdx = EOI_PIPELINE_STATUSES.indexOf(eoi.status as typeof EOI_PIPELINE_STATUSES[number])
  const nextStatus = currentIdx >= 0 && currentIdx < EOI_PIPELINE_STATUSES.length - 1
    ? EOI_PIPELINE_STATUSES[currentIdx + 1]
    : null
  const prevStatus = currentIdx > 0
    ? EOI_PIPELINE_STATUSES[currentIdx - 1]
    : null

  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-sm rounded-xl border border-theme/60 shadow-sm p-4 space-y-3">
      {/* Move back button */}
      {prevStatus && (
        <button
          onClick={() => onRevert(eoi.id, prevStatus)}
          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Move back to {EOI_STATUS_LABELS[prevStatus] ?? prevStatus}
        </button>
      )}

      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-theme-primary truncate">{eoi.user?.fullName ?? 'Unknown'}</p>
          <p className="text-[11px] text-theme-tertiary">{fmtDate(eoi.createdAt)}</p>
        </div>
      </div>

      {/* Property */}
      <div className="flex items-center gap-2 p-2 bg-theme-surface rounded-lg">
        <Building2 className="h-4 w-4 text-theme-tertiary shrink-0" />
        <a
          href={`/opportunity/${eoi.opportunity?.slug ?? ''}`}
          className="text-xs font-medium text-theme-primary hover:text-primary truncate"
          target="_blank"
          rel="noopener noreferrer"
        >
          {eoi.opportunity?.title ?? 'N/A'}
        </a>
        <ExternalLink className="h-3 w-3 text-theme-tertiary shrink-0" />
      </div>

      {/* Investment amount */}
      {eoi.investmentAmount != null && (
        <p className="text-xs text-theme-secondary">
          Investment: <span className="font-mono font-semibold text-theme-primary">{formatINR(eoi.investmentAmount)}</span>
        </p>
      )}

      {/* Referrer */}
      <div className="flex items-center gap-1.5 text-xs">
        <Gift className="h-3.5 w-3.5 text-theme-tertiary" />
        {eoi.referrer ? (
          <span className="text-theme-secondary">
            Referred by <span className="font-semibold text-theme-primary">{eoi.referrer.fullName}</span>
          </span>
        ) : (
          <span className="text-theme-tertiary">Direct (no referral)</span>
        )}
      </div>

      {/* Links row */}
      <div className="flex items-center gap-2 pt-1 border-t border-theme">
        <button
          onClick={() => eoi.user && onShowUser(eoi.user, 'User Details')}
          className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1 disabled:text-theme-tertiary"
          disabled={!eoi.user}
        >
          <User className="h-3 w-3" /> User Details
        </button>
        <span className="text-[var(--border-default)]">|</span>
        <a
          href={`/opportunity/${eoi.opportunity?.slug ?? ''}`}
          className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Building2 className="h-3 w-3" /> Property Details
        </a>
        {eoi.referrer && (
          <>
            <span className="text-[var(--border-default)]">|</span>
            <button
              onClick={() => eoi.referrer && onShowUser(eoi.referrer, 'Referrer Details')}
              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <Gift className="h-3 w-3" /> Referrer Details
            </button>
          </>
        )}
      </div>

      {/* Stage history audit trail */}
      {(() => {
        const currentIdx = EOI_PIPELINE_STATUSES.indexOf(eoi.status as typeof EOI_PIPELINE_STATUSES[number])
        // Show all stages up to and including the current one
        const relevantStatuses = EOI_PIPELINE_STATUSES.slice(0, currentIdx >= 0 ? currentIdx + 1 : 1)
        const historyMap = new Map(
          (eoi.stageHistory ?? []).map((h) => [h.status, h.changedAt])
        )
        // Fall back to createdAt for the submitted stage
        if (!historyMap.has('submitted')) historyMap.set('submitted', eoi.createdAt)
        return (
          <div className="pt-2 border-t border-dashed border-theme space-y-1.5">
            <p className="text-[10px] font-semibold text-theme-secondary uppercase tracking-wider mb-1">Stage Timeline</p>
            {relevantStatuses.map((s, idx) => {
              const enteredAt = historyMap.get(s)
              const isCurrent = idx === relevantStatuses.length - 1
              // Calculate duration: from this stage entry to next stage entry (or now if current)
              let duration = ''
              if (enteredAt) {
                const from = new Date(enteredAt).getTime()
                const nextStage = relevantStatuses[idx + 1]
                const to = nextStage && historyMap.get(nextStage)
                  ? new Date(historyMap.get(nextStage)!).getTime()
                  : Date.now()
                const diffMs = to - from
                const diffH = Math.floor(diffMs / 3_600_000)
                const diffD = Math.floor(diffH / 24)
                if (diffD > 0) duration = `${diffD}d ${diffH % 24}h`
                else if (diffH > 0) duration = `${diffH}h`
                else duration = `${Math.max(1, Math.floor(diffMs / 60_000))}m`
              }
              return (
                <div key={s} className="flex items-start gap-2 text-[11px]">
                  <div className="flex flex-col items-center mt-0.5">
                    {isCurrent ? (
                      <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary/20" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    )}
                    {idx < relevantStatuses.length - 1 && (
                      <div className="w-px h-3 bg-[var(--bg-surface-hover)] mt-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={isCurrent ? 'font-semibold text-theme-primary' : 'text-theme-secondary'}>
                        {EOI_STATUS_LABELS[s] ?? s}
                      </span>
                      <span className="text-theme-tertiary font-mono text-[10px]">
                        {enteredAt ? fmtDateTime(enteredAt) : '—'}
                      </span>
                    </div>
                    {duration && (
                      <span className={`text-[9px] ${isCurrent ? 'text-primary font-medium' : 'text-theme-tertiary'}`}>
                        {isCurrent ? `In stage: ${duration}` : `Stayed: ${duration}`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Advance button */}
      {nextStatus && (
        <button
          onClick={() => onAdvance(eoi.id, nextStatus)}
          className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          Move to {EOI_STATUS_LABELS[nextStatus] ?? nextStatus}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── User Detail Field (extracted for React compiler compliance) ─── */

function UserDetailField({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-8 w-8 rounded-lg bg-theme-surface flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-theme-tertiary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-theme-tertiary uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-theme-primary break-all">{value || '—'}</p>
      </div>
    </div>
  )
}

/* ── User Details Modal (read-only) ──────────────────────────────── */

function UserDetailsModal({
  user,
  title,
  onClose,
}: {
  user: EOIUser
  title: string
  onClose: () => void
}) {
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const kycLabel: Record<string, string> = {
    not_started: 'Not Started',
    pending: 'Pending',
    submitted: 'Submitted',
    verified: 'Verified',
    rejected: 'Rejected',
  }

  const roleLabel: Record<string, string> = {
    investor: 'Investor',
    builder: 'Builder',
    admin: 'Admin',
    super_admin: 'Super Admin',
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel max-w-md mx-4 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
          <h3 className="font-display text-lg font-bold text-theme-primary">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[var(--bg-surface-hover)] transition-colors">
            <X className="h-4 w-4 text-theme-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-1 max-h-[65vh]">
          {/* Avatar + name banner */}
          <div className="flex items-center gap-4 pb-4 border-b border-theme mb-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-14 w-14 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-base font-bold text-theme-primary">{user.fullName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {user.role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary">
                    {roleLabel[user.role] ?? user.role}
                  </span>
                )}
                {user.kycStatus && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    user.kycStatus === 'verified' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : user.kycStatus === 'rejected' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    {kycLabel[user.kycStatus] ?? user.kycStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <UserDetailField icon={Mail} label="Email" value={user.email} />
          <UserDetailField icon={Phone} label="Phone" value={user.phone} />

          {/* Location */}
          <UserDetailField icon={MapPin} label="Location" value={[user.city, user.state].filter(Boolean).join(', ') || null} />

          {/* Professional */}
          <UserDetailField icon={Briefcase} label="Occupation" value={user.occupation} />
          <UserDetailField icon={Shield} label="Annual Income" value={user.annualIncome} />

          {/* Investment profile */}
          <UserDetailField icon={Eye} label="Investment Experience" value={user.investmentExperience} />
          <UserDetailField icon={Shield} label="Risk Tolerance" value={user.riskTolerance} />
          <UserDetailField icon={Gift} label="Referral Code" value={user.referralCode} />

          {/* Member since */}
          <UserDetailField icon={Calendar} label="Member Since" value={fmtDate(user.createdAt)} />
        </div>
      </div>
    </div>
  )
}

function EOIPipelineTab() {
  const { data: allEOIs, isLoading } = useAdminEOIPipeline()
  const updateStatus = useUpdateEOIStatus()
  const [search, setSearch] = useState('')
  const [modalUser, setModalUser] = useState<{ user: EOIUser; label: string } | null>(null)
  const [pendingAdvance, setPendingAdvance] = useState<{ eoiId: string; to: string; userName: string; fromLabel: string; toLabel: string; direction: 'forward' | 'back' } | null>(null)

  const handleAdvance = (eoiId: string, to: string) => {
    const eoi = (allEOIs ?? []).find((e) => e.id === eoiId)
    const currentIdx = EOI_PIPELINE_STATUSES.indexOf((eoi?.status ?? 'submitted') as typeof EOI_PIPELINE_STATUSES[number])
    const fromLabel = EOI_STATUS_LABELS[EOI_PIPELINE_STATUSES[currentIdx] ?? 'submitted'] ?? eoi?.status ?? 'Unknown'
    const toLabel = EOI_STATUS_LABELS[to] ?? to
    const userName = eoi?.user?.fullName ?? 'Unknown'
    setPendingAdvance({ eoiId, to, userName, fromLabel, toLabel, direction: 'forward' })
  }

  const handleRevert = (eoiId: string, to: string) => {
    const eoi = (allEOIs ?? []).find((e) => e.id === eoiId)
    const currentIdx = EOI_PIPELINE_STATUSES.indexOf((eoi?.status ?? 'submitted') as typeof EOI_PIPELINE_STATUSES[number])
    const fromLabel = EOI_STATUS_LABELS[EOI_PIPELINE_STATUSES[currentIdx] ?? 'submitted'] ?? eoi?.status ?? 'Unknown'
    const toLabel = EOI_STATUS_LABELS[to] ?? to
    const userName = eoi?.user?.fullName ?? 'Unknown'
    setPendingAdvance({ eoiId, to, userName, fromLabel, toLabel, direction: 'back' })
  }

  const confirmAdvance = () => {
    if (!pendingAdvance) return
    updateStatus.mutate({ eoiId: pendingAdvance.eoiId, newStatus: pendingAdvance.to })
    setPendingAdvance(null)
  }

  const handleShowUser = useCallback((user: EOIUser, label: string) => {
    setModalUser({ user, label })
  }, [])

  const filtered = useMemo(() => (allEOIs ?? []).filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.user?.fullName ?? '').toLowerCase().includes(q) ||
      (e.opportunity?.title ?? '').toLowerCase().includes(q) ||
      (e.referrer?.fullName ?? '').toLowerCase().includes(q)
    )
  }), [allEOIs, search])

  const grouped = useMemo(() => EOI_PIPELINE_STATUSES.reduce<Record<string, EOIItem[]>>((acc, status) => {
    acc[status] = filtered.filter((e) => e.status === status)
    return acc
  }, {}), [filtered])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">EOI Pipeline</h2>
        <p className="text-sm text-theme-secondary mt-1">
          Track Expression of Interest from submission to deal completion. Move cards through stages to monitor the deal lifecycle.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
        <input
          type="text"
          placeholder="Search user, property, referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-theme text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      {isLoading ? (
        <CenteredLoader />
      ) : (
        <div className="grid grid-cols-5 gap-4 pb-4">
          {EOI_PIPELINE_STATUSES.map((status) => {
            const col = PIPELINE_COLORS[status] ?? PIPELINE_COLORS.submitted!
            const items = grouped[status] ?? []
            return (
              <div key={status} className="min-w-0">
                {/* Column header */}
                <div className={`${col.bg} ${col.border} border rounded-xl px-4 py-3 mb-3 flex items-center gap-2`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h3 className={`text-sm font-bold ${col.text}`}>
                    {EOI_STATUS_LABELS[status] ?? status}
                  </h3>
                  <span className={`ml-auto text-xs font-mono font-bold ${col.text}`}>{items.length}</span>
                </div>
                {/* Cards */}
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-theme-tertiary text-xs">No items</div>
                  ) : (
                    items.map((eoi) => (
                      <EOICard key={eoi.id} eoi={eoi} onAdvance={handleAdvance} onRevert={handleRevert} onShowUser={handleShowUser} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stage Advance Confirmation Modal */}
      {pendingAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPendingAdvance(null)}>
          <div
            className="bg-[var(--bg-card)] border border-theme rounded-2xl shadow-2xl w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  pendingAdvance.direction === 'back'
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : 'bg-amber-100 dark:bg-amber-900/40'
                }`}>
                  <AlertTriangle className={`h-5 w-5 ${
                    pendingAdvance.direction === 'back'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-primary">
                    {pendingAdvance.direction === 'back' ? 'Revert Stage?' : 'Confirm Stage Change'}
                  </h3>
                  <p className="text-xs text-theme-tertiary mt-0.5">
                    {pendingAdvance.direction === 'back'
                      ? 'This will move the EOI back to a previous stage.'
                      : 'This will move the EOI to the next stage.'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-theme-surface border border-theme p-3 space-y-2">
                <p className="text-sm text-theme-secondary">
                  <span className="font-semibold text-theme-primary">{pendingAdvance.userName}</span>
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-md bg-[var(--bg-surface-hover)] text-theme-secondary font-medium">{pendingAdvance.fromLabel}</span>
                  {pendingAdvance.direction === 'back'
                    ? <ArrowLeft className="h-3.5 w-3.5 text-red-400" />
                    : <ArrowRight className="h-3.5 w-3.5 text-theme-tertiary" />}
                  <span className={`px-2 py-1 rounded-md font-semibold ${
                    pendingAdvance.direction === 'back'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'bg-primary/10 text-primary'
                  }`}>{pendingAdvance.toLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setPendingAdvance(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-theme text-theme-secondary hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdvance}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg text-white transition-colors ${
                    pendingAdvance.direction === 'back'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {pendingAdvance.direction === 'back' ? 'Revert' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {modalUser && (
        <UserDetailsModal
          user={modalUser.user}
          title={modalUser.label}
          onClose={() => setModalUser(null)}
        />
      )}
    </div>
  )
}

function ReferralTrackingTab() {
  const { data: summaries, isLoading } = useAdminReferralSummary()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => (summaries ?? []).filter(
    (s) =>
      s.referrerName.toLowerCase().includes(search.toLowerCase()) ||
      s.referrerEmail.toLowerCase().includes(search.toLowerCase()),
  ), [summaries, search])

  const { totalReferred, totalRewarded, totalEarned, totalPending } = useMemo(() => ({
    totalReferred: filtered.reduce((n, s) => n + s.totalReferrals, 0),
    totalRewarded: filtered.reduce((n, s) => n + s.successfulReferrals, 0),
    totalEarned: filtered.reduce((n, s) => n + s.totalRewardEarned, 0),
    totalPending: filtered.reduce((n, s) => n + s.pendingReferrals, 0),
  }), [filtered])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Referral Tracking</h2>
        <p className="text-sm text-theme-secondary mt-1">
          Track who referred whom, whether they invested or stayed stale, and referral reward payouts.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl bg-primary/5 px-4 py-3">
          <p className="font-mono text-xl font-bold text-primary">{filtered.length}</p>
          <p className="text-xs font-medium text-theme-secondary">Referrers</p>
        </div>
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 px-4 py-3">
          <p className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">{totalReferred}</p>
          <p className="text-xs font-medium text-theme-secondary">Total Referrals</p>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
          <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalRewarded}</p>
          <p className="text-xs font-medium text-theme-secondary">Rewarded</p>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
          <p className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">{totalPending}</p>
          <p className="text-xs font-medium text-theme-secondary">Pending</p>
        </div>
        <div className="rounded-xl bg-theme-surface-hover px-4 py-3">
          <p className="font-mono text-xl font-bold text-theme-primary">{formatINR(totalEarned)}</p>
          <p className="text-xs font-medium text-theme-secondary">Total Earned</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
        <input
          type="text"
          placeholder="Search referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-theme text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      {/* Referrer list with expandable details */}
      <div className="rounded-xl border border-theme bg-[var(--bg-surface)] overflow-hidden">
        {isLoading ? (
          <CenteredLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-10 w-10 text-theme-tertiary mx-auto mb-3" />
            <p className="text-theme-secondary text-sm">No referrals found.</p>
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.referrerId}>
              <RefSummaryRow
                s={s}
                expanded={expandedId === s.referrerId}
                onToggle={() => setExpandedId(expandedId === s.referrerId ? null : s.referrerId)}
              />
              {expandedId === s.referrerId && <RefDetailPanel referrerId={s.referrerId} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Video Management Tab                                               */
/* ------------------------------------------------------------------ */

function VideoManagementTab() {
  const { data: videos, isLoading } = useAdminVideos()
  const { data: pagesMeta } = useVideoPagesMeta()
  const createVideo = useCreateAppVideo()
  const updateVideo = useUpdateAppVideo()
  const deleteVideo = useDeleteAppVideo()
  const uploadVideo = useUploadAppVideo()

  const [filterPage, setFilterPage] = useState<string>('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // Add form state
  const [addPage, setAddPage] = useState('')
  const [addSection, setAddSection] = useState('')
  const [addTitle, setAddTitle] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addUrl, setAddUrl] = useState('')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editActive, setEditActive] = useState(true)

  const pages = pagesMeta?.pages ?? []
  const sectionsByPage = pagesMeta?.sections ?? {}
  const filtered = useMemo(() => (videos ?? []).filter((v) => !filterPage || v.page === filterPage), [videos, filterPage])

  // Group by page for display
  const grouped = useMemo(() => filtered.reduce<Record<string, AppVideo[]>>((acc, v) => {
    (acc[v.page] ??= []).push(v)
    return acc
  }, {}), [filtered])

  const pageLabel = (p: string) => pages.find((pg) => pg.value === p)?.label ?? p
  const sectionLabel = (page: string, tag: string) =>
    sectionsByPage[page]?.find((s) => s.value === tag)?.label ?? tag

  const handleAdd = async () => {
    if (!addPage || !addSection || !addTitle || !addUrl) return
    await createVideo.mutateAsync({
      page: addPage,
      sectionTag: addSection,
      title: addTitle,
      description: addDesc || undefined,
      videoUrl: addUrl,
    })
    setShowAdd(false)
    setAddPage('')
    setAddSection('')
    setAddTitle('')
    setAddDesc('')
    setAddUrl('')
  }

  const handleEdit = async (id: string) => {
    await updateVideo.mutateAsync({
      id,
      title: editTitle || undefined,
      description: editDesc,
      isActive: editActive,
    })
    setEditId(null)
  }

  const handleUpload = async (id: string, file: File) => {
    setUploadingId(id)
    await uploadVideo.mutateAsync({ id, file })
    setUploadingId(null)
  }

  if (isLoading) return <CenteredLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-theme-primary">Video Management</h2>
          <p className="text-sm text-theme-secondary mt-1">Manage videos across all application pages. Upload, tag, and replace videos from here.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Video Slot
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-theme-primary">Filter by Page:</label>
        <Select
          value={filterPage}
          onChange={setFilterPage}
          placeholder="All Pages"
          options={[{ value: '', label: 'All Pages' }, ...pages]}
          size="sm"
        />
        <span className="text-xs text-theme-tertiary">{filtered.length} video(s)</span>
      </div>

      {/* Add Video Form */}
      {showAdd && (
        <div className="bg-[var(--bg-surface)] border border-theme rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-theme-primary">Add New Video Slot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Page</label>
              <Select
                value={addPage}
                onChange={(v) => { setAddPage(v); setAddSection('') }}
                placeholder="Select page..."
                options={pages}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Section / Tag</label>
              <Select
                value={addSection}
                onChange={setAddSection}
                placeholder="Select section..."
                options={sectionsByPage[addPage] ?? []}
                disabled={!addPage}
              />
              <p className="text-[10px] text-theme-tertiary mt-1">Or type a custom tag below</p>
              <input
                type="text"
                value={addSection}
                onChange={(e) => setAddSection(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2 mt-1"
                placeholder="Custom section tag..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Title</label>
              <input
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                placeholder="e.g. Wealth Vault Introduction"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Video URL</label>
              <input
                type="text"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
              <textarea
                value={addDesc}
                onChange={(e) => setAddDesc(e.target.value)}
                className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                rows={2}
                placeholder="Optional description..."
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAdd}
              disabled={!addPage || !addSection || !addTitle || !addUrl || createVideo.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {createVideo.isPending ? 'Creating...' : 'Create Video Slot'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-theme text-sm text-theme-secondary hover:bg-theme-surface">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Video List grouped by page */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-theme rounded-xl p-8 text-center">
          <Video className="h-10 w-10 text-theme-tertiary mx-auto mb-3" />
          <p className="text-theme-secondary text-sm">No videos found. Add your first video slot above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([page, vids]) => (
          <div key={page} className="space-y-3">
            <h3 className="font-display text-sm font-bold text-theme-primary uppercase tracking-wider flex items-center gap-2">
              <Video className="h-4 w-4" />
              {pageLabel(page)}
              <span className="text-theme-tertiary font-normal">({vids.length})</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {vids.map((v) => (
                <div
                  key={v.id}
                  className="bg-[var(--bg-surface)] border border-theme rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Thumbnail / video preview */}
                    <button
                      onClick={() => setPreviewUrl(v.videoUrl)}
                      className="relative shrink-0 w-40 h-24 bg-gray-900 rounded-lg overflow-hidden group/thumb"
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/thumb:bg-black/60 transition-colors">
                        <Play className="h-8 w-8 text-white/80 group-hover/thumb:text-white" />
                      </div>
                      {v.thumbnailUrl && (
                        <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-theme-primary truncate">{v.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {sectionLabel(v.page, v.sectionTag)}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${v.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-theme-surface-hover text-theme-secondary'}`}>
                              {v.isActive ? <><Eye className="h-3 w-3" /> Active</> : <><EyeOff className="h-3 w-3" /> Inactive</>}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditId(v.id)
                              setEditTitle(v.title)
                              setEditDesc(v.description ?? '')
                              setEditActive(v.isActive)
                            }}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-theme-secondary transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <label className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-blue-600 dark:text-blue-400 cursor-pointer transition-colors" title="Upload new video">
                            <Upload className="h-4 w-4" />
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleUpload(v.id, f)
                                e.target.value = ''
                              }}
                            />
                          </label>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete "${v.title}"?`)) {
                                await deleteVideo.mutateAsync(v.id)
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-900/30 text-theme-tertiary hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {v.description && (
                        <p className="text-xs text-theme-secondary mt-1 line-clamp-2">{v.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-theme-tertiary">
                        {v.sizeBytes && <span>{(v.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>}
                        {v.contentType && <span>{v.contentType}</span>}
                        <span>Updated {new Date(v.updatedAt).toLocaleDateString()}</span>
                      </div>

                      {uploadingId === v.id && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {editId === v.id && (
                    <div className="border-t border-theme bg-theme-surface p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-theme-secondary mb-1">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                          />
                        </div>
                        <div className="flex items-end gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              className="rounded border-theme"
                            />
                            Active
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-theme-secondary mb-1">Description</label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full text-sm border border-theme rounded-lg px-3 py-2"
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(v.id)}
                          disabled={updateVideo.isPending}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark disabled:opacity-50"
                        >
                          {updateVideo.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg border border-theme text-xs text-theme-secondary hover:bg-theme-surface">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Video preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)} />
          <div className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={previewUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full aspect-video"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const fallback = target.parentElement?.querySelector('.video-error-fallback') as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            >
              Your browser does not support video playback.
            </video>
            <div className="video-error-fallback hidden aspect-video items-center justify-center flex-col gap-3">
              <Video className="h-10 w-10 text-white/30" />
              <p className="text-white/60 text-sm">Video could not be loaded</p>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open URL in new tab</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Media Management Tab                                               */
/* ------------------------------------------------------------------ */

function MediaManagementTab() {
  const { data: opps } = useOpportunities()
  const [selectedOpp, setSelectedOpp] = useState<string>('')
  const { data: mediaList, isLoading } = useListOpportunityMedia(selectedOpp || undefined)
  const uploadMut = useAdminUploadMedia()
  const deleteMut = useDeleteMedia()
  const updateMut = useUpdateMedia()
  const fileRef = useRef<HTMLInputElement>(null)

  const opportunities = opps?.items || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Media Manager</h2>
        <p className="text-sm text-theme-secondary mt-1">Upload, manage and delete images/videos for any opportunity.</p>
      </div>

      {/* Opportunity Selector */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedOpp}
          onChange={setSelectedOpp}
          placeholder="Select an opportunity…"
          options={(Array.isArray(opportunities) ? opportunities : []).map((o) => ({ value: o.id, label: o.title }))}
          searchable
          className="max-w-md"
        />
        {selectedOpp && (
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length) uploadMut.mutate({ opportunityId: selectedOpp, files })
                e.target.value = ''
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadMut.isPending}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Upload className="h-4 w-4" />
              {uploadMut.isPending ? 'Uploading…' : 'Upload Files'}
            </button>
          </>
        )}
      </div>

      {/* Media Grid */}
      {selectedOpp && (
        <div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-theme-tertiary py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading media…
            </div>
          ) : !mediaList?.length ? (
            <div className="text-center py-12 text-theme-tertiary">
              <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No media uploaded yet for this opportunity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaList.map((m) => (
                <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-[var(--bg-surface)] shadow-sm">
                  {m.media_type === 'video' ? (
                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white/70" />
                    </div>
                  ) : (
                    <img src={m.url} alt={m.filename} className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-2 text-xs text-theme-secondary truncate">{m.filename}</div>
                  {m.is_cover && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">Cover</span>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!m.is_cover && (
                      <button
                        onClick={() => updateMut.mutate({ mediaId: m.id, isCover: true })}
                        className="p-1.5 bg-[var(--bg-card)] rounded shadow text-xs hover:bg-[var(--bg-surface)]"
                        title="Set as cover"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Delete this media?')) deleteMut.mutate(m.id) }}
                      className="p-1.5 bg-[var(--bg-card)] rounded shadow text-xs hover:bg-red-50 dark:bg-red-900/30"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Site Content (CMS) Tab                                             */
/* ------------------------------------------------------------------ */

function SiteContentTab() {
  const { data: allContent, isLoading } = useAllSiteContent()
  const updateMut = useUpdateSiteContent()
  const createMut = useCreateSiteContent()
  const deleteMut = useDeleteSiteContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [activePage, setActivePage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newPage, setNewPage] = useState('')
  const [newSection, setNewSection] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Build page counts from all content (unfiltered)
  const pageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of allContent || []) {
      counts[c.page || 'unknown'] = (counts[c.page || 'unknown'] || 0) + 1
    }
    return counts
  }, [allContent])

  const pageNames = useMemo(() => Object.keys(pageCounts).sort(), [pageCounts])

  const items = useMemo(() => (allContent || []).filter((c) => {
    if (activePage && c.page !== activePage) return false
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return c.page?.toLowerCase().includes(q) || c.section_tag?.toLowerCase().includes(q) || c.value?.toLowerCase().includes(q)
  }), [allContent, activePage, searchTerm])

  const grouped = useMemo(() => items.reduce<Record<string, SiteContentItem[]>>((acc, item) => {
    const page = item.page || 'unknown'
    ;(acc[page] ??= []).push(item)
    return acc
  }, {}), [items])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-theme-primary">Site Content (CMS)</h2>
          <p className="text-sm text-theme-secondary mt-1">Edit text content across all pages. Changes are reflected in real-time.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Content
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
        <input
          type="text"
          placeholder="Search by page, section or text…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Page Filter Tabs */}
      {pageNames.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivePage(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activePage === null
                ? 'bg-primary text-white'
                : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-hover/80'
            }`}
          >
            All Pages ({(allContent || []).length})
          </button>
          {pageNames.map((page) => (
            <button
              key={page}
              onClick={() => setActivePage(activePage === page ? null : page)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                activePage === page
                  ? 'bg-primary text-white'
                  : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-hover/80'
              }`}
            >
              {page} ({pageCounts[page]})
            </button>
          ))}
        </div>
      )}

      {/* New Content Form */}
      {showNew && (
        <div className="card p-4 space-y-3 border-primary/30">
          <h3 className="text-sm font-semibold text-theme-primary">New Content Entry</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Page (e.g. landing)" value={newPage} onChange={(e) => setNewPage(e.target.value)} className="input text-sm" />
            <input placeholder="Section tag (e.g. hero_title)" value={newSection} onChange={(e) => setNewSection(e.target.value)} className="input text-sm" />
          </div>
          <textarea placeholder="Content value" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="input text-sm min-h-[60px]" />
          <input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="input text-sm" />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (newPage && newSection && newValue) {
                  createMut.mutate({ page: newPage, section_tag: newSection, value: newValue, description: newDesc || undefined })
                  setShowNew(false); setNewPage(''); setNewSection(''); setNewValue(''); setNewDesc('')
                }
              }}
              disabled={!newPage || !newSection || !newValue || createMut.isPending}
              className="btn-primary text-sm"
            >
              {createMut.isPending ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowNew(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Content List */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-theme-tertiary py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading content…
        </div>
      ) : !items.length ? (
        <div className="text-center py-12 text-theme-tertiary">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No site content found. Click "Add Content" to create entries.</p>
        </div>
      ) : (
        Object.entries(grouped).sort().map(([page, pageItems]) => (
          <div key={page} className="space-y-2">
            <h3 className="font-semibold text-sm text-primary uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4" /> {page}
              <span className="text-theme-tertiary font-normal">({pageItems.length} entries)</span>
            </h3>
            <div className="divide-y bg-[var(--bg-surface)] rounded-lg border shadow-sm">
              {pageItems.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-theme-surface-hover px-1.5 py-0.5 rounded text-theme-secondary">{item.section_tag}</code>
                      {item.description && <span className="text-xs text-theme-tertiary">— {item.description}</span>}
                    </div>
                    {editingId === item.id ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="input text-sm mt-2 min-h-[50px] w-full"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm text-theme-primary mt-1 line-clamp-2">{item.value}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => { updateMut.mutate({ id: item.id, value: editValue }); setEditingId(null) }}
                          className="p-1.5 rounded hover:bg-green-50"
                          disabled={updateMut.isPending}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)]">
                          <X className="h-4 w-4 text-theme-tertiary" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(item.id); setEditValue(item.value || '') }}
                          className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)]"
                        >
                          <Edit3 className="h-4 w-4 text-theme-tertiary" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this content entry?')) deleteMut.mutate(item.id) }}
                          className="p-1.5 rounded hover:bg-red-50 dark:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Vault Feature Matrix Tab                                           */
/* ------------------------------------------------------------------ */

const VAULT_TYPES = ['wealth', 'safe', 'community'] as const
const ROLES = ['investor', 'builder', 'admin', 'super_admin'] as const
const FEATURE_KEYS = [
  'view_vault', 'create_opportunity', 'invest', 'community_post',
  'community_reply', 'view_analytics', 'manage_media', 'export_data',
  'admin_panel', 'approve_content',
] as const

function VaultFeatureMatrixTab() {
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

/* ------------------------------------------------------------------ */
/*  Admin Invites Tab                                                  */
/* ------------------------------------------------------------------ */

function AdminInvitesTab() {
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

      {/* Invite form */}
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
          <p className="text-red-500 text-sm">Failed to send invite. Please try again.</p>
        )}
      </div>

      {/* Invites list */}
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

/* ------------------------------------------------------------------ */
/*  Vault Metrics Config Tab                                           */
/* ------------------------------------------------------------------ */

const VAULT_LABELS: Record<string, string> = { wealth: 'Wealth Vault', safe: 'Safe Vault', community: 'Community Vault' }

function VaultMetricsTab() {
  const { data: metricsConfig, isLoading: metricsLoading } = useVaultMetricsConfig()
  const { data: allConfigs, isLoading: configsLoading } = useControlConfigs('vault_metrics')
  const updateConfig = useUpdateConfig()
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<Record<string, Set<string>>>({})
  const [saving, setSaving] = useState(false)

  // Initialise local state from fetched config
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

/* ------------------------------------------------------------------ */
/*  Snapshot Config Tab                                                */
/* ------------------------------------------------------------------ */

const SNAPSHOT_SECTION_DEFS: { key: string; label: string; description: string }[] = [
  { key: 'irr', label: 'IRR Metrics', description: 'Expected, actual and appreciation percentages' },
  { key: 'property_details', label: 'Project Details', description: 'City, asset type, phase, description' },
  { key: 'appreciation_history', label: 'Appreciation History', description: 'Timeline of valuation events' },
  { key: 'payout_schedule', label: 'Payout Schedule', description: 'Safe vault payout frequency info' },
  { key: 'co_investors', label: 'Co-Investors', description: 'Investor count, funding progress, founder' },
  { key: 'timeline', label: 'Timeline', description: 'Investment date and hold duration' },
  { key: 'documents', label: 'Documents', description: 'Linked project PDFs and files' },
]

function SnapshotConfigTab() {
  const { data: config, isLoading } = useSnapshotConfig()
  const updateConfig = useUpdateSnapshotConfig()
  const toast = useToastStore()
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [saving, setSaving] = useState(false)

  // Initialise local state from fetched data
  const activeSections = selected ?? new Set(config?.sections ?? [])

  const toggle = (key: string) => {
    const next = new Set(activeSections)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelected(next)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateConfig.mutateAsync(Array.from(activeSections))
      toast.success('Snapshot sections saved')
    } catch {
      toast.error('Failed to save snapshot config')
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

/* ------------------------------------------------------------------ */
/*  Deal Lifecycle Tab                                                 */
/* ------------------------------------------------------------------ */

const DEAL_STATUSES = ['draft', 'pending_approval', 'approved', 'active', 'funding', 'funded', 'rejected', 'closed', 'archived'] as const

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  funding: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  funded: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  closed: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
  archived: 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

function DealLifecycleTab() {
  const [vaultFilter, setVaultFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data: oppsData, isLoading } = useOpportunities({
    ...(vaultFilter ? { vaultType: vaultFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  })
  const updateOpp = useUpdateOpportunity()

  // Appreciation modal state
  const [appreciateModalDeal, setAppreciateModalDeal] = useState<{ id: string; title: string; currentValuation: number | null; raisedAmount: number } | null>(null)
  const [appreciateMode, setAppreciateMode] = useState<'percentage' | 'absolute'>('percentage')
  const [appreciateValue, setAppreciateValue] = useState('')
  const [appreciateNote, setAppreciateNote] = useState('')
  const [showHistory, setShowHistory] = useState<string | null>(null)

  const createAppreciation = useCreateAppreciation(appreciateModalDeal?.id ?? '')
  const { data: historyData } = useAppreciationHistory(showHistory ?? undefined)

  const deals = oppsData?.items ?? []

  const handleStatusChange = (dealId: string, newStatus: string) => {
    updateOpp.mutate({ id: dealId, data: { status: newStatus } })
  }

  const openAppreciateModal = (deal: typeof deals[0]) => {
    setAppreciateModalDeal({ id: deal.id, title: deal.title, currentValuation: deal.currentValuation, raisedAmount: deal.raisedAmount })
    setAppreciateMode('percentage')
    setAppreciateValue('')
    setAppreciateNote('')
  }

  const handleAppreciate = () => {
    const val = parseFloat(appreciateValue)
    if (!val || val <= 0 || !appreciateModalDeal) return
    createAppreciation.mutate(
      { mode: appreciateMode, value: val, note: appreciateNote || undefined },
      { onSuccess: () => setAppreciateModalDeal(null) },
    )
  }

  // Preview calculation
  const previewNewVal = (() => {
    if (!appreciateModalDeal) return null
    const val = parseFloat(appreciateValue)
    if (!val || val <= 0) return null
    const base = appreciateModalDeal.currentValuation ?? appreciateModalDeal.raisedAmount ?? 0
    return appreciateMode === 'percentage' ? base * (1 + val / 100) : base + val
  })()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Deal Lifecycle</h2>
        <p className="text-sm text-theme-secondary mt-1">
          Manage the lifecycle status of all opportunities across vaults.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={vaultFilter}
          onChange={(e) => setVaultFilter(e.target.value)}
          className="rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
        >
          <option value="">All Vaults</option>
          <option value="wealth">Wealth</option>
          <option value="safe">Safe</option>
          <option value="community">Community</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
        >
          <option value="">All Statuses</option>
          {DEAL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-theme-tertiary" />
        </div>
      ) : deals.length === 0 ? (
        <p className="text-sm text-theme-tertiary py-8 text-center">No deals found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-theme">
          <table className="w-full text-sm">
            <thead className="bg-theme-surface border-b border-theme">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Vault</th>
                <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-theme-secondary">Valuation</th>
                <th className="text-right px-4 py-3 font-semibold text-theme-secondary">Funding %</th>
                <th className="text-center px-4 py-3 font-semibold text-theme-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {deals.map((deal) => {
                const pct = deal.targetAmount ? Math.round((deal.raisedAmount / deal.targetAmount) * 100) : 0
                const valuation = deal.currentValuation ?? deal.raisedAmount
                const appPct = deal.raisedAmount > 0 ? ((valuation - deal.raisedAmount) / deal.raisedAmount * 100) : 0
                return (
                  <tr key={deal.id} className="hover:bg-theme-surface/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-theme-primary max-w-[180px] truncate">{deal.title}</p>
                      <p className="text-xs text-theme-tertiary">{deal.launchDate ? new Date(deal.launchDate).toLocaleDateString() : 'No launch date'}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-theme-secondary">{deal.vaultType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {deal.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-mono text-theme-primary">{formatINRCompact(valuation)}</p>
                      {appPct > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                          <TrendingUp className="h-3 w-3" /> +{appPct.toFixed(1)}%
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-theme-primary">{pct}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <select
                          value={deal.status}
                          onChange={(e) => handleStatusChange(deal.id, e.target.value)}
                          disabled={updateOpp.isPending}
                          className="rounded-md border border-theme bg-theme-surface px-2 py-1 text-xs text-theme-primary disabled:opacity-50"
                        >
                          {DEAL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => openAppreciateModal(deal)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/40 transition-colors"
                          title="Appreciate valuation"
                        >
                          <TrendingUp className="h-3.5 w-3.5" /> Appreciate
                        </button>
                        <button
                          onClick={() => setShowHistory(showHistory === deal.id ? null : deal.id)}
                          className="p-1 rounded text-theme-tertiary hover:text-theme-primary hover:bg-theme-surface transition-colors"
                          title="View appreciation history"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Appreciation History Expandable */}
      {showHistory && historyData && historyData.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-theme-primary">Appreciation History</h3>
            <button onClick={() => setShowHistory(null)} className="p-1 rounded hover:bg-theme-surface">
              <X className="h-4 w-4 text-theme-tertiary" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {historyData.map((evt) => (
              <div key={evt.id} className="flex items-center justify-between p-2 bg-theme-surface rounded-lg text-xs">
                <div>
                  <span className="font-medium text-theme-primary">
                    {evt.mode === 'percentage' ? `+${evt.inputValue}%` : `+${formatINRCompact(evt.inputValue)}`}
                  </span>
                  <span className="text-theme-tertiary ml-2">
                    {formatINRCompact(evt.oldValuation)} → {formatINRCompact(evt.newValuation)}
                  </span>
                  {evt.note && <p className="text-theme-secondary mt-0.5">{evt.note}</p>}
                </div>
                <div className="text-right text-theme-tertiary shrink-0 ml-3">
                  <p>{evt.creatorName ?? 'System'}</p>
                  <p>{new Date(evt.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appreciation Modal */}
      {appreciateModalDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAppreciateModalDeal(null)}>
          <div className="bg-theme-card rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-theme-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> Appreciate Valuation
              </h3>
              <button onClick={() => setAppreciateModalDeal(null)} className="p-1 rounded-lg hover:bg-theme-surface">
                <X className="h-5 w-5 text-theme-tertiary" />
              </button>
            </div>

            <p className="text-sm text-theme-secondary mb-1">{appreciateModalDeal.title}</p>
            <p className="text-xs text-theme-tertiary mb-4">
              Current valuation: <span className="font-semibold text-theme-primary">{formatINRCompact(appreciateModalDeal.currentValuation ?? appreciateModalDeal.raisedAmount)}</span>
            </p>

            {/* Mode toggle */}
            <div className="flex rounded-lg border border-theme overflow-hidden mb-4">
              <button
                onClick={() => setAppreciateMode('percentage')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${appreciateMode === 'percentage' ? 'bg-emerald-500 text-white' : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'}`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setAppreciateMode('absolute')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${appreciateMode === 'absolute' ? 'bg-emerald-500 text-white' : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'}`}
              >
                Absolute (₹)
              </button>
            </div>

            {/* Value input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-theme-secondary mb-1">
                {appreciateMode === 'percentage' ? 'Appreciation %' : 'Appreciation Amount (₹)'}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={appreciateValue}
                onChange={(e) => setAppreciateValue(e.target.value)}
                placeholder={appreciateMode === 'percentage' ? 'e.g. 10' : 'e.g. 500000'}
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
              />
            </div>

            {/* Preview */}
            {previewNewVal !== null && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/40">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  New valuation: <span className="font-bold">{formatINRCompact(previewNewVal)}</span>
                </p>
              </div>
            )}

            {/* Note */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-theme-secondary mb-1">Note (optional)</label>
              <input
                type="text"
                value={appreciateNote}
                onChange={(e) => setAppreciateNote(e.target.value)}
                placeholder="e.g. Q1 market correction"
                maxLength={500}
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setAppreciateModalDeal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-theme text-sm font-medium text-theme-secondary hover:bg-theme-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAppreciate}
                disabled={!appreciateValue || parseFloat(appreciateValue) <= 0 || createAppreciation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {createAppreciation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Builder Updates Tab                                                */
/* ------------------------------------------------------------------ */

function BuilderUpdatesTab() {
  const { data: oppsData } = useOpportunities({})
  const opps = oppsData?.items ?? []
  const [selectedOppId, setSelectedOppId] = useState<string>(opps[0]?.id ?? '')

  // Sync default when opps load
  useEffect(() => {
    if (!selectedOppId && opps.length) setSelectedOppId(opps[0]?.id ?? '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oppsData?.items, selectedOppId])

  const { data: updates, isLoading } = useBuilderUpdates(selectedOppId || undefined)
  const createUpdate = useCreateBuilderUpdate(selectedOppId)
  const deleteUpdate = useDeleteBuilderUpdate(selectedOppId)
  const patchUpdate = usePatchBuilderUpdate(selectedOppId)
  const uploadAtt = useUploadBuilderAttachment(selectedOppId)
  const deleteAtt = useDeleteBuilderAttachment(selectedOppId)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (!title.trim()) return
    if (editId) {
      patchUpdate.mutate({ id: editId, title, description: desc || undefined }, {
        onSuccess: () => { setEditId(null); setTitle(''); setDesc(''); setShowForm(false) },
      })
    } else {
      createUpdate.mutate({ title, description: desc || undefined }, {
        onSuccess: () => { setTitle(''); setDesc(''); setShowForm(false) },
      })
    }
  }

  const handleEdit = (u: BuilderUpdate) => {
    setEditId(u.id); setTitle(u.title); setDesc(u.description ?? ''); setShowForm(true)
  }

  const handleFileUpload = async (updateId: string, files: FileList) => {
    for (const f of Array.from(files)) {
      await uploadAtt.mutateAsync({ updateId, file: f })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-theme-primary">Builder Updates</h2>
        <p className="text-sm text-theme-secondary mt-1">Post timeline updates on opportunities visible to all investors.</p>
      </div>

      {/* Opportunity picker */}
      <select
        value={selectedOppId}
        onChange={(e) => setSelectedOppId(e.target.value)}
        className="rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary max-w-sm w-full"
      >
        <option value="">Select opportunity…</option>
        {opps.map((o) => (
          <option key={o.id} value={o.id}>{o.title} ({o.vaultType})</option>
        ))}
      </select>

      {selectedOppId && (
        <>
          {/* Create / Edit form toggle */}
          {!showForm && (
            <button
              onClick={() => { setEditId(null); setTitle(''); setDesc(''); setShowForm(true) }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-4 w-4" /> New Update
            </button>
          )}

          {showForm && (
            <div className="card p-5 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Update title…"
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary"
                maxLength={300}
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description (optional)…"
                rows={3}
                className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-primary placeholder:text-theme-tertiary resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || createUpdate.isPending || patchUpdate.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {editId ? 'Save' : 'Post Update'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditId(null) }}
                  className="px-4 py-2 rounded-lg border border-theme text-sm text-theme-secondary hover:bg-theme-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Updates list */}
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-theme-tertiary" /></div>
          ) : !updates?.length ? (
            <p className="text-sm text-theme-tertiary py-8 text-center">No updates yet for this opportunity.</p>
          ) : (
            <div className="space-y-3">
              {updates.map((u) => (
                <div key={u.id} className="card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-theme-primary">{u.title}</p>
                      <p className="text-[11px] text-theme-tertiary">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {u.creator && ` · ${u.creator.fullName}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg hover:bg-theme-surface-hover" title="Edit">
                        <Edit3 className="h-3.5 w-3.5 text-theme-tertiary" />
                      </button>
                      <button onClick={() => deleteUpdate.mutate(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {u.description && <p className="text-xs text-theme-secondary whitespace-pre-line">{u.description}</p>}

                  {/* Attachments */}
                  {u.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {u.attachments.map((a) => (
                        <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme-surface text-xs">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-theme-primary hover:text-primary truncate max-w-[120px]">{a.filename ?? 'file'}</a>
                          <button onClick={() => deleteAtt.mutate(a.id)} className="ml-1 text-theme-tertiary hover:text-red-500"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleFileUpload(u.id, e.target.files) }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Upload className="h-3 w-3" /> Attach file
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CommandControlPage() {
  const [searchParams] = useSearchParams()
  const initialSection = (searchParams.get('section') as Section) || 'dashboard'
  const [activeSection, setActiveSection] = useState<Section>(initialSection)
  const { videoManagementEnabled } = useVaultConfig()
  const visibleSections = useMemo(
    () => videoManagementEnabled ? SECTIONS : SECTIONS.filter((s) => s.id !== 'content'),
    [videoManagementEnabled],
  )

  return (
    <div className="min-h-screen bg-theme-surface flex flex-col">
      {/* Shared Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Super Admin</span>
          <h1 className="page-hero-title">Command & Control</h1>
          <p className="page-hero-subtitle">Manage users, configurations, content, and platform-wide settings from one place.</p>
        </div>
      </section>

      {/* Body */}
      <div className="flex flex-1 w-full">
        {/* Side Nav */}
        <aside className="w-56 shrink-0 border-r border-theme bg-[var(--bg-surface)] py-6 px-3 hidden md:block">
          <nav className="space-y-1">
            {visibleSections.map((s, i) => {
              const Icon = s.icon
              const active = activeSection === s.id
              const prev = visibleSections[i - 1] as SideNavItem | undefined
              const prevGroup = prev?.group ?? null
              const showGroup = s.group && s.group !== prevGroup
              return (
                <div key={s.id}>
                  {showGroup && (
                    <p className={`text-[10px] font-bold uppercase tracking-wider text-theme-tertiary px-3 ${i > 0 ? 'pt-4' : ''} pb-1`}>
                      {s.group}
                    </p>
                  )}
                  <button
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-primary/5 text-primary' : 'text-theme-secondary hover:bg-theme-surface hover:text-theme-primary'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {s.label}
                  </button>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Mobile section picker */}
        <div className="md:hidden sticky top-16 z-40 bg-[var(--bg-surface)] border-b border-theme overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2">
            {visibleSections.map((s) => {
              const Icon = s.icon
              const active = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-theme-secondary hover:bg-theme-surface'
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
        <main className="flex-1 p-6 sm:p-8 bg-theme-surface min-w-0">
          <SectionErrorBoundary fallbackTitle="Dashboard failed to load">
            {activeSection === 'dashboard' && <DashboardTab />}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Analytics failed to load">
            {activeSection === 'vault-analytics' && <VaultAnalyticsDashboard />}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Users section failed to load">
            {activeSection === 'users' && <UsersTab />}
            {activeSection === 'admin-settings' && <AdminSettingsTab />}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Approvals failed to load">
            {activeSection === 'approvals' && <ApprovalsPage embedded />}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Content section failed to load">
            {activeSection === 'content' && videoManagementEnabled && <VideoManagementTab />}
            {activeSection === 'builder-questions' && <BuilderQuestionsTab />}
            {activeSection === 'comm-mapping' && <CommMappingTab />}
            {activeSection === 'referral-tracking' && <ReferralTrackingTab />}
            {activeSection === 'eoi-pipeline' && <EOIPipelineTab />}
            {activeSection === 'deal-lifecycle' && <DealLifecycleTab />}
            {activeSection === 'builder-updates' && <BuilderUpdatesTab />}
            {activeSection === 'shield-review' && <AdminShieldReviewTab />}
            {activeSection === 'media-management' && <MediaManagementTab />}
            {activeSection === 'site-content' && <SiteContentTab />}
            {activeSection === 'vault-features' && <VaultFeatureMatrixTab />}
            {activeSection === 'vault-metrics' && <VaultMetricsTab />}
            {activeSection === 'snapshot-config' && <SnapshotConfigTab />}
            {activeSection === 'admin-invites' && <AdminInvitesTab />}
          </SectionErrorBoundary>
          {activeSection === 'answer-questions' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-theme-primary">Answer Questions</h2>
              <p className="text-sm text-theme-secondary">Review and respond to community questions submitted by investors.</p>
              <a
                href="/community/answer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Go to Answer Questions
              </a>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}
