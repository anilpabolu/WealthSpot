import { useState, useMemo, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileVideo,
  FileText,
  Settings,
  Loader2,
  HelpCircle,
  Link2,
  Kanban,
  ShieldCheck,
  Briefcase,
  BarChart3,
  Image,
  Rocket,
  Shield,
  Eye,
  Mail,
  BookOpen,
} from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import ApprovalsPage from '@/pages/ApprovalsPage'
import { AdminShieldReviewTab } from '@/components/shield/AdminShieldReviewTab'

const UsersTab = lazy(() => import('./control/UsersTab'))
const AdminSettingsTab = lazy(() => import('./control/AdminSettingsTab'))
const BuilderQuestionsTab = lazy(() => import('./control/BuilderQuestionsTab'))
const CommMappingTab = lazy(() => import('./control/CommMappingTab'))
const EOIPipelineTab = lazy(() => import('./control/EOIPipelineTab'))
const ImageManagementTab = lazy(() => import('./control/ImageManagementTab'))
const VideoManagementTab = lazy(() => import('./control/VideoManagementTab'))
const MediaManagementTab = lazy(() => import('./control/MediaManagementTab'))
const SiteContentTab = lazy(() => import('./control/SiteContentTab'))
const KnowledgeHubTab = lazy(() => import('./control/KnowledgeHubTab'))
const VaultFeatureMatrixTab = lazy(() => import('./control/VaultFeatureMatrixTab'))
const AdminInvitesTab = lazy(() => import('./control/AdminInvitesTab'))
const VaultMetricsTab = lazy(() => import('./control/VaultMetricsTab'))
const SnapshotConfigTab = lazy(() => import('./control/SnapshotConfigTab'))
const DealLifecycleTab = lazy(() => import('./control/DealLifecycleTab'))
const BuilderUpdatesTab = lazy(() => import('./control/BuilderUpdatesTab'))
const CommPlatformTab = lazy(() => import('./control/CommPlatformTab'))

/* ------------------------------------------------------------------ */
/*  Side-nav sections                                                  */
/* ------------------------------------------------------------------ */

type Section =
  | 'users'
  | 'admin-settings'
  | 'content'
  | 'builder-questions'
  | 'comm-mapping'
  | 'eoi-pipeline'
  | 'media-management'
  | 'app-images'
  | 'site-content'
  | 'knowledge-hub'
  | 'vault-features'
  | 'admin-invites'
  | 'vault-metrics'
  | 'deal-lifecycle'
  | 'builder-updates'
  | 'approvals'
  | 'shield-review'
  | 'snapshot-config'
  | 'comm-platform'

type SideNavItem = { id: Section; label: string; icon: typeof LayoutDashboard; group?: string }

const SECTIONS: SideNavItem[] = [
  { id: 'users', label: 'Users & Roles', icon: Users, group: 'Users' },
  { id: 'eoi-pipeline', label: 'EOI Pipeline', icon: Kanban, group: 'Operations' },
  { id: 'deal-lifecycle', label: 'Deal Lifecycle', icon: Briefcase, group: 'Operations' },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, group: 'Operations' },
  { id: 'builder-updates', label: 'Builder Updates', icon: Rocket, group: 'Operations' },
  { id: 'shield-review', label: 'Shield Review', icon: ShieldCheck, group: 'Operations' },
  { id: 'builder-questions', label: 'Builder Questions', icon: HelpCircle, group: 'Operations' },
  { id: 'comm-mapping', label: 'Comm Mapping', icon: Link2, group: 'Operations' },
  { id: 'comm-platform', label: 'Comm Platform', icon: Mail, group: 'Operations' },
  { id: 'media-management', label: 'Media Manager', icon: Image, group: 'Content' },
  { id: 'app-images', label: 'Home Images', icon: Image, group: 'Content' },
  { id: 'content', label: 'Content & Videos', icon: FileVideo, group: 'Content' },
  { id: 'site-content', label: 'Site Content (CMS)', icon: FileText, group: 'Content' },
  { id: 'knowledge-hub', label: 'Knowledge Hub', icon: BookOpen, group: 'Content' },
  { id: 'vault-features', label: 'Feature Matrix', icon: Shield, group: 'Settings' },
  { id: 'vault-metrics', label: 'Vault Metrics', icon: BarChart3, group: 'Settings' },
  { id: 'snapshot-config', label: 'Snapshot Sections', icon: Eye, group: 'Settings' },
  { id: 'admin-invites', label: 'Admin Invites', icon: Mail, group: 'Settings' },
  { id: 'admin-settings', label: 'Admin Settings', icon: Settings, group: 'Settings' },
]

/* ------------------------------------------------------------------ */
/*  Suspense fallback                                                  */
/* ------------------------------------------------------------------ */

