import { useState, useMemo, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import sidebarBg from '@/assets/sidebar-bg.avif'
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
  Gift,
  Kanban,
  ShieldCheck,
  Briefcase,
  BarChart3,
  Image,
  Rocket,
  Shield,
  Eye,
  Mail,
} from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import VaultAnalyticsDashboard from '@/pages/VaultAnalyticsDashboard'
import ApprovalsPage from '@/pages/ApprovalsPage'
import { AdminShieldReviewTab } from '@/components/shield/AdminShieldReviewTab'

const DashboardTab = lazy(() => import('./control/DashboardTab'))
const UsersTab = lazy(() => import('./control/UsersTab'))
const AdminSettingsTab = lazy(() => import('./control/AdminSettingsTab'))
const BuilderQuestionsTab = lazy(() => import('./control/BuilderQuestionsTab'))
const CommMappingTab = lazy(() => import('./control/CommMappingTab'))
const ReferralTrackingTab = lazy(() => import('./control/ReferralTrackingTab'))
const EOIPipelineTab = lazy(() => import('./control/EOIPipelineTab'))
const ImageManagementTab = lazy(() => import('./control/ImageManagementTab'))
const VideoManagementTab = lazy(() => import('./control/VideoManagementTab'))
const MediaManagementTab = lazy(() => import('./control/MediaManagementTab'))
const SiteContentTab = lazy(() => import('./control/SiteContentTab'))
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
  | 'dashboard'
  | 'vault-analytics'
  | 'users'
  | 'admin-settings'
  | 'content'
  | 'builder-questions'
  | 'comm-mapping'
  | 'referral-tracking'
  | 'eoi-pipeline'
  | 'media-management'
  | 'app-images'
  | 'site-content'
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
  { id: 'comm-platform', label: 'Comm Platform', icon: Mail, group: 'Operations' },
  { id: 'media-management', label: 'Media Manager', icon: Image, group: 'Content' },
  { id: 'app-images', label: 'Home Images', icon: Image, group: 'Content' },
  { id: 'content', label: 'Content & Videos', icon: FileVideo, group: 'Content' },
  { id: 'site-content', label: 'Site Content (CMS)', icon: FileText, group: 'Content' },
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
  `w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'border border-[#D4AF37] bg-[#D4AF37] text-[#0D1324] font-semibold shadow-md'
      : 'border border-white/55 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
  }`

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
    <MainLayout>

      {/* Hero — compact strip matching VaultsPage */}
      <section id="hero" className="page-hero-compact bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight leading-[1.1]">
            Command &amp; Control
          </h1>
          <p className="text-white/60 max-w-2xl text-base leading-relaxed font-body">
            Manage users, configurations, content, and platform-wide settings from one place.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="flex flex-1 w-full relative">
        {/* Side Nav */}
        <aside className="w-64 shrink-0 border-r border-theme/20 py-5 px-3 hidden md:block sticky top-[4rem] h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden" style={{ background: 'transparent' }}>
          {/* Background image with dark overlay for text legibility */}
          <div
            aria-hidden="true"
            className="fixed top-[4rem] left-0 bottom-0 w-64 pointer-events-none -z-10"
            style={{
              backgroundImage: `url(${sidebarBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Dark gradient overlay so white text stays readable */}
          <div
            className="fixed top-[4rem] left-0 bottom-0 w-64 pointer-events-none bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950/95 -z-10"
            aria-hidden="true"
          />

          <nav className="space-y-1.5 relative z-10">
            {visibleSections.map((s, i) => {
              const Icon = s.icon
              const active = activeSection === s.id
              const prev = visibleSections[i - 1] as SideNavItem | undefined
              const prevGroup = prev?.group ?? null
              const showGroup = s.group && s.group !== prevGroup
              return (
                <div key={s.id}>
                  {showGroup && (
                    <p className={`text-[10px] font-bold uppercase tracking-wider text-white/60 px-2.5 ${i > 0 ? 'pt-4' : ''} pb-1.5`}>
                      {s.group}
                    </p>
                  )}
                  <button
                    onClick={() => setActiveSection(s.id)}
                    className={pillCls(active)}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#0D1324]' : 'text-white/70'}`} />
                    {s.label}
                  </button>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Mobile section picker */}
        <div className="md:hidden sticky top-16 z-40 bg-[var(--bg-surface)] border-b border-theme overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-1.5">
            {visibleSections.map((s) => {
              const Icon = s.icon
              const active = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors ${
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
        <main className="flex-1 p-5 sm:p-6 content-section-bg min-w-0">
          <SectionErrorBoundary fallbackTitle="Dashboard failed to load">
            {activeSection === 'dashboard' && (
              <Suspense fallback={<TabFallback />}><DashboardTab /></Suspense>
            )}
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Analytics failed to load">
            {activeSection === 'vault-analytics' && <VaultAnalyticsDashboard />}
          </SectionErrorBoundary>
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
            {activeSection === 'referral-tracking' && (
              <Suspense fallback={<TabFallback />}><ReferralTrackingTab /></Suspense>
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
