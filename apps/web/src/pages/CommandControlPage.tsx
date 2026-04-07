import { useState, useCallback, useRef } from 'react'
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
  Briefcase,
  Calendar,
  BarChart3,
  Image,
  FileText,
} from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import {
  useControlDashboard,
  useControlConfigs,
  useUpdateConfig,
  useControlUsers,
  useUpdateUserRole,
} from '@/hooks/useControlCentre'
import { useApprovalStats } from '@/hooks/useApprovals'
import { ROLE_LABELS, type UserRole } from '@/lib/constants'
import { useOpportunities } from '@/hooks/useOpportunities'
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
import { formatINR } from '@/lib/formatters'
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
} from '../hooks/useSiteContent'

/* ------------------------------------------------------------------ */
/*  Side-nav sections                                                  */
/* ------------------------------------------------------------------ */

type Section = 'dashboard' | 'vault-analytics' | 'users' | 'admin-settings' | 'content' | 'builder-questions' | 'comm-mapping' | 'answer-questions' | 'referral-tracking' | 'eoi-pipeline' | 'media-management' | 'site-content'

type SideNavItem = { id: Section; label: string; icon: typeof LayoutDashboard; group?: string }

const SECTIONS: SideNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'vault-analytics', label: 'Vault Analytics', icon: BarChart3, group: 'Overview' },
  { id: 'users', label: 'Users & Roles', icon: Users, group: 'Users' },
  { id: 'referral-tracking', label: 'Referral Tracking', icon: Gift, group: 'Users' },
  { id: 'eoi-pipeline', label: 'EOI Pipeline', icon: Kanban, group: 'Operations' },
  { id: 'builder-questions', label: 'Builder Questions', icon: HelpCircle, group: 'Operations' },
  { id: 'comm-mapping', label: 'Comm Mapping', icon: Link2, group: 'Operations' },
  { id: 'answer-questions', label: 'Answer Questions', icon: MessageCircle, group: 'Operations' },
  { id: 'media-management', label: 'Media Manager', icon: Image, group: 'Content' },
  { id: 'content', label: 'Content & Videos', icon: FileVideo, group: 'Content' },
  { id: 'site-content', label: 'Site Content (CMS)', icon: FileText, group: 'Content' },
  { id: 'admin-settings', label: 'Admin Settings', icon: Settings, group: 'Settings' },
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
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/60 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-gray-200">
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
                <tr key={u.id} className="hover:bg-stone-50/50">
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
                          className="p-1 rounded bg-stone-50 text-gray-400 hover:bg-gray-100"
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
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-stone-50 text-gray-400 hover:text-gray-600"
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
            <div key={cfg.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 px-5 py-4">
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
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-stone-50 text-gray-400 hover:text-gray-600 shrink-0"
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
/*  Admin Settings Tab (consolidated config sections)                  */
/* ------------------------------------------------------------------ */

const ADMIN_SECTIONS = [
  { key: 'approvals', title: 'Approval Configuration', description: 'Control approval workflows, thresholds, and auto-approval rules.', icon: ClipboardCheck },
  { key: 'notifications', title: 'Notification Settings', description: 'Manage email, SMS, and in-app notification triggers and templates.', icon: Bell },
  { key: 'templates', title: 'Template Configuration', description: 'Configure document, email, and report templates used across the platform.', icon: FileSpreadsheet },
  { key: 'platform', title: 'Platform Settings', description: 'Core platform parameters — fees, limits, feature flags, and global defaults.', icon: Settings },
]

function AdminSettingsTab() {
  const [expanded, setExpanded] = useState<string | null>('approvals')

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-gray-900">Admin Settings</h2>
      <p className="text-sm text-gray-500">Manage all platform configuration in one place — approvals, notifications, templates, and global settings.</p>

      <div className="space-y-3">
        {ADMIN_SECTIONS.map((sec) => {
          const Icon = sec.icon
          const isOpen = expanded === sec.key
          return (
            <div key={sec.key} className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/60 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : sec.key)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-stone-50/50 transition-colors"
              >
                <Icon className="h-5 w-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{sec.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sec.description}</p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-5">
                  <ConfigTab section={sec.key} title={sec.title} />
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
      <h2 className="font-display text-xl font-bold text-gray-900">Builder Questions</h2>
      <p className="text-sm text-gray-500">Manage custom questions that builders can ask investors when they express interest.</p>

      {/* Opportunity picker */}
      <select
        value={selectedOppId}
        onChange={(e) => setSelectedOppId(e.target.value)}
        className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary outline-none"
      >
        <option value="">Select an Opportunity</option>
        {opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
      </select>

      {selectedOppId && (
        <>
          {/* Add new question */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Add Question</p>
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Question text…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary outline-none">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select (dropdown)</option>
                <option value="boolean">Yes / No</option>
              </select>
              {newType === 'select' && (
                <input
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="Option1, Option2, Option3"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary outline-none"
                />
              )}
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                Required
              </label>
              <button onClick={handleCreate} disabled={createQ.isPending || !newText.trim()} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50">
                {createQ.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </div>
          </div>

          {/* Questions list */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/60 overflow-hidden">
            {isLoading ? (
              <CenteredLoader />
            ) : questions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No questions added yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {questions.map((q: BuilderQuestion) => (
                  <li key={q.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50/50">
                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {editId === q.id ? (
                        <div className="flex items-center gap-2">
                          <input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-primary outline-none" />
                          <button onClick={() => handleSaveEdit(q)} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900 truncate">{q.questionText}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">{q.questionType}</span>
                        {q.isRequired && <span className="text-[10px] font-semibold text-red-400">Required</span>}
                      </div>
                    </div>
                    <button onClick={() => { setEditId(q.id); setEditText(q.questionText) }} className="text-gray-400 hover:text-primary"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => deleteQ.mutate({ opportunityId: q.opportunityId, questionId: q.id })} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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
      <h2 className="font-display text-xl font-bold text-gray-900">Communication Mapping</h2>
      <p className="text-sm text-gray-500">Assign users to receive notifications for each opportunity&rsquo;s Expression of Interest flow.</p>

      {/* Vault type filter + Opportunity picker */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Vault Type</label>
          <select
            value={vaultFilter}
            onChange={(e) => { setVaultFilter(e.target.value); setSelectedOppId('') }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary outline-none"
          >
            <option value="">All Vaults</option>
            <option value="wealth">Wealth Vault</option>
            <option value="opportunity">Opportunity Vault</option>
            <option value="community">Community Vault</option>
          </select>
        </div>
        <div className="flex-1 min-w-[250px]">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Opportunity</label>
          <select
            value={selectedOppId}
            onChange={(e) => setSelectedOppId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary outline-none"
          >
            <option value="">Select an Opportunity</option>
            {opps.map((o) => <option key={o.id} value={o.id}>{o.title} ({o.vaultType})</option>)}
          </select>
        </div>
      </div>

      {selectedOppId && (
        <>
          {/* Add mapping */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">User</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary outline-none">
                <option value="">Select user…</option>
                {allUsers?.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
              </select>
            </div>
            <div className="w-40">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary outline-none">
                <option value="builder">Builder</option>
                <option value="handler">Handler</option>
                <option value="admin">Admin</option>
                <option value="platform_admin">Platform Admin</option>
              </select>
            </div>
            <button onClick={handleAdd} disabled={createMapping.isPending || !userId} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50">
              {createMapping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          {/* Mappings table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/60 overflow-hidden">
            {isLoading ? (
              <CenteredLoader />
            ) : mappings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No communication mappings yet.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mappings.map((m: CommMapping) => (
                    <tr key={m.id} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3 text-gray-900">{m.userId}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{m.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteMapping.mutate({ mappingId: m.id, opportunityId: selectedOppId })} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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
      ? 'bg-emerald-50 text-emerald-700'
      : variant === 'warning'
        ? 'bg-amber-50 text-amber-700'
        : variant === 'info'
          ? 'bg-blue-50 text-blue-600'
          : 'bg-gray-100 text-gray-600'
  return <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
}

function RefSummaryRow({ s, expanded, onToggle }: { s: RefSummary; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-wrap items-center gap-4 w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-stone-50 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-[180px]">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
          {s.referrerName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{s.referrerName}</p>
          <p className="text-xs text-gray-400">{s.referrerEmail}</p>
        </div>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <div className="text-center">
          <p className="font-mono font-bold text-gray-900">{s.totalReferrals}</p>
          <p className="text-[10px] text-gray-400 uppercase">Total</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-emerald-600">{s.successfulReferrals}</p>
          <p className="text-[10px] text-gray-400 uppercase">Rewarded</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-amber-600">{s.pendingReferrals}</p>
          <p className="text-[10px] text-gray-400 uppercase">Pending</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-gray-900">{formatINR(s.totalRewardEarned)}</p>
          <p className="text-[10px] text-gray-400 uppercase">Earned</p>
        </div>
      </div>
      {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
    </button>
  )
}

function RefDetailPanel({ referrerId }: { referrerId: string }) {
  const { data: details, isLoading } = useAdminReferralDetails(referrerId)
  if (isLoading) return <CenteredLoader />
  if (!details || details.length === 0) return <p className="text-sm text-gray-400 text-center py-4">No referral details found.</p>

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="bg-stone-50 border-b border-gray-200 px-4 py-3 overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="text-[10px] text-gray-400 uppercase">
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
        <tbody className="divide-y divide-gray-100">
          {details.map((d) => (
            <tr key={d.id} className="hover:bg-white transition-colors">
              <td className="py-2">
                <p className="font-medium text-gray-900">{d.refereeName}</p>
                <p className="text-xs text-gray-400">{d.refereeEmail}</p>
              </td>
              <td className="py-2">
                <RefBadge text={d.referralType} variant={d.referralType === 'property' ? 'success' : 'neutral'} />
              </td>
              <td className="py-2 text-gray-700 max-w-[140px] truncate">{d.opportunityTitle ?? '—'}</td>
              <td className="py-2 text-center">
                {d.refereeStatus === 'invested' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Invested
                  </span>
                ) : d.refereeStatus === 'active' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500">
                    <Clock className="h-3.5 w-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                    <Clock className="h-3.5 w-3.5" /> Stale
                  </span>
                )}
              </td>
              <td className="py-2 text-center font-mono font-bold text-gray-900">{d.refereeTotalInvestments}</td>
              <td className="py-2 text-center">
                {d.firstInvestmentRewarded ? (
                  <span className="text-[11px] font-semibold text-emerald-600">{formatINR(d.rewardAmount)}</span>
                ) : (
                  <span className="text-[11px] text-gray-400">—</span>
                )}
              </td>
              <td className="py-2 text-gray-500 text-xs">{fmtDate(d.refereeJoinedAt)}</td>
              <td className="py-2 text-gray-500 text-xs">{fmtDate(d.createdAt)}</td>
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
  submitted: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  builder_connected: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  deal_in_progress: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  payment_done: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  deal_completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
}

function EOICard({ eoi, onAdvance, onShowUser }: { eoi: EOIItem; onAdvance: (eoiId: string, to: string) => void; onShowUser: (user: EOIUser, label: string) => void }) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })

  const currentIdx = EOI_PIPELINE_STATUSES.indexOf(eoi.status as typeof EOI_PIPELINE_STATUSES[number])
  const nextStatus = currentIdx >= 0 && currentIdx < EOI_PIPELINE_STATUSES.length - 1
    ? EOI_PIPELINE_STATUSES[currentIdx + 1]
    : null

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm p-4 space-y-3">
      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{eoi.user?.fullName ?? 'Unknown'}</p>
          <p className="text-[11px] text-gray-400">{fmtDate(eoi.createdAt)}</p>
        </div>
      </div>

      {/* Property */}
      <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
        <a
          href={`/opportunity/${eoi.opportunity?.slug ?? ''}`}
          className="text-xs font-medium text-gray-700 hover:text-primary truncate"
          target="_blank"
          rel="noopener noreferrer"
        >
          {eoi.opportunity?.title ?? 'N/A'}
        </a>
        <ExternalLink className="h-3 w-3 text-gray-300 shrink-0" />
      </div>

      {/* Investment amount */}
      {eoi.investmentAmount != null && (
        <p className="text-xs text-gray-500">
          Investment: <span className="font-mono font-semibold text-gray-700">{formatINR(eoi.investmentAmount)}</span>
        </p>
      )}

      {/* Referrer */}
      <div className="flex items-center gap-1.5 text-xs">
        <Gift className="h-3.5 w-3.5 text-gray-400" />
        {eoi.referrer ? (
          <span className="text-gray-600">
            Referred by <span className="font-semibold text-gray-800">{eoi.referrer.fullName}</span>
          </span>
        ) : (
          <span className="text-gray-400">Direct (no referral)</span>
        )}
      </div>

      {/* Links row */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => eoi.user && onShowUser(eoi.user, 'User Details')}
          className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1 disabled:text-gray-300"
          disabled={!eoi.user}
        >
          <User className="h-3 w-3" /> User Details
        </button>
        <span className="text-gray-200">|</span>
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
            <span className="text-gray-200">|</span>
            <button
              onClick={() => eoi.referrer && onShowUser(eoi.referrer, 'Referrer Details')}
              className="text-[11px] font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
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
          <div className="pt-2 border-t border-dashed border-gray-200 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Stage Timeline</p>
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
                      <div className="w-px h-3 bg-gray-200 mt-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={isCurrent ? 'font-semibold text-gray-800' : 'text-gray-500'}>
                        {EOI_STATUS_LABELS[s] ?? s}
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        {enteredAt ? fmtDateTime(enteredAt) : '—'}
                      </span>
                    </div>
                    {duration && (
                      <span className={`text-[9px] ${isCurrent ? 'text-primary font-medium' : 'text-gray-400'}`}>
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

  const Field = ({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 py-2">
      <div className="h-8 w-8 rounded-lg bg-stone-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-all">{value || '—'}</p>
      </div>
    </div>
  )

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-1 max-h-[65vh]">
          {/* Avatar + name banner */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 mb-2">
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
              <p className="text-base font-bold text-gray-900">{user.fullName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {user.role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary">
                    {roleLabel[user.role] ?? user.role}
                  </span>
                )}
                {user.kycStatus && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    user.kycStatus === 'verified' ? 'bg-emerald-50 text-emerald-700'
                    : user.kycStatus === 'rejected' ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                  }`}>
                    {kycLabel[user.kycStatus] ?? user.kycStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <Field icon={Mail} label="Email" value={user.email} />
          <Field icon={Phone} label="Phone" value={user.phone} />

          {/* Location */}
          <Field icon={MapPin} label="Location" value={[user.city, user.state].filter(Boolean).join(', ') || null} />

          {/* Professional */}
          <Field icon={Briefcase} label="Occupation" value={user.occupation} />
          <Field icon={Shield} label="Annual Income" value={user.annualIncome} />

          {/* Investment profile */}
          <Field icon={Eye} label="Investment Experience" value={user.investmentExperience} />
          <Field icon={Shield} label="Risk Tolerance" value={user.riskTolerance} />
          <Field icon={Gift} label="Referral Code" value={user.referralCode} />

          {/* Member since */}
          <Field icon={Calendar} label="Member Since" value={fmtDate(user.createdAt)} />
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

  const handleAdvance = (eoiId: string, to: string) => {
    updateStatus.mutate({ eoiId, newStatus: to })
  }

  const handleShowUser = useCallback((user: EOIUser, label: string) => {
    setModalUser({ user, label })
  }, [])

  const filtered = (allEOIs ?? []).filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.user?.fullName ?? '').toLowerCase().includes(q) ||
      (e.opportunity?.title ?? '').toLowerCase().includes(q) ||
      (e.referrer?.fullName ?? '').toLowerCase().includes(q)
    )
  })

  const grouped = EOI_PIPELINE_STATUSES.reduce<Record<string, EOIItem[]>>((acc, status) => {
    acc[status] = filtered.filter((e) => e.status === status)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">EOI Pipeline</h2>
        <p className="text-sm text-gray-500 mt-1">
          Track Expression of Interest from submission to deal completion. Move cards through stages to monitor the deal lifecycle.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search user, property, referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
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
                    <div className="text-center py-8 text-gray-300 text-xs">No items</div>
                  ) : (
                    items.map((eoi) => (
                      <EOICard key={eoi.id} eoi={eoi} onAdvance={handleAdvance} onShowUser={handleShowUser} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
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

  const filtered = (summaries ?? []).filter(
    (s) =>
      s.referrerName.toLowerCase().includes(search.toLowerCase()) ||
      s.referrerEmail.toLowerCase().includes(search.toLowerCase()),
  )

  const totalReferred = filtered.reduce((n, s) => n + s.totalReferrals, 0)
  const totalRewarded = filtered.reduce((n, s) => n + s.successfulReferrals, 0)
  const totalEarned = filtered.reduce((n, s) => n + s.totalRewardEarned, 0)
  const totalPending = filtered.reduce((n, s) => n + s.pendingReferrals, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Referral Tracking</h2>
        <p className="text-sm text-gray-500 mt-1">
          Track who referred whom, whether they invested or stayed stale, and referral reward payouts.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl bg-primary/5 px-4 py-3">
          <p className="font-mono text-xl font-bold text-primary">{filtered.length}</p>
          <p className="text-xs font-medium text-gray-500">Referrers</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-4 py-3">
          <p className="font-mono text-xl font-bold text-blue-600">{totalReferred}</p>
          <p className="text-xs font-medium text-gray-500">Total Referrals</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-3">
          <p className="font-mono text-xl font-bold text-emerald-600">{totalRewarded}</p>
          <p className="text-xs font-medium text-gray-500">Rewarded</p>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <p className="font-mono text-xl font-bold text-amber-600">{totalPending}</p>
          <p className="text-xs font-medium text-gray-500">Pending</p>
        </div>
        <div className="rounded-xl bg-gray-100 px-4 py-3">
          <p className="font-mono text-xl font-bold text-gray-900">{formatINR(totalEarned)}</p>
          <p className="text-xs font-medium text-gray-500">Total Earned</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      {/* Referrer list with expandable details */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <CenteredLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No referrals found.</p>
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
  const filtered = (videos ?? []).filter((v) => !filterPage || v.page === filterPage)

  // Group by page for display
  const grouped = filtered.reduce<Record<string, AppVideo[]>>((acc, v) => {
    ;(acc[v.page] ??= []).push(v)
    return acc
  }, {})

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
          <h2 className="font-display text-xl font-bold text-gray-900">Video Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage videos across all application pages. Upload, tag, and replace videos from here.</p>
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
        <label className="text-sm font-medium text-gray-700">Filter by Page:</label>
        <select
          value={filterPage}
          onChange={(e) => setFilterPage(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">All Pages</option>
          {pages.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} video(s)</span>
      </div>

      {/* Add Video Form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Add New Video Slot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Page</label>
              <select
                value={addPage}
                onChange={(e) => { setAddPage(e.target.value); setAddSection('') }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select page...</option>
                {pages.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section / Tag</label>
              <select
                value={addSection}
                onChange={(e) => setAddSection(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                disabled={!addPage}
              >
                <option value="">Select section...</option>
                {(sectionsByPage[addPage] ?? []).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Or type a custom tag below</p>
              <input
                type="text"
                value={addSection}
                onChange={(e) => setAddSection(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mt-1"
                placeholder="Custom section tag..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g. Wealth Vault Introduction"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Video URL</label>
              <input
                type="text"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={addDesc}
                onChange={(e) => setAddDesc(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
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
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-stone-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Video List grouped by page */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Video className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No videos found. Add your first video slot above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([page, vids]) => (
          <div key={page} className="space-y-3">
            <h3 className="font-display text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Video className="h-4 w-4" />
              {pageLabel(page)}
              <span className="text-gray-400 font-normal">({vids.length})</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {vids.map((v) => (
                <div
                  key={v.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
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
                          <h4 className="font-semibold text-gray-900 truncate">{v.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                              {sectionLabel(v.page, v.sectionTag)}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${v.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
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
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <label className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" title="Upload new video">
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
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {v.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                        {v.sizeBytes && <span>{(v.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>}
                        {v.contentType && <span>{v.contentType}</span>}
                        <span>Updated {new Date(v.updatedAt).toLocaleDateString()}</span>
                      </div>

                      {uploadingId === v.id && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {editId === v.id && (
                    <div className="border-t border-gray-100 bg-stone-50 p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div className="flex items-end gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            Active
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
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
                        <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-stone-50">
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
        <h2 className="font-display text-xl font-bold text-gray-900">Media Manager</h2>
        <p className="text-sm text-gray-500 mt-1">Upload, manage and delete images/videos for any opportunity.</p>
      </div>

      {/* Opportunity Selector */}
      <div className="flex items-center gap-4">
        <select
          value={selectedOpp}
          onChange={(e) => setSelectedOpp(e.target.value)}
          className="input max-w-md"
        >
          <option value="">Select an opportunity…</option>
          {(Array.isArray(opportunities) ? opportunities : []).map((o: any) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
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
            <div className="flex items-center gap-2 text-gray-400 py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading media…
            </div>
          ) : !mediaList?.length ? (
            <div className="text-center py-12 text-gray-400">
              <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No media uploaded yet for this opportunity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaList.map((m) => (
                <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-white shadow-sm">
                  {m.media_type === 'video' ? (
                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white/70" />
                    </div>
                  ) : (
                    <img src={m.url} alt={m.filename} className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-2 text-xs text-gray-500 truncate">{m.filename}</div>
                  {m.is_cover && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">Cover</span>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!m.is_cover && (
                      <button
                        onClick={() => updateMut.mutate({ mediaId: m.id, isCover: true })}
                        className="p-1.5 bg-white/90 rounded shadow text-xs hover:bg-white"
                        title="Set as cover"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Delete this media?')) deleteMut.mutate(m.id) }}
                      className="p-1.5 bg-white/90 rounded shadow text-xs hover:bg-red-50"
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newPage, setNewPage] = useState('')
  const [newSection, setNewSection] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const items = (allContent || []).filter((c: any) =>
    !searchTerm ||
    c.page?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.section_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.value?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const grouped = items.reduce((acc: Record<string, any[]>, item: any) => {
    const page = item.page || 'unknown'
    if (!acc[page]) acc[page] = []
    acc[page].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Site Content (CMS)</h2>
          <p className="text-sm text-gray-500 mt-1">Edit text content across all pages. Changes are reflected in real-time.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Content
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by page, section or text…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* New Content Form */}
      {showNew && (
        <div className="card p-4 space-y-3 border-primary/30">
          <h3 className="text-sm font-semibold text-gray-700">New Content Entry</h3>
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
        <div className="flex items-center gap-2 text-gray-400 py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading content…
        </div>
      ) : !items.length ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No site content found. Click "Add Content" to create entries.</p>
        </div>
      ) : (
        Object.entries(grouped).sort().map(([page, pageItems]) => (
          <div key={page} className="space-y-2">
            <h3 className="font-semibold text-sm text-primary uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4" /> {page}
              <span className="text-gray-400 font-normal">({(pageItems as any[]).length} entries)</span>
            </h3>
            <div className="divide-y bg-white rounded-lg border shadow-sm">
              {(pageItems as any[]).map((item: any) => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{item.section_tag}</code>
                      {item.description && <span className="text-xs text-gray-400">— {item.description}</span>}
                    </div>
                    {editingId === item.id ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="input text-sm mt-2 min-h-[50px] w-full"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{item.value}</p>
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
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-gray-100">
                          <X className="h-4 w-4 text-gray-400" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(item.id); setEditValue(item.value || '') }}
                          className="p-1.5 rounded hover:bg-gray-100"
                        >
                          <Edit3 className="h-4 w-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this content entry?')) deleteMut.mutate(item.id) }}
                          className="p-1.5 rounded hover:bg-red-50"
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
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CommandControlPage() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
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
        <aside className="w-56 shrink-0 border-r border-gray-200 bg-white py-6 px-3 hidden md:block">
          <nav className="space-y-1">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon
              const active = activeSection === s.id
              const prev = SECTIONS[i - 1] as SideNavItem | undefined
              const prevGroup = prev?.group ?? null
              const showGroup = s.group && s.group !== prevGroup
              return (
                <div key={s.id}>
                  {showGroup && (
                    <p className={`text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 ${i > 0 ? 'pt-4' : ''} pb-1`}>
                      {s.group}
                    </p>
                  )}
                  <button
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-stone-50 hover:text-gray-900'
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
                    active ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-stone-50'
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
        <main className="flex-1 p-6 sm:p-8 bg-stone-50 min-w-0">
          {activeSection === 'dashboard' && <DashboardTab />}
          {activeSection === 'vault-analytics' && <VaultAnalyticsDashboard />}
          {activeSection === 'users' && <UsersTab />}
          {activeSection === 'admin-settings' && <AdminSettingsTab />}
          {activeSection === 'content' && <VideoManagementTab />}
          {activeSection === 'builder-questions' && <BuilderQuestionsTab />}
          {activeSection === 'comm-mapping' && <CommMappingTab />}
          {activeSection === 'referral-tracking' && <ReferralTrackingTab />}
          {activeSection === 'eoi-pipeline' && <EOIPipelineTab />}
          {activeSection === 'media-management' && <MediaManagementTab />}
          {activeSection === 'site-content' && <SiteContentTab />}
          {activeSection === 'answer-questions' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-gray-900">Answer Questions</h2>
              <p className="text-sm text-gray-500">Review and respond to community questions submitted by investors.</p>
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
    </div>
  )
}
