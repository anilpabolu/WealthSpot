import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  Trash2,
  Download,
  Plus,
  ShieldCheck,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, Toggle, Badge, EmptyState } from '@/components/ui'
import { useUser } from '@clerk/react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useReferralStats, useReferralHistory } from '@/hooks/useReferrals'
import {
  useKycStatus,
  useKycDocuments,
  useBankDetails,
  useCreateBankDetail,
  useDeleteBankDetail,
  useDeleteKycDocument,
  useKycDetails,
  useSubmitKycDetails,
  useUploadKycDocument,
  useSubmitKycForReview,
  type BankDetailCreate,
} from '@/hooks/useKycBank'
import { useNotificationPreferences, useUpdateNotificationPreferences, type NotificationPreferences } from '@/hooks/useNotificationPrefs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { panSchema } from '@/lib/validators'

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
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const validTabs = TABS.map((t) => t.id)
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'profile'
  )

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) setActiveTab(tabParam)
  }, [tabParam])

  return (
    <MainLayout>
      {/* Hero section */}
      <div className="page-hero bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Settings</span>
          <h1 className="page-hero-title">Mission Control</h1>
          <p className="page-hero-subtitle">Manage your profile, security, and preferences — everything in one place.</p>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-container">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <nav className="lg:w-56 shrink-0">
              <div className="card overflow-hidden">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200',
                        activeTab === tab.id
                          ? 'bg-primary/5 text-primary font-semibold border-l-4 border-primary'
                          : 'text-gray-600 hover:bg-stone-50'
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
    <div className="card p-6">
      <h2 className="section-title text-lg mb-6">Personal Information</h2>

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
          <input type="email" defaultValue={displayEmail} readOnly className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-stone-50 text-gray-500 cursor-not-allowed outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" defaultValue={displayPhone} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <input type="text" defaultValue={profile?.role ?? '—'} readOnly className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-stone-50 text-gray-500 cursor-not-allowed outline-none capitalize" />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="btn-primary text-sm px-6">Save Changes</button>
      </div>
    </div>
  )
}

const NOTIFICATION_SETTINGS: { key: keyof NotificationPreferences; label: string; desc: string }[] = [
  { key: 'investmentConfirmations', label: 'Investment confirmations', desc: 'When your investment is confirmed' },
  { key: 'rentalIncome', label: 'Rental income', desc: 'When rental income is disbursed' },
  { key: 'propertyUpdates', label: 'Property updates', desc: 'Updates from properties you invested in' },
  { key: 'newProperties', label: 'New properties', desc: 'When new properties are listed' },
  { key: 'communityActivity', label: 'Community activity', desc: 'Replies to your posts and mentions' },
  { key: 'marketingEmails', label: 'Marketing emails', desc: 'Promotions and newsletters' },
]

