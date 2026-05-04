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
  MessageCircle,
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
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
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
const VideoManagementTab = lazy(() => import('./control/VideoManagementTab'))
const MediaManagementTab = lazy(() => import('./control/MediaManagementTab'))
const SiteContentTab = lazy(() => import('./control/SiteContentTab'))
const VaultFeatureMatrixTab = lazy(() => import('./control/VaultFeatureMatrixTab'))
const AdminInvitesTab = lazy(() => import('./control/AdminInvitesTab'))
const VaultMetricsTab = lazy(() => import('./control/VaultMetricsTab'))
const SnapshotConfigTab = lazy(() => import('./control/SnapshotConfigTab'))
const DealLifecycleTab = lazy(() => import('./control/DealLifecycleTab'))
const BuilderUpdatesTab = lazy(() => import('./control/BuilderUpdatesTab'))

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
  | 'answer-questions'
  | 'referral-tracking'
  | 'eoi-pipeline'
  | 'media-management'
  | 'site-content'
  | 'vault-features'
  | 'admin-invites'
  | 'vault-metrics'
  | 'deal-lifecycle'
  | 'builder-updates'
  | 'approvals'
  | 'shield-review'
  | 'snapshot-config'

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
/*  Suspense fallback                                                  */
/* ------------------------------------------------------------------ */

function TabFallback() {
  return (
    <div className="py-12 flex justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
