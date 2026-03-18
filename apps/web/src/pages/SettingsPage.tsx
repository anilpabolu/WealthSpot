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
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'notifications' | 'security' | 'bank' | 'documents' | 'kyc'

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'kyc', label: 'KYC Status', icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Settings</h1>

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
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

/* ── Tab Panels ── */

function ProfileTab() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Personal Information</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
            R
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Rahul Mehta</p>
          <p className="text-sm text-gray-500">rahul@example.com</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Full Name', value: 'Rahul Mehta', type: 'text' },
          { label: 'Email', value: 'rahul@example.com', type: 'email' },
          { label: 'Phone', value: '+91 98765 43210', type: 'tel' },
          { label: 'City', value: 'Bengaluru', type: 'text' },
        ].map((field) => (
          <div key={field.label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type={field.type}
              defaultValue={field.value}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
        ))}
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

function DocumentsTab() {
  const docs = [
    { name: 'PAN Card', status: 'verified', date: '2024-01-10' },
    { name: 'Aadhaar Card', status: 'verified', date: '2024-01-10' },
    { name: 'Address Proof', status: 'pending', date: '2024-02-15' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Uploaded Documents</h2>
      <div className="space-y-3">
        {docs.map((doc) => (
          <div key={doc.name} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
              <p className="text-xs text-gray-400">Uploaded {doc.date}</p>
            </div>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded-full',
                doc.status === 'verified'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-amber-700 bg-amber-50'
              )}
            >
              {doc.status === 'verified' ? 'Verified' : 'Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KycTab() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-4">KYC Verification</h2>
      <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-emerald-800">KYC Approved</p>
          <p className="text-sm text-emerald-600">Your identity has been verified successfully.</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { step: 'Email Verification', status: 'done' },
          { step: 'Phone Verification', status: 'done' },
          { step: 'PAN Verification', status: 'done' },
          { step: 'Aadhaar Verification', status: 'done' },
          { step: 'Selfie Verification', status: 'done' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-3 py-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">{s.step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
