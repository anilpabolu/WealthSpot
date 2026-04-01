import { lazy, Suspense, useEffect, useRef } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/ProtectedRoute'
import DiagnosticPanel, { diagLog } from '@/components/DiagnosticPanel'
import { useBackendSync, useNotRegistered } from '@/hooks/useBackendSync'

// Lazy-loaded route components
const Landing = lazy(() => import('@/pages/LandingPage'))
const Marketplace = lazy(() => import('@/pages/MarketplacePage'))
const PropertyDetail = lazy(() => import('@/pages/PropertyDetailPage'))
const InvestorDashboard = lazy(() => import('@/pages/InvestorDashboardPage'))
const InvestorPortfolio = lazy(() => import('@/pages/InvestorPortfolioPage'))
const BuilderDashboard = lazy(() => import('@/pages/BuilderDashboardPage'))
const BuilderListings = lazy(() => import('@/pages/BuilderListingsPage'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboardPage'))
const AdminUsers = lazy(() => import('@/pages/AdminUsersPage'))
const LenderDashboard = lazy(() => import('@/pages/LenderDashboardPage'))
const KycIdentity = lazy(() => import('@/pages/KycIdentityPage'))
const Onboarding = lazy(() => import('@/pages/OnboardingPage'))
const Vaults = lazy(() => import('@/pages/VaultsPage'))
const Community = lazy(() => import('@/pages/CommunityPage'))
const Referral = lazy(() => import('@/pages/ReferralPage'))
const Settings = lazy(() => import('@/pages/SettingsPage'))
const Approvals = lazy(() => import('@/pages/ApprovalsPage'))
const CommandControl = lazy(() => import('@/pages/CommandControlPage'))
const NotFound = lazy(() => import('@/pages/NotFoundPage'))
const Portfolio = lazy(() => import('@/pages/PortfolioPage'))
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        {/* Branded logo mark */}
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse">
            <svg viewBox="0 0 40 40" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 5L35 15V30L20 35L5 30V15L20 5Z" />
              <path d="M13 20L18 25L27 16" />
            </svg>
          </div>
        </div>
        <span className="font-display text-lg font-bold text-gray-900">
          Wealth<span className="text-primary">Spot</span>
        </span>
        <p className="text-sm text-gray-400 font-body animate-pulse">{message}</p>
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
  // first-timers → onboarding video, returning → vaults.
  // If the user is already on a deep link (e.g. /settings, /marketplace), stay there.
  useEffect(() => {
    if (!isLoaded || !user || redirectedRef.current) return
    if (location.pathname !== '/') return          // don't redirect deep links
    const onboarded = localStorage.getItem('ws_onboarded')
    redirectedRef.current = true
    if (onboarded !== 'true') {
      localStorage.setItem('ws_onboarded', 'false')
      navigate('/onboarding')
    } else {
      navigate('/vaults')
    }
  }, [isLoaded, user, navigate, location.pathname])

  return (
    <ErrorBoundary>
      <NotRegisteredBanner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:slug" element={<PropertyDetail />} />
          <Route path="/opportunity/:slug" element={<OpportunityDetail />} />
          <Route path="/builder/:id" element={<BuilderProfile />} />

          {/* Investor portal */}
          <Route path="/portal/investor" element={<ProtectedRoute><InvestorDashboard /></ProtectedRoute>} />
          <Route path="/portal/investor/portfolio" element={<ProtectedRoute><InvestorPortfolio /></ProtectedRoute>} />
          <Route path="/portal/investor/lender" element={<ProtectedRoute><LenderDashboard /></ProtectedRoute>} />

          {/* Builder portal */}
          <Route path="/portal/builder" element={<ProtectedRoute><BuilderDashboard /></ProtectedRoute>} />
          <Route path="/portal/builder/listings" element={<ProtectedRoute><BuilderListings /></ProtectedRoute>} />

          {/* Admin portal */}
          <Route path="/portal/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/portal/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/portal/admin/referrals" element={<ProtectedRoute><AdminReferrals /></ProtectedRoute>} />

          {/* Auth */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/vaults" element={<ProtectedRoute><Vaults /></ProtectedRoute>} />
          <Route path="/auth/kyc/identity" element={<ProtectedRoute><KycIdentity /></ProtectedRoute>} />

          {/* Community & Referral */}
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/community/answer" element={<ProtectedRoute><AnswerQuestions /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />

          {/* Approvals & Command Control */}
          <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
          <Route path="/control-centre" element={<ProtectedRoute><CommandControl /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Profile completion */}
          <Route path="/profile/complete" element={<ProtectedRoute><ProfileCompletion /></ProtectedRoute>} />

          {/* Portfolio */}
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />

          {/* Contribute pillar pages */}
          <Route path="/contribute/wealth" element={<ProtectedRoute><ContributeWealth /></ProtectedRoute>} />
          <Route path="/contribute/time" element={<ProtectedRoute><ContributeTime /></ProtectedRoute>} />
          <Route path="/contribute/network" element={<ProtectedRoute><ContributeNetwork /></ProtectedRoute>} />
          <Route path="/contribute/education" element={<ProtectedRoute><ContributeEducation /></ProtectedRoute>} />

          {/* Company onboarding */}
          <Route path="/company-onboarding" element={<ProtectedRoute><CompanyOnboarding /></ProtectedRoute>} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <DiagnosticPanel />
    </ErrorBoundary>
  )
}
