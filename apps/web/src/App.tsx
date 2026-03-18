import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'

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
const Login = lazy(() => import('@/pages/LoginPage'))
const Signup = lazy(() => import('@/pages/SignupPage'))
const Community = lazy(() => import('@/pages/CommunityPage'))
const Referral = lazy(() => import('@/pages/ReferralPage'))
const Settings = lazy(() => import('@/pages/SettingsPage'))
const NotFound = lazy(() => import('@/pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-body">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:slug" element={<PropertyDetail />} />

          {/* Investor portal */}
          <Route path="/portal/investor" element={<InvestorDashboard />} />
          <Route path="/portal/investor/portfolio" element={<InvestorPortfolio />} />
          <Route path="/portal/investor/lender" element={<LenderDashboard />} />

          {/* Builder portal */}
          <Route path="/portal/builder" element={<BuilderDashboard />} />
          <Route path="/portal/builder/listings" element={<BuilderListings />} />

          {/* Admin portal */}
          <Route path="/portal/admin" element={<AdminDashboard />} />
          <Route path="/portal/admin/users" element={<AdminUsers />} />

          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/kyc/identity" element={<KycIdentity />} />

          {/* Community & Referral */}
          <Route path="/community" element={<Community />} />
          <Route path="/referral" element={<Referral />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
