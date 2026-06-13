import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/ProtectedRoute'
import DiagnosticPanel, { diagLog } from '@/components/DiagnosticPanel'
import { useBackendSync, useNotRegistered } from '@/hooks/useBackendSync'
import { useFavicon } from '@/hooks/useFavicon'
import { useThemeStore } from '@/stores/theme.store'
import { useUserStore } from '@/stores/user.store'
import { useAppearanceConfig, usePublicNotificationsConfig } from '@/hooks/useControlCentre'
import { applyThemePalette } from '@/lib/colorUtils'

import { ToastRibbon } from '@/components/ToastRibbon'
import { useToastStore } from '@/stores/toastStore'
import SplashScreen from './components/SplashScreen'
import { GlobalConsentGate } from '@/components/consent/GlobalConsentGate'

// Lazy-loaded route components
const Landing = lazy(() => import('@/pages/LandingPage'))
const Marketplace = lazy(() => import('@/pages/MarketplacePage'))
const PropertyDetail = lazy(() => import('@/pages/PropertyDetailPage'))
const InvestorDashboard = lazy(() => import('@/pages/InvestorDashboardPage'))
const InvestorPortfolio = lazy(() => import('@/pages/InvestorPortfolioPage'))
const BuilderDashboard = lazy(() => import('@/pages/BuilderDashboardPage'))
const BuilderListings = lazy(() => import('@/pages/BuilderListingsPage'))
const BuilderListingDetail = lazy(() => import('@/pages/BuilderListingDetailPage'))
const BuilderInvestors = lazy(() => import('@/pages/BuilderInvestorsPage'))
const BuilderDocuments = lazy(() => import('@/pages/BuilderDocumentsPage'))
const BuilderAnalytics = lazy(() => import('@/pages/BuilderAnalyticsPage'))
const BuilderSettings = lazy(() => import('@/pages/BuilderSettingsPage'))
const BuilderHelp = lazy(() => import('@/pages/BuilderHelpPage'))

const TermsOfUse = lazy(() => import('@/pages/legal/TermsOfUsePage'))
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicyPage'))
const RiskDisclosure = lazy(() => import('@/pages/legal/RiskDisclosurePage'))
const LegalDisclaimer = lazy(() => import('@/pages/legal/LegalDisclaimerPage'))

const AdminDashboard = lazy(() => import('@/pages/AdminDashboardPage'))
const AdminUsers = lazy(() => import('@/pages/AdminUsersPage'))
const LenderDashboard = lazy(() => import('@/pages/LenderDashboardPage'))
const KycIdentity = lazy(() => import('@/pages/KycIdentityPage'))
const Onboarding = lazy(() => import('@/pages/OnboardingPage'))
const Vaults = lazy(() => import('@/pages/VaultsPage'))
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
const BuilderProfile = lazy(() => import('@/pages/BuilderProfilePage'))
const ProfileCompletion = lazy(() => import('@/pages/ProfileCompletionPage'))
const OpportunityDetail = lazy(() => import('@/pages/OpportunityDetailPage'))
const AdminReferrals = lazy(() => import('@/pages/AdminReferralsPage'))
const VaultProfiling = lazy(() => import('@/pages/VaultProfilingPage'))
const CreateOpportunity = lazy(() => import('@/pages/CreateOpportunityPage'))
const VaultAnalytics = lazy(() => import('@/pages/VaultAnalyticsDashboard'))
const InviteAccept = lazy(() => import('@/pages/InviteAcceptPage'))
const About = lazy(() => import('@/pages/AboutPage'))
const HowWeWork = lazy(() => import('@/pages/HowWeWorkPage'))
const IntrinsicValuePage = lazy(() => import('@/pages/IntrinsicValuePage'))
const KnowledgeHubPage = lazy(() => import('@/pages/KnowledgeHubPage'))

