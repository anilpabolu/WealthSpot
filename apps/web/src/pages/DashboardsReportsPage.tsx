import { useState, Suspense, lazy } from 'react'
import { LayoutDashboard, Loader2, Eye, BarChart3, Gift } from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'

const DashboardTab = lazy(() => import('./reports/DashboardTab'))
const VaultAnalyticsDashboard = lazy(() => import('./reports/VaultAnalyticsDashboard'))
const ReferralTrackingTab = lazy(() => import('./reports/ReferralTrackingTab'))
const UserVisitsTab = lazy(() => import('./reports/UserVisitsTab'))

type Section = 'dashboard' | 'vault-analytics' | 'referral-tracking' | 'user-visits'

type SideNavItem = { id: Section; label: string; icon: typeof LayoutDashboard; group?: string }

const SECTIONS: SideNavItem[] = [
  { id: 'dashboard', label: 'Platform Overview', icon: LayoutDashboard, group: 'High-Level' },
  { id: 'vault-analytics', label: 'Vault Analytics', icon: BarChart3, group: 'High-Level' },
  { id: 'referral-tracking', label: 'Referral Tracking', icon: Gift, group: 'Engagement' },
  { id: 'user-visits', label: 'User Activity Logs', icon: Eye, group: 'Engagement' },
]

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

export default function DashboardsReportsPage() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  return (
    <MainLayout>
      {/* Hero — compact, matches VaultsPage & CommandControl */}
      <section id="hero" className="page-hero-navbar bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -mt-16 relative overflow-hidden pt-[8.5rem] pb-10 lg:pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-violet-500/12 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
          <h1 className="font-hero text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight leading-[1.1]">
            Dashboards &amp; Reports
          </h1>
          <p className="text-white/55 max-w-xl text-sm leading-relaxed">
            Monitor user engagement, view metrics, and generate detailed reports.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="flex flex-col md:flex-row flex-1 w-full relative">
        {/* Side Nav */}
        <aside className="relative hidden md:flex flex-col w-64 shrink-0 border-r border-[rgba(209,196,157,0.28)] bg-white sticky top-[4rem] h-[calc(100vh-4rem)] overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
          <div className="relative z-10 flex flex-col h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[rgba(209,196,157,0.3)]">
            <nav className="space-y-1.5">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon
              const active = activeSection === s.id
              const prev = SECTIONS[i - 1] as SideNavItem | undefined
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
            {SECTIONS.map((s) => {
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
          <SectionErrorBoundary fallbackTitle="Section failed to load">
            {activeSection === 'dashboard' && (
              <Suspense fallback={<TabFallback />}><DashboardTab /></Suspense>
            )}
            {activeSection === 'vault-analytics' && (
              <Suspense fallback={<TabFallback />}><VaultAnalyticsDashboard /></Suspense>
            )}
            {activeSection === 'referral-tracking' && (
              <Suspense fallback={<TabFallback />}><ReferralTrackingTab /></Suspense>
            )}
            {activeSection === 'user-visits' && (
              <Suspense fallback={<TabFallback />}><UserVisitsTab /></Suspense>
            )}
          </SectionErrorBoundary>
        </main>
      </div>
    </MainLayout>
  )
}