function TabFallback() {
  return (
    <div className="py-12 flex justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}


const pillCls = (isActive: boolean) =>
  `group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
    isActive
      ? 'border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 text-[#8B6914] font-bold shadow-[0_4px_20px_rgba(212,175,55,0.15)]'
      : 'border border-transparent text-[var(--text-secondary)] hover:border-[rgba(209,196,157,0.28)] hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:text-[#8B6914]'
  }`

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CommandControlPage() {
  const [searchParams] = useSearchParams()
  const initialSection = (searchParams.get('section') as Section) || 'users'
  const [activeSection, setActiveSection] = useState<Section>(initialSection)
  const { videoManagementEnabled } = useVaultConfig()
  const visibleSections = useMemo(
    () => videoManagementEnabled ? SECTIONS : SECTIONS.filter((s) => s.id !== 'content'),
    [videoManagementEnabled],
  )

  return (
    <MainLayout>

      {/* Hero — compact, matches VaultsPage */}
      <section id="hero" className="page-hero-navbar bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -mt-16 relative overflow-hidden pt-[8.5rem] pb-10 lg:pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-violet-500/12 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
          <h1 className="font-hero text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight leading-[1.1]">
            Command &amp; Control
          </h1>
          <p className="text-white/55 max-w-xl text-sm leading-relaxed">
            Manage users, configurations, content, and platform settings from one place.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="flex flex-col md:flex-row flex-1 w-full relative">
        {/* Side Nav */}
        <aside className="relative hidden md:flex flex-col w-64 shrink-0 border-r border-[rgba(209,196,157,0.28)] bg-white sticky top-[4rem] h-[calc(100vh-4rem)] overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
          <div className="relative z-10 flex flex-col h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[rgba(209,196,157,0.3)]">
            <nav className="space-y-1.5">
            {visibleSections.map((s, i) => {
              const Icon = s.icon
              const active = activeSection === s.id
              const prev = visibleSections[i - 1] as SideNavItem | undefined
              const prevGroup = prev?.group ?? null
              const showGroup = s.group && s.group !== prevGroup
              return (
                <div key={s.id}>
                  {showGroup && (
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] px-3 ${i > 0 ? 'pt-5' : 'pt-2'} pb-2.5`}>
                      {s.group}
                    </p>
                  )}
                  <button
                    onClick={() => setActiveSection(s.id)}
                    className={pillCls(active)}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-[#D4AF37]' : 'text-[var(--text-tertiary)] group-hover:text-[#D4AF37]'}`} />
                    {s.label}
                  </button>
                </div>
              )
            })}
          </nav>
          </div>
        </aside>

        {/* Mobile section picker */}
        <div className="md:hidden sticky top-14 z-40 bg-[var(--bg-surface)] border-b border-[rgba(209,196,157,0.3)] shadow-sm">
          <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-none">
            {visibleSections.map((s) => {
              const Icon = s.icon
              const active = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                    active
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#8B6914]'
                      : 'border-[rgba(209,196,157,0.35)] text-[var(--text-secondary)] hover:border-[#D4AF37]/50 hover:text-[#8B6914]'
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 bg-[var(--bg-base)] min-w-0">
          <SectionErrorBoundary fallbackTitle="Users section failed to load">
            {activeSection === 'users' && (
              <Suspense fallback={<TabFallback />}><UsersTab /></Suspense>
            )}
            {activeSection === 'admin-settings' && (
              <Suspense fallback={<TabFallback />}><AdminSettingsTab /></Suspense>
            )}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Approvals failed to load">
            {activeSection === 'approvals' && <ApprovalsPage embedded />}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Content section failed to load">
            {activeSection === 'content' && videoManagementEnabled && (
              <Suspense fallback={<TabFallback />}><VideoManagementTab /></Suspense>
            )}
            {activeSection === 'builder-questions' && (
              <Suspense fallback={<TabFallback />}><BuilderQuestionsTab /></Suspense>
            )}
            {activeSection === 'comm-mapping' && (
              <Suspense fallback={<TabFallback />}><CommMappingTab /></Suspense>
            )}

            {activeSection === 'eoi-pipeline' && (
              <Suspense fallback={<TabFallback />}><EOIPipelineTab /></Suspense>
            )}
            {activeSection === 'deal-lifecycle' && (
              <Suspense fallback={<TabFallback />}><DealLifecycleTab /></Suspense>
            )}
            {activeSection === 'builder-updates' && (
              <Suspense fallback={<TabFallback />}><BuilderUpdatesTab /></Suspense>
            )}
            {activeSection === 'shield-review' && <AdminShieldReviewTab />}
            {activeSection === 'media-management' && (
              <Suspense fallback={<TabFallback />}><MediaManagementTab /></Suspense>
            )}
            {activeSection === 'app-images' && (
              <Suspense fallback={<TabFallback />}><ImageManagementTab /></Suspense>
            )}
            {activeSection === 'site-content' && (
              <Suspense fallback={<TabFallback />}><SiteContentTab /></Suspense>
            )}
            {activeSection === 'knowledge-hub' && (
              <Suspense fallback={<TabFallback />}><KnowledgeHubTab /></Suspense>
            )}
            {activeSection === 'vault-features' && (
              <Suspense fallback={<TabFallback />}><VaultFeatureMatrixTab /></Suspense>
            )}
            {activeSection === 'vault-metrics' && (
              <Suspense fallback={<TabFallback />}><VaultMetricsTab /></Suspense>
            )}
            {activeSection === 'snapshot-config' && (
              <Suspense fallback={<TabFallback />}><SnapshotConfigTab /></Suspense>
            )}
            {activeSection === 'admin-invites' && (
              <Suspense fallback={<TabFallback />}><AdminInvitesTab /></Suspense>
            )}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Comm Platform failed to load">
            {activeSection === 'comm-platform' && (
              <Suspense fallback={<TabFallback />}><CommPlatformTab /></Suspense>
            )}
          </SectionErrorBoundary>
        </main>
      </div>
    </MainLayout>
  )
}