function PageLoader() {
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-50 overflow-hidden bg-[var(--border-subtle,rgba(229,221,196,0.5))]">
      <div
        className="absolute h-full animate-[loader-bar_1.6s_ease-in-out_infinite]"
        style={{
          width: '40%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.5) 30%, #D4AF37 50%, rgba(212,175,55,0.5) 70%, transparent 100%)',
        }}
      />
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
  const [showBootSplash, setShowBootSplash] = useState(true)
  const [bootSplashExiting, setBootSplashExiting] = useState(false)

  useEffect(() => {
    const startExitTimer = window.setTimeout(() => {
      setBootSplashExiting(true)
    }, 1400)
    const unmountTimer = window.setTimeout(() => {
      setShowBootSplash(false)
    }, 1800)

    return () => {
      window.clearTimeout(startExitTimer)
      window.clearTimeout(unmountTimer)
    }
  }, [])

  useFavicon()

  // Force light theme always
  const theme = useThemeStore((s) => s.theme)

  // Apply admin-configured light mode background color
  const { data: appearance } = useAppearanceConfig()
  useEffect(() => {
    if (showBootSplash) return
    const color = appearance?.lightModeBgColor || '#ffffff'
    if (theme !== 'dark') {
      applyThemePalette(color)
    }
  }, [appearance, showBootSplash, theme])

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
      {showBootSplash && <SplashScreen exiting={bootSplashExiting} />}
      <NotRegisteredBanner />
      <ToastRibbon />

      <GlobalConsentGate>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-we-work" element={<HowWeWork />} />
          <Route path="/insights/intrinsic-value" element={<IntrinsicValuePage />} />
          <Route path="/knowledge-hub" element={<KnowledgeHubPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:slug" element={<PropertyDetail />} />
          <Route path="/opportunity/:slug" element={<OpportunityDetail />} />
          <Route path="/builder/listings" element={<Navigate to="/portal/builder/listings" replace />} />
          <Route path="/builder/:id" element={<BuilderProfile />} />
          <Route path="/community" element={<Navigate to="/vaults" replace />} />
          <Route path="/community/answer" element={<Navigate to="/control-centre" replace />} />

          {/* Investor portal */}
          <Route path="/portal/investor" element={<ProtectedRoute><InvestorDashboard /></ProtectedRoute>} />
          <Route path="/portal/investor/portfolio" element={<ProtectedRoute><InvestorPortfolio /></ProtectedRoute>} />
          <Route path="/portal/investor/lender" element={<ProtectedRoute><LenderDashboard /></ProtectedRoute>} />

          {/* Builder portal */}
          <Route path="/portal/builder" element={<ProtectedRoute><BuilderDashboard /></ProtectedRoute>} />
          <Route path="/portal/builder/listings" element={<ProtectedRoute><BuilderListings /></ProtectedRoute>} />
          <Route path="/portal/builder/listings/new" element={<ProtectedRoute><CreateOpportunity /></ProtectedRoute>} />
          <Route path="/portal/builder/listings/:id" element={<ProtectedRoute><BuilderListingDetail /></ProtectedRoute>} />
          <Route path="/portal/builder/listings/:id/edit" element={<ProtectedRoute><CreateOpportunity /></ProtectedRoute>} />
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
          <Route path="/create-opportunity" element={<ProtectedRoute><CreateOpportunity /></ProtectedRoute>} />
          <Route path="/auth/kyc/identity" element={<ProtectedRoute><KycIdentity /></ProtectedRoute>} />

          {/* Referral */}
          <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />

          {/* Approvals & Command Control */}
          <Route path="/approvals" element={<Navigate to="/control-centre?section=approvals" replace />} />
          <Route path="/control-centre" element={<ProtectedRoute><CommandControl /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="/legal/terms" element={<TermsOfUse />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/risk-disclosure" element={<RiskDisclosure />} />
          <Route path="/legal/disclaimer" element={<LegalDisclaimer />} />

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
      </GlobalConsentGate>
      <DiagnosticPanel />
    </ErrorBoundary>
  )
}
