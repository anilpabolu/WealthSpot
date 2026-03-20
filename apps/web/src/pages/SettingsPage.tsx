import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import {
  User,
  Bell,
  Lock,
  CreditCard,
  FileText,
  Shield,
  ChevronRight,
  Camera,
  LogOut,
  Gift,
  Copy,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useReferralStats, useReferralHistory } from '@/hooks/useReferrals'

type Tab = 'profile' | 'notifications' | 'security' | 'bank' | 'documents' | 'kyc' | 'referrals'

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'kyc', label: 'KYC Status', icon: Shield },
  { id: 'referrals', label: 'Referrals', icon: Gift },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Mission Control ⚙️</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <nav className="lg:w-56 shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-sm transition',
                      activeTab === tab.id
                        ? 'bg-primary/5 text-primary font-semibold border-l-2 border-primary'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'bank' && <BankTab />}
            {activeTab === 'documents' && <DocumentsTab />}
            {activeTab === 'kyc' && <KycTab />}
            {activeTab === 'referrals' && <ReferralsTab />}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

/* ── Tab Panels ── */

function ProfileTab() {
  const { user: clerkUser } = useUser()
  const { data: profile, isLoading } = useUserProfile()

  const displayName = profile?.fullName ?? clerkUser?.fullName ?? '—'
  const displayEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? profile?.email ?? '—'
  const displayPhone = profile?.phone ?? clerkUser?.primaryPhoneNumber?.phoneNumber ?? ''
  const displayInitial = (displayName[0] ?? 'U').toUpperCase()

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Personal Information</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {clerkUser?.imageUrl ? (
            <img src={clerkUser.imageUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {displayInitial}
            </div>
          )}
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{isLoading ? 'Loading…' : displayName}</p>
          <p className="text-sm text-gray-500">{displayEmail}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" defaultValue={displayName} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" defaultValue={displayEmail} readOnly className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" defaultValue={displayPhone} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <input type="text" defaultValue={profile?.role ?? '—'} readOnly className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none capitalize" />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="btn-primary text-sm px-6">Save Changes</button>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const settings = [
    { label: 'Investment confirmations', desc: 'When your investment is confirmed', default: true },
    { label: 'Rental income', desc: 'When rental income is disbursed', default: true },
    { label: 'Property updates', desc: 'Updates from properties you invested in', default: true },
    { label: 'New properties', desc: 'When new properties are listed', default: false },
    { label: 'Community activity', desc: 'Replies to your posts and mentions', default: false },
    { label: 'Marketing emails', desc: 'Promotions and newsletters', default: false },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Notification Preferences</h2>
      <div className="space-y-4">
        {settings.map((s) => (
          <div key={s.label} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={s.default} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <div className="space-y-3 max-w-sm">
          {['Current Password', 'New Password', 'Confirm New Password'].map((label) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
          ))}
          <button className="btn-primary text-sm px-6 mt-2">Update Password</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add an extra layer of security to your account.
        </p>
        <button className="btn-ghost text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Enable 2FA
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function BankTab() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Bank Account</h2>
      <p className="text-sm text-gray-500 mb-4">
        Linked bank account for rental income disbursement and withdrawals.
      </p>

      <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">HDFC Bank</p>
          <p className="text-xs text-gray-500">A/C: ••••••••4521 | IFSC: HDFC0001234</p>
        </div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          Verified
        </span>
      </div>

      <button className="btn-ghost text-sm flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        Change Bank Account
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

const KYC_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', desc: 'Please complete KYC to start investing.' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Your KYC submission is being processed.' },
  under_review: { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Our team is reviewing your documents.' },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Your identity has been verified successfully.' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', desc: 'Your KYC was rejected. Please re-submit.' },
}

function KycTab() {
  const { data: profile, isLoading } = useUserProfile()
  const rawStatus = profile?.kycStatus?.toLowerCase() ?? 'not_started'
  const meta = KYC_STATUS_MAP[rawStatus] ?? KYC_STATUS_MAP['not_started']!

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-4">KYC Verification</h2>
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : meta ? (
        <div className={`flex items-center gap-4 p-4 ${meta.bg} border ${meta.border} rounded-xl mb-6`}>
          <div className={`w-12 h-12 rounded-full ${meta.bg} flex items-center justify-center`}>
            <Shield className={`h-6 w-6 ${meta.color}`} />
          </div>
          <div>
            <p className={`font-semibold ${meta.color}`}>KYC {meta.label}</p>
            <p className={`text-sm ${meta.color} opacity-80`}>{meta.desc}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DocumentsTab() {
  const { data: profile, isLoading } = useUserProfile()
  const docs = profile?.kycDocuments ?? []

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Uploaded Documents</h2>
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && docs.length === 0 && (
        <p className="text-sm text-gray-400">Not Available — no documents uploaded yet.</p>
      )}
      {!isLoading && docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc) => {
            const vs = doc.verificationStatus?.toLowerCase()
            const isVerified = vs === 'approved' || vs === 'verified'
            return (
              <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', isVerified ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50')}>
                  {isVerified ? 'Verified' : doc.verificationStatus ?? 'Pending'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReferralsTab() {
  const { data: stats, isLoading: statsLoading } = useReferralStats()
  const { data: history, isLoading: histLoading } = useReferralHistory()
  const [copied, setCopied] = useState(false)

  const code = stats?.referralCode ?? '—'
  const link = stats?.referralLink ?? window.location.origin + '/signup?ref=' + code

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareText = encodeURIComponent(`Join WealthSpot and start investing in premium real estate! Use my referral code ${code}: ${link}`)

  return (
    <div className="space-y-5">
      {/* Code card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Your Referral Code</h2>
        {statsLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 font-mono text-2xl font-bold text-primary tracking-widest bg-primary/5 px-5 py-3 rounded-xl text-center">
                {code}
              </div>
              <button onClick={handleCopy} className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                {copied ? <CheckCheck className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5 text-gray-500" />}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Referrals', value: stats?.totalReferrals ?? 0 },
                { label: 'Successful', value: stats?.successfulReferrals ?? 0 },
                { label: 'Rewards', value: `₹${((stats?.totalRewards ?? 0) / 100).toLocaleString()}` },
              ].map((m) => (
                <div key={m.label} className="text-center bg-gray-50 rounded-xl py-3 px-2">
                  <p className="font-bold text-gray-900 text-lg">{m.value}</p>
                  <p className="text-xs text-gray-400">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Share buttons */}
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Share via</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 transition"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2] text-white text-sm font-semibold hover:opacity-90 transition"
              >
                LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-semibold hover:opacity-90 transition"
              >
                X / Twitter
              </a>
              <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition">
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Referral History</h2>
        {histLoading && <p className="text-sm text-gray-400">Loading…</p>}
        {!histLoading && (!history || history.length === 0) && (
          <p className="text-sm text-gray-400">No referrals yet. Share your code to get started!</p>
        )}
        {!histLoading && history && history.length > 0 && (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {(item.refereeName[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.refereeName}</p>
                  <p className="text-xs text-gray-400 truncate">{item.refereeEmail}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', item.status === 'invested' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50')}>
                    {item.status === 'invested' ? 'Invested' : 'Signed Up'}
                  </span>
                  {item.rewardAmount > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">+₹{(item.rewardAmount / 100).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