function NotificationsTab() {
  const { data: prefs, isLoading } = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return
    updatePrefs.mutate({ [key]: !prefs[key] })
  }

  return (
    <div className="card p-6">
      <h2 className="section-title text-lg mb-6">Notification Preferences</h2>
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {NOTIFICATION_SETTINGS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
              <Toggle
                  checked={prefs?.[s.key] ?? false}
                  onChange={() => handleToggle(s.key)}
                />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="section-title text-lg mb-4">Change Password</h2>
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

      <div className="card p-6">
        <h2 className="section-title text-lg mb-2">Two-Factor Authentication</h2>
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
  const { data: banks, isLoading, refetch } = useBankDetails()
  const createBank = useCreateBankDetail()
  const deleteBank = useDeleteBankDetail()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BankDetailCreate>({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'savings',
  })

  const handleCreate = async () => {
    if (!form.accountHolderName || !form.accountNumber || !form.ifscCode || !form.bankName) return
    await createBank.mutateAsync(form)
    await refetch()
    setShowForm(false)
    setForm({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '', accountType: 'savings' })
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title text-lg">Bank Accounts</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Account
        </button>
      </div>

      {/* Security reassurance */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600">
          <strong>100% Secure.</strong> All bank details are encrypted end-to-end using AES-256 military-grade
          encryption. Your account numbers are never stored in plain text. Only you can see your full details.
        </p>
      </div>

      {showForm && (
        <div className="border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Add New Bank Account</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Holder Name</label>
              <input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="Full name as per bank" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
              <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="Enter account number" maxLength={18} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
              <input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} className="w-full px-3 py-2 text-sm font-mono uppercase border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="HDFC0001234" maxLength={11} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="HDFC Bank" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branch Name (Optional)</label>
              <input value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="Branch name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Type</label>
              <Select value={form.accountType ?? 'savings'} onChange={(v) => setForm({ ...form, accountType: v })} options={[
                { value: 'savings', label: 'Savings' },
                { value: 'current', label: 'Current' },
              ]} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
            <button onClick={handleCreate} disabled={createBank.isPending} className="btn-primary text-sm px-4 py-2">
              {createBank.isPending ? 'Saving…' : 'Save Account'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && (!banks || banks.length === 0) && !showForm && (
        <EmptyState icon={CreditCard} title="No Bank Accounts" message="Add one to receive payouts." />
      )}
      {!isLoading && banks && banks.length > 0 && (
        <div className="space-y-3">
          {banks.map((bank) => (
            <div key={bank.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{bank.bankName}</p>
                <p className="text-xs text-gray-500">
                  A/C: {bank.accountNumberMasked} | IFSC: {bank.ifscCode}
                </p>
                <p className="text-xs text-gray-400">{bank.accountHolderName} · {bank.accountType}</p>
              </div>
              <div className="flex items-center gap-2">
                {bank.isVerified && (
                  <Badge variant="success" size="sm">Verified</Badge>
                )}
                <button
                  onClick={() => { if (confirm('Delete this bank account?')) deleteBank.mutate(bank.id) }}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const KYC_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600', bg: 'bg-stone-50', border: 'border-gray-200', desc: 'Please complete KYC to start investing.' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Your KYC submission is being processed.' },
  under_review: { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Our team is reviewing your documents.' },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Your identity has been verified successfully.' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', desc: 'Your KYC was rejected. Please re-submit.' },
}

function KycTab() {
  const { data: kycStatus, isLoading } = useKycStatus()
  const rawStatus = kycStatus?.kycStatus?.toLowerCase() ?? 'not_started'
  const meta = KYC_STATUS_MAP[rawStatus] ?? KYC_STATUS_MAP['not_started']!
  const canSubmit = rawStatus === 'not_started' || rawStatus === 'rejected' || rawStatus === 'in_progress'
  const showDetails = rawStatus === 'under_review' || rawStatus === 'approved' || rawStatus === 'in_progress'
  const { data: kycDetails } = useKycDetails()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="card p-6">
        <h2 className="section-title text-lg mb-4">KYC Verification</h2>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : meta ? (
          <>
            <div className={`flex items-center gap-4 p-4 ${meta.bg} border ${meta.border} rounded-xl mb-6`}>
              <div className={`w-12 h-12 rounded-full ${meta.bg} flex items-center justify-center`}>
                <Shield className={`h-6 w-6 ${meta.color}`} />
              </div>
              <div>
                <p className={`font-semibold ${meta.color}`}>KYC {meta.label}</p>
                <p className={`text-sm ${meta.color} opacity-80`}>{kycStatus?.message || meta.desc}</p>
              </div>
            </div>
            {canSubmit && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Shield className="h-4 w-4" />
                {rawStatus === 'rejected' ? 'Re-submit KYC' : rawStatus === 'in_progress' ? 'Continue KYC' : 'Start KYC Verification'}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        ) : null}
      </div>

      {/* Read-only submitted details */}
      {showDetails && kycDetails?.fullName && !showForm && (
        <div className="card p-6">
          <h3 className="section-title text-lg mb-4">Submitted Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-gray-500">Full Name</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{kycDetails.fullName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">PAN Number</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{kycDetails.panNumberMasked ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Date of Birth</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{kycDetails.dateOfBirth ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">City</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{kycDetails.city ?? '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Address</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{kycDetails.address ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Pincode</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{kycDetails.pincode ?? '—'}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Inline KYC form */}
      {canSubmit && showForm && (
        <KycInlineForm onComplete={() => setShowForm(false)} />
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────── */
/*  Inline KYC Wizard (embedded in Settings KYC tab)     */
/* ────────────────────────────────────────────────────── */

const kycFormSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  panNumber: panSchema,
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(10, 'Full address is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
})

type KycFormData = z.infer<typeof kycFormSchema>

const KYC_STEPS = [
  { num: 1, label: 'Personal Details', icon: User },
  { num: 2, label: 'Document Upload', icon: FileText },
  { num: 3, label: 'Selfie Verification', icon: Camera },
]

function KycStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {KYC_STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              currentStep > step.num
                ? 'bg-emerald-500 text-white'
                : currentStep === step.num
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-400',
            )}
          >
            {currentStep > step.num ? <CheckCircle2 className="h-4 w-4" /> : step.num}
          </div>
          <span className={cn('text-sm font-medium hidden sm:block', currentStep >= step.num ? 'text-gray-900' : 'text-gray-400')}>
            {step.label}
          </span>
          {i < KYC_STEPS.length - 1 && (
            <div className={cn('w-8 h-0.5 mx-2', currentStep > step.num ? 'bg-emerald-500' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

function KycFileUpload({
  label,
  description,
  file,
  onFileChange,
  accept,
}: {
  label: string
  description: string
  file: File | null
  onFileChange: (f: File | null) => void
  accept: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
          file ? 'border-emerald-400 bg-green-50' : 'border-gray-200 hover:border-primary/30',
        )}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = accept
          input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0]
            if (f) onFileChange(f)
          }
          input.click()
        }}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">{description}</p>
            <p className="text-xs text-gray-400 mt-1">Max 5 MB · JPG, PNG, or PDF</p>
          </>
        )}
      </div>
    </div>
  )
}

function KycInlineForm({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [panFile, setPanFile] = useState<File | null>(null)
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const submitDetails = useSubmitKycDetails()
  const uploadDoc = useUploadKycDocument()
  const submitForReview = useSubmitKycForReview()

  const {
    register,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<KycFormData>({ resolver: zodResolver(kycFormSchema) })

  const handleStep1Next = async () => {
    const valid = await trigger(['fullName', 'panNumber', 'dateOfBirth', 'address', 'city', 'pincode'])
    if (!valid) return
    try {
      await submitDetails.mutateAsync(getValues())
      setStep(2)
    } catch { /* handled by mutation */ }
  }

  const handleStep2Next = () => {
    if (!panFile || !aadhaarFile) return
    setStep(3)
  }

  const handleFinalSubmit = async () => {
    if (!selfieFile || !panFile || !aadhaarFile) return
    setSubmitting(true)
    try {
      setUploadProgress('Uploading PAN card…')
      await uploadDoc.mutateAsync({ documentType: 'PAN', file: panFile })
      setUploadProgress('Uploading Aadhaar card…')
      await uploadDoc.mutateAsync({ documentType: 'AADHAAR', file: aadhaarFile })
      setUploadProgress('Uploading selfie…')
      await uploadDoc.mutateAsync({ documentType: 'SELFIE', file: selfieFile })
      setUploadProgress('Submitting for review…')
      await submitForReview.mutateAsync()
      setStep(4)
    } catch {
      setUploadProgress('')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 4) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="section-title text-xl mb-2">KYC Submitted Successfully!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your documents are being reviewed. This usually takes 24-48 hours.
          We'll notify you via email and SMS once approved.
        </p>
        <button onClick={onComplete} className="btn-primary inline-flex items-center gap-2">
          Done
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <KycStepIndicator currentStep={step} />

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <div className="space-y-5">
          <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name (as per PAN)</label>
              <input {...register('fullName')} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Enter your full name" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">PAN Number</label>
              <input {...register('panNumber')} className="w-full px-3 py-2.5 text-sm font-mono uppercase border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="ABCDE1234F" maxLength={10} />
              {errors.panNumber && <p className="text-xs text-red-500 mt-1">{errors.panNumber.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date of Birth</label>
              <input type="date" {...register('dateOfBirth')} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Address</label>
              <textarea {...register('address')} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" placeholder="House no., Street, Area" />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                <input {...register('city')} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="City" />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Pincode</label>
                <input {...register('pincode')} className="w-full px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="560001" maxLength={6} />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
              </div>
            </div>
          </div>
          <button onClick={handleStep1Next} disabled={submitDetails.isPending} className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {submitDetails.isPending ? 'Saving…' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Document Upload */}
      {step === 2 && (
        <div className="space-y-5">
          <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Upload
          </h3>
          <div className="space-y-4">
            <KycFileUpload label="PAN Card" description="Upload a clear photo of your PAN card" file={panFile} onFileChange={setPanFile} accept="image/*,.pdf" />
            <KycFileUpload label="Aadhaar Card" description="Upload front side of your Aadhaar card" file={aadhaarFile} onFileChange={setAadhaarFile} accept="image/*,.pdf" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              <strong>Your data is safe.</strong> All documents are encrypted end-to-end using AES-256
              encryption and stored in a secure vault.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3 inline-flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={handleStep2Next} disabled={!panFile || !aadhaarFile} className="btn-primary flex-1 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Selfie Verification */}
      {step === 3 && (
        <div className="space-y-5">
          <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Selfie Verification
          </h3>
          <p className="text-sm text-gray-600">
            Take a clear selfie to match with your PAN card photo. Ensure good lighting and your face is clearly visible.
          </p>
          <KycFileUpload label="Selfie Photo" description="Upload a clear selfie or take one with your camera" file={selfieFile} onFileChange={setSelfieFile} accept="image/*" />
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-ghost flex-1 py-3 inline-flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={handleFinalSubmit} disabled={!selfieFile || submitting} className="btn-primary flex-1 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? (
                <>{uploadProgress || 'Submitting…'}</>
              ) : (
                <>Submit for Review <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentsTab() {
  const { data: docs, isLoading } = useKycDocuments()
  const deleteDoc = useDeleteKycDocument()

  return (
    <div className="card p-6">
      <h2 className="section-title text-lg mb-6">Uploaded Documents</h2>
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && (!docs || docs.length === 0) && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        </div>
      )}
      {!isLoading && docs && docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc) => {
            const vs = doc.verificationStatus?.toLowerCase()
            const isVerified = vs === 'approved' || vs === 'verified'
            const isPending = vs === 'pending'
            return (
              <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-stone-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {doc.originalFilename || 'Document'} · {doc.fileSizeBytes ? `${(doc.fileSizeBytes / 1024).toFixed(0)} KB` : ''} · Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  {doc.rejectionReason && (
                    <p className="text-xs text-red-500 mt-0.5">Rejection: {doc.rejectionReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={isVerified ? 'success' : isPending ? 'warning' : 'danger'} size="sm">
                    {isVerified ? 'Verified' : isPending ? 'Pending' : doc.verificationStatus}
                  </Badge>
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-primary transition"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  {!isVerified && (
                    <button
                      onClick={() => { if (confirm('Delete this document?')) deleteDoc.mutate(doc.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
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
      <div className="card p-6">
        <h2 className="section-title text-lg mb-4 flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Your Referral Code</h2>
        {statsLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 font-mono text-2xl font-bold text-primary tracking-widest bg-primary/5 px-5 py-3 rounded-xl text-center">
                {code}
              </div>
              <button onClick={handleCopy} className="p-3 rounded-xl border border-gray-200 hover:bg-stone-50 transition-colors">
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
                <div key={m.label} className="text-center bg-stone-50 rounded-xl py-3 px-2">
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
      <div className="card p-6">
        <h2 className="section-title text-lg mb-4">Referral History</h2>
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

