import { lazy, Suspense, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/ProtectedRoute'
import DiagnosticPanel, { diagLog } from '@/components/DiagnosticPanel'
import { useBackendSync, useNotRegistered } from '@/hooks/useBackendSync'
import { useThemeStore } from '@/stores/theme.store'
import { useUserStore } from '@/stores/user.store'
import { useAppearanceConfig, usePublicNotificationsConfig } from '@/hooks/useControlCentre'
import { applyThemePalette } from '@/lib/colorUtils'
import PersonaSelectionModal from '@/components/PersonaSelectionModal'
import { ToastRibbon } from '@/components/ToastRibbon'
import { useToastStore } from '@/stores/toastStore'
import WLogo3D from '@/components/ui/WLogo3D'

// Lazy-loaded route components
const Landing = lazy(() => import('@/pages/LandingPage'))
const Marketplace = lazy(() => import('@/pages/MarketplacePage'))
const PropertyDetail = lazy(() => import('@/pages/PropertyDetailPage'))
const InvestorDashboard = lazy(() => import('@/pages/InvestorDashboardPage'))
const InvestorPortfolio = lazy(() => import('@/pages/InvestorPortfolioPage'))
const BuilderDashboard = lazy(() => import('@/pages/BuilderDashboardPage'))
const BuilderListings = lazy(() => import('@/pages/BuilderListingsPage'))
const BuilderListingNew = lazy(() => import('@/pages/BuilderListingNewPage'))
const BuilderListingDetail = lazy(() => import('@/pages/BuilderListingDetailPage'))
const BuilderListingEdit = lazy(() => import('@/pages/BuilderListingEditPage'))
const BuilderInvestors = lazy(() => import('@/pages/BuilderInvestorsPage'))
const BuilderDocuments = lazy(() => import('@/pages/BuilderDocumentsPage'))
const BuilderAnalytics = lazy(() => import('@/pages/BuilderAnalyticsPage'))
const BuilderSettings = lazy(() => import('@/pages/BuilderSettingsPage'))
const BuilderHelp = lazy(() => import('@/pages/BuilderHelpPage'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboardPage'))
const AdminUsers = lazy(() => import('@/pages/AdminUsersPage'))
const LenderDashboard = lazy(() => import('@/pages/LenderDashboardPage'))
const KycIdentity = lazy(() => import('@/pages/KycIdentityPage'))
const Onboarding = lazy(() => import('@/pages/OnboardingPage'))
const Vaults = lazy(() => import('@/pages/VaultsPage'))
const Community = lazy(() => import('@/pages/CommunityPage'))
const Referral = lazy(() => import('@/pages/ReferralPage'))
const Settings = lazy(() => import('@/pages/SettingsPage'))
const CommandControl = lazy(() => import('@/pages/CommandControlPage'))
const NotFound = lazy(() => import('@/pages/NotFoundPage'))
const Portfolio = lazy(() => import('@/pages/PortfolioPage'))
const PropertyPortfolioDetail = lazy(() => import('@/pages/PropertyPortfolioDetailPage'))
const ContributeWealth = lazy(() => import('@/pages/ContributeWealthPage'))
const ContributeTime = lazy(() => import('@/pages/ContributeTimePage'))
const ContributeNetwork = lazy(() => import('@/pages/ContributeNetworkPage'))
const ContributeEducation = lazy(() => import('@/pages/ContributeEducationPage'))
const CompanyOnboarding = lazy(() => import('@/pages/CompanyOnboardingPage'))
const AnswerQuestions = lazy(() => import('@/pages/AnswerQuestionsPage'))
const BuilderProfile = lazy(() => import('@/pages/BuilderProfilePage'))
const ProfileCompletion = lazy(() => import('@/pages/ProfileCompletionPage'))
const OpportunityDetail = lazy(() => import('@/pages/OpportunityDetailPage'))
const AdminReferrals = lazy(() => import('@/pages/AdminReferralsPage'))
const VaultProfiling = lazy(() => import('@/pages/VaultProfilingPage'))
const VaultAnalytics = lazy(() => import('@/pages/VaultAnalyticsDashboard'))
const InviteAccept = lazy(() => import('@/pages/InviteAcceptPage'))

const LOADING_MESSAGES = [
  'Curating premium opportunities…',
  'Preparing your portfolio view…',
  'Unlocking institutional-grade assets…',
  'Building your wealth dashboard…',
  'Fetching the latest market data…',
]

function PageLoader() {
  const message = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none">

      {/* Dark radial vignette — deep at centre, fades to transparent at edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(8,13,26,0.95) 0%, rgba(8,13,26,0.82) 35%, rgba(8,13,26,0.48) 60%, rgba(8,13,26,0.10) 85%, transparent 100%)',
        }}
      />

      {/* Top gold progress sweep bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <div
          className="absolute inset-y-0 animate-[loader-bar_1.8s_ease-in-out_infinite]"
          style={{
            width: '35%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.55) 30%, #F5E09A 50%, rgba(212,175,55,0.55) 70%, transparent 100%)',
          }}
        />
      </div>

      {/* Centre content */}
      <div className="relative z-10 flex flex-col items-center gap-7">

        {/* Logo + ring system */}
        <div className="relative flex items-center justify-center" style={{ width: 192, height: 192 }}>

          {/* Three staggered expanding ripple rings */}
          {[0, 0.9, 1.8].map((delay, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-[#D4AF37]/30 animate-[loader-gold-ripple_2.8s_ease-out_infinite]"
              style={{ width: 192, height: 192, animationDelay: `${delay}s` }}
            />
          ))}

          {/* Outer dashed counter-rotating ring */}
          <div
            className="absolute rounded-full animate-[loader-gold-ring_3.2s_linear_infinite_reverse]"
            style={{
              width: 118,
              height: 118,
              border: '1px dashed rgba(212,175,55,0.30)',
            }}
          />

          {/* Inner fast spinning arc */}
          <div
            className="absolute rounded-full animate-[loader-gold-ring_1.35s_linear_infinite]"
            style={{
              width: 98,
              height: 98,
              border: '1.5px solid transparent',
              borderTopColor: '#D4AF37',
              borderRightColor: 'rgba(212,175,55,0.50)',
            }}
          />

          {/* Radial gold glow orb */}
          <div
            className="absolute rounded-full animate-[pulse-glow_2.2s_ease-in-out_infinite]"
            style={{
              width: 76,
              height: 76,
              background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 75%)',
            }}
          />

          {/* Logo */}
          <WLogo3D size={66} />

          {/* Six orbital gold dot particles */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const r = 56
            return (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  background: '#D4AF37',
                  left: `calc(50% + ${Math.cos(rad) * r}px - 1.5px)`,
                  top: `calc(50% + ${Math.sin(rad) * r}px - 1.5px)`,
                  animation: 'logo-fade 2.2s ease-in-out infinite',
                  animationDelay: `${i * 0.37}s`,
                  opacity: 0.75,
                }}
              />
            )
          })}
        </div>

        {/* Brand name + rotating message */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="font-display text-base font-bold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            Wealth<span style={{ color: '#D4AF37' }}>Spot</span>
          </span>
          <p
            className="text-xs font-body animate-[logo-fade_2.5s_ease-in-out_infinite]"
            style={{ color: 'rgba(255,255,255,0.48)' }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

function NotRegisteredBanner() {
  const { notRegistered, email, clear } = useNotRegistered()
  if (!notRegistered) return null
  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-center gap-3 text-sm">
      <span className="text-amber-800">
        <strong>{email}</strong> is not registered on WealthSpot yet.
        Click <strong>"Get Started"</strong> to sign up on the platform.
      </span>
      <button onClick={clear} className="text-amber-600 hover:text-amber-800 font-bold ml-2">✕</button>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  const redirectedRef = useRef(false)

  // Force light theme always
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  useEffect(() => {
    setTheme('light')
    document.documentElement.classList.remove('dark')
  }, [setTheme])

  // Apply admin-configured light mode background color
  const { data: appearance } = useAppearanceConfig()
  useEffect(() => {
    const color = appearance?.lightModeBgColor || '#FDFBF5'
    if (theme !== 'dark') {
      applyThemePalette(color)
    }
  }, [appearance, theme])

  // Sync toast dismiss interval from DB config
  const { data: notifConfig } = usePublicNotificationsConfig()
  const setDismissInterval = useToastStore((s) => s.setDismissInterval)
  useEffect(() => {
    const ms = notifConfig?.toastIntervalMs
    if (typeof ms === 'number' && !isNaN(ms) && ms >= 1000) {
      setDismissInterval(ms)
    }
  }, [notifConfig, setDismissInterval])

  // Capture ?ref=CODE from URL and stash in localStorage for post-signup apply
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const refCode = params.get('ref')
    if (refCode) {
      localStorage.setItem('ws_referral_code', refCode.toUpperCase())
    }
    const prefCode = params.get('pref')
    if (prefCode) {
      localStorage.setItem('ws_property_referral_code', prefCode.toUpperCase())
    }
  }, [location.search])

  // Bridge Clerk auth → backend user store (role, JWT, profile)
  useBackendSync()

  useEffect(() => {
    diagLog('nav', 'info', `Route \u2192 ${location.pathname}`)
  }, [location.pathname])

  // Redirect signed-in users on the landing page only:
  // No persona yet → persona selection, first-timers → onboarding video, returning → vaults.
  const wsUser = useUserStore((s) => s.user)
  useEffect(() => {
    if (!isLoaded || !user || redirectedRef.current) return
    if (location.pathname !== '/') return          // don't redirect deep links
    redirectedRef.current = true

    const onboarded = localStorage.getItem('ws_onboarded')
    if (onboarded !== 'true') {
      localStorage.setItem('ws_onboarded', 'false')
      navigate('/onboarding')
    } else if (wsUser?.primaryRole === 'builder') {
      navigate('/portal/builder/listings')
    } else {
      navigate('/vaults')
    }
  }, [isLoaded, user, wsUser, navigate, location.pathname])

  return (
    <ErrorBoundary>
      <NotRegisteredBanner />
      <ToastRibbon />
      {wsUser &&
        !wsUser.personaSelectedAt &&
        !['admin', 'super_admin'].includes(wsUser.primaryRole) &&
        <PersonaSelectionModal />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:slug" element={<PropertyDetail />} />
          <Route path="/opportunity/:slug" element={<OpportunityDetail />} />
          <Route path="/builder/listings" element={<Navigate to="/portal/builder/listings" replace />} />
          <Route path="/builder/:id" element={<BuilderProfile />} />

          {/* Investor portal */}
          <Route path="/portal/investor" element={<ProtectedRoute><InvestorDashboard /></ProtectedRoute>} />
          <Route path="/portal/investor/portfolio" element={<ProtectedRoute><InvestorPortfolio /></ProtectedRoute>} />
          <Route path="/portal/investor/lender" element={<ProtectedRoute><LenderDashboard /></ProtectedRoute>} />

          {/* Builder portal */}
          <Route path="/portal/builder" element={<ProtectedRoute><BuilderDashboard /></ProtectedRoute>} />
          <Route path="/portal/builder/listings" element={<ProtectedRoute><BuilderListings /></ProtectedRoute>} />
          <Route path="/portal/builder/listings/new" element={<ProtectedRoute><BuilderListingNew /></ProtectedRoute>} />
          <Route path="/portal/builder/listings/:id" element={<ProtectedRoute><BuilderListingDetail /></ProtectedRoute>} />
          <Route path="/portal/builder/listings/:id/edit" element={<ProtectedRoute><BuilderListingEdit /></ProtectedRoute>} />
          <Route path="/portal/builder/investors" element={<ProtectedRoute><BuilderInvestors /></ProtectedRoute>} />
          <Route path="/portal/builder/documents" element={<ProtectedRoute><BuilderDocuments /></ProtectedRoute>} />
          <Route path="/portal/builder/analytics" element={<ProtectedRoute><BuilderAnalytics /></ProtectedRoute>} />
          <Route path="/portal/builder/settings" element={<ProtectedRoute><BuilderSettings /></ProtectedRoute>} />
          <Route path="/portal/builder/help" element={<ProtectedRoute><BuilderHelp /></ProtectedRoute>} />

          {/* Admin portal */}
          <Route path="/portal/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/portal/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/portal/admin/referrals" element={<ProtectedRoute><AdminReferrals /></ProtectedRoute>} />

          {/* Auth & Persona */}
          <Route path="/invite/:token" element={<ProtectedRoute><InviteAccept /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/vaults" element={<ProtectedRoute><Vaults /></ProtectedRoute>} />
          <Route path="/auth/kyc/identity" element={<ProtectedRoute><KycIdentity /></ProtectedRoute>} />

          {/* Community & Referral */}
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/community/answer" element={<ProtectedRoute><AnswerQuestions /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />

          {/* Approvals & Command Control */}
          <Route path="/approvals" element={<Navigate to="/control-centre?section=approvals" replace />} />
          <Route path="/control-centre" element={<ProtectedRoute><CommandControl /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Profile completion */}
          <Route path="/profile/complete" element={<ProtectedRoute><ProfileCompletion /></ProtectedRoute>} />

          {/* Portfolio */}
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/portfolio/property/:propertyId" element={<ProtectedRoute><PropertyPortfolioDetail /></ProtectedRoute>} />

          {/* Contribute pillar pages */}
          <Route path="/contribute/wealth" element={<ProtectedRoute><ContributeWealth /></ProtectedRoute>} />
          <Route path="/contribute/time" element={<ProtectedRoute><ContributeTime /></ProtectedRoute>} />
          <Route path="/contribute/network" element={<ProtectedRoute><ContributeNetwork /></ProtectedRoute>} />
          <Route path="/contribute/education" element={<ProtectedRoute><ContributeEducation /></ProtectedRoute>} />

          {/* Company onboarding */}
          <Route path="/company-onboarding" element={<ProtectedRoute><CompanyOnboarding /></ProtectedRoute>} />

          {/* Vault Profiling & Analytics */}
          <Route path="/vault-profiling" element={<ProtectedRoute><VaultProfiling /></ProtectedRoute>} />
          <Route path="/vault-analytics" element={<ProtectedRoute><VaultAnalytics /></ProtectedRoute>} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <DiagnosticPanel />
    </ErrorBoundary>
  )
}
