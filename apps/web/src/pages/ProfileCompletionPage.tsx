import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import {
  useFullProfile,
  useUpdateProfileSection,
  useSendOtp,
  useVerifyOtp,
  useProfileCompletionStatus,
  useUpdatePhone,
} from '@/hooks/useProfileAPI'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui'
import {
  User, Heart, MapPin, ShieldCheck,
  ChevronRight, ChevronLeft, Sparkles, Trophy, Rocket,
  Check, Copy, CheckCheck, ArrowLeft, Star, Gift,
  Mail, Phone,
} from 'lucide-react'

// ── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'About You', subtitle: 'Tell us who you are', icon: User, color: 'from-blue-500 to-indigo-600', emoji: '👤' },
  { id: 2, title: 'Interests', subtitle: 'What excites you?', icon: Heart, color: 'from-pink-500 to-rose-600', emoji: '💡' },
  { id: 3, title: 'Address', subtitle: 'Where are you based?', icon: MapPin, color: 'from-emerald-500 to-teal-600', emoji: '📍' },
  { id: 4, title: 'Verify', subtitle: 'Secure your account', icon: ShieldCheck, color: 'from-purple-500 to-violet-600', emoji: '🔒' },
] as const

// ── Chip selector ───────────────────────────────────────────────────────────

function ChipSelect({ options, selected, onChange, multiple = true }: {
  options: { value: string; label: string; icon?: string }[]
  selected: string[]
  onChange: (val: string[]) => void
  multiple?: boolean
}) {
  const toggle = (val: string) => {
    if (!multiple) { onChange([val]); return }
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => toggle(o.value)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200',
            selected.includes(o.value)
              ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20 scale-105'
              : 'border-theme bg-[var(--bg-surface)] text-theme-secondary hover:border-theme hover:bg-theme-surface'
          )}
        >
          {o.icon && <span>{o.icon}</span>}
          {o.label}
          {selected.includes(o.value) && <Check className="h-3.5 w-3.5" />}
        </button>
      ))}
    </div>
  )
}

// ── Option data ─────────────────────────────────────────────────────────────



const INTEREST_OPTIONS = [
  { value: 'residential', label: 'Residential', icon: '🏠' },
  { value: 'commercial', label: 'Commercial', icon: '🏢' },
  { value: 'co-working', label: 'Co-working', icon: '💼' },
  { value: 'warehousing', label: 'Warehousing', icon: '🏭' },
  { value: 'plots', label: 'Plots & Land', icon: '🌾' },
  { value: 'student-housing', label: 'Student Housing', icon: '🎓' },
  { value: 'senior-living', label: 'Senior Living', icon: '🏡' },
  { value: 'hospitality', label: 'Hospitality', icon: '🏨' },
]

const CITY_OPTIONS = [
  { value: 'Hyderabad', label: 'Hyderabad', icon: '🏛️' },
  { value: 'Bengaluru', label: 'Bengaluru', icon: '🌆' },
  { value: 'Mumbai', label: 'Mumbai', icon: '🌊' },
  { value: 'Delhi NCR', label: 'Delhi NCR', icon: '🏗️' },
  { value: 'Chennai', label: 'Chennai', icon: '🛕' },
  { value: 'Pune', label: 'Pune', icon: '🏔️' },
  { value: 'Goa', label: 'Goa', icon: '🏖️' },
  { value: 'Kolkata', label: 'Kolkata', icon: '🌉' },
]



const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: '♂️' },
  { value: 'female', label: 'Female', icon: '♀️' },
  { value: 'non-binary', label: 'Non-binary', icon: '⚧' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '🤫' },
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh',
]

// ── Step components ─────────────────────────────────────────────────────────

type StepProps = { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }

function Step1({ data, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <p className="text-theme-secondary text-sm">Let's start with the basics — this helps us personalize your experience 🎯</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-theme-primary mb-1.5">Full Name</label>
          <input type="text" value={(data.full_name as string) || ''} placeholder="e.g. Anil Kumar"
            onChange={e => onChange({ ...data, full_name: e.target.value })}
            className="w-full px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-theme-primary mb-1.5">Date of Birth</label>
          <input type="date" value={(data.date_of_birth as string) || ''}
            onChange={e => onChange({ ...data, date_of_birth: e.target.value })}
            className="w-full px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-theme-primary mb-2">Gender</label>
        <ChipSelect options={GENDER_OPTIONS} selected={data.gender ? [data.gender as string] : []} onChange={v => onChange({ ...data, gender: v[0] ?? null })} multiple={false} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-theme-primary mb-1.5">Occupation</label>
        <input type="text" value={(data.occupation as string) || ''} placeholder="e.g. Software Engineer, Business Owner"
          onChange={e => onChange({ ...data, occupation: e.target.value })}
          className="w-full px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
      </div>
    </div>
  )
}

function Step2({ data, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <p className="text-theme-secondary text-sm">Pick what gets you excited — we'll curate opportunities just for you ✨</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-theme-primary mb-2">🏗️ Asset Types I'm Interested In</label>
        <ChipSelect options={INTEREST_OPTIONS} selected={(data.interests as string[]) || []} onChange={v => onChange({ ...data, interests: v })} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-theme-primary mb-2">📍 Preferred Cities</label>
        <ChipSelect options={CITY_OPTIONS} selected={(data.preferred_cities as string[]) || []} onChange={v => onChange({ ...data, preferred_cities: v })} />
      </div>
    </div>
  )
}

function Step3({ data, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <p className="text-theme-secondary text-sm">We need your address for legal compliance and document delivery 🏠</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-theme-primary mb-1.5">Address Line 1</label>
        <input type="text" value={(data.address_line1 as string) || ''} placeholder="House/Flat No, Building Name"
          onChange={e => onChange({ ...data, address_line1: e.target.value })}
          className="w-full px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-theme-primary mb-1.5">Address Line 2 (optional)</label>
        <input type="text" value={(data.address_line2 as string) || ''} placeholder="Street, Locality"
          onChange={e => onChange({ ...data, address_line2: e.target.value })}
          className="w-full px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-theme-primary mb-1.5">City</label>
          <input type="text" value={(data.city as string) || ''} placeholder="e.g. Hyderabad"
            onChange={e => onChange({ ...data, city: e.target.value })}
            className="w-full px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-theme-primary mb-1.5">State</label>
          <Select value={(data.state as string) || ''}
            onChange={v => onChange({ ...data, state: v })}
            options={[
              { value: '', label: 'Select State' },
              ...INDIAN_STATES.map(s => ({ value: s, label: s })),
            ]}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-theme-primary mb-1.5">Pincode</label>
          <input type="text" value={(data.pincode as string) || ''} placeholder="e.g. 500001" maxLength={6}
            onChange={e => onChange({ ...data, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            className="w-full px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-theme-primary mb-1.5">Country</label>
          <input type="text" value={(data.country as string) || 'India'} readOnly
            className="w-full px-3 py-2.5 border border-theme rounded-xl bg-theme-surface text-theme-secondary" />
        </div>
      </div>
    </div>
  )
}

function Step4({ emailVerified, phoneVerified, email, phone }: {
  emailVerified: boolean; phoneVerified: boolean; email: string; phone: string | null
}) {
  const sendOtp = useSendOtp()
  const verifyOtp = useVerifyOtp()
  const updatePhone = useUpdatePhone()
  const [emailOtp, setEmailOtp] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [phoneSent, setPhoneSent] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)
  const [phoneCountdown, setPhoneCountdown] = useState(0)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(!!phone)
  const [emailDevHint, setEmailDevHint] = useState('')
  const [phoneDevHint, setPhoneDevHint] = useState('')

  useEffect(() => {
    if (emailCountdown <= 0) return
    const t = setTimeout(() => setEmailCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [emailCountdown])

  useEffect(() => {
    if (phoneCountdown <= 0) return
    const t = setTimeout(() => setPhoneCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phoneCountdown])

  // Update phoneSaved when phone prop changes (after mutation invalidation)
  useEffect(() => {
    if (phone) setPhoneSaved(true)
  }, [phone])

  const handleSendEmail = async () => {
    const res = await sendOtp.mutateAsync('email')
    setEmailSent(true)
    setEmailCountdown(60)
    if (res.devOtp) { setEmailOtp(res.devOtp); setEmailDevHint('Dev mode: OTP auto-filled') }
    else { setEmailDevHint('') }
  }
  const handleSendPhone = async () => {
    const res = await sendOtp.mutateAsync('phone')
    setPhoneSent(true)
    setPhoneCountdown(60)
    if (res.devOtp) { setPhoneOtp(res.devOtp); setPhoneDevHint('Dev mode: OTP auto-filled') }
    else { setPhoneDevHint('') }
  }
  const handleVerifyEmail = async () => { await verifyOtp.mutateAsync({ channel: 'email', otp: emailOtp }); setEmailOtp('') }
  const handleVerifyPhone = async () => { await verifyOtp.mutateAsync({ channel: 'phone', otp: phoneOtp }); setPhoneOtp('') }
  const handleSavePhone = async () => {
    const cleaned = phoneInput.replace(/\s/g, '')
    if (cleaned.length < 10) return
    await updatePhone.mutateAsync(cleaned)
    setPhoneSaved(true)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <p className="text-theme-secondary text-sm">One last step — verify your contact details to secure your account 🔐</p>
      </div>

      {/* Email Verification */}
      <div className={cn('border-2 rounded-2xl p-5 transition-all', emailVerified ? 'border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/30/50' : 'border-theme bg-[var(--bg-surface)]')}>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', emailVerified ? 'bg-emerald-100' : 'bg-blue-100')}>
            <Mail className={cn('h-5 w-5', emailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400')} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-theme-primary">Email Verification</h4>
            <p className="text-xs text-theme-secondary">{email}</p>
          </div>
          {emailVerified && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
        {!emailVerified && (
          <div className="space-y-3">
            {!emailSent ? (
              <button onClick={handleSendEmail} disabled={sendOtp.isPending}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {sendOtp.isPending ? 'Sending...' : '📧 Send Verification Code'}
              </button>
            ) : (
              <>
                <div className="flex gap-2">
                  <input type="text" value={emailOtp} maxLength={6} placeholder="Enter 6-digit OTP"
                    onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-3 py-2.5 border border-theme rounded-xl text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-blue-300 focus:border-blue-500" />
                  <button onClick={handleVerifyEmail} disabled={emailOtp.length !== 6 || verifyOtp.isPending}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                    {verifyOtp.isPending ? '...' : 'Verify'}
                  </button>
                </div>
                <button onClick={handleSendEmail} disabled={emailCountdown > 0 || sendOtp.isPending}
                  className="text-xs text-theme-secondary hover:text-primary disabled:opacity-50">
                  {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : 'Resend code'}
                </button>
                {emailDevHint && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1">{emailDevHint}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Phone Verification */}
      <div className={cn('border-2 rounded-2xl p-5 transition-all', phoneVerified ? 'border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/30/50' : 'border-theme bg-[var(--bg-surface)]')}>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', phoneVerified ? 'bg-emerald-100' : 'bg-purple-100')}>
            <Phone className={cn('h-5 w-5', phoneVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400')} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-theme-primary">Phone Verification</h4>
            <p className="text-xs text-theme-secondary">{phone || 'No phone number added yet'}</p>
          </div>
          {phoneVerified && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
        {!phoneVerified && (
          <div className="space-y-3">
            {!phoneSaved ? (
              <div className="space-y-2">
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-3 py-2">
                  📱 Add your mobile number to receive verification OTP
                </p>
                <div className="flex gap-2">
                  <input type="tel" value={phoneInput} placeholder="+91 9876543210"
                    onChange={e => setPhoneInput(e.target.value.replace(/[^\d+\s]/g, '').slice(0, 15))}
                    className="flex-1 px-3 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-500" />
                  <button onClick={handleSavePhone} disabled={phoneInput.replace(/\s/g, '').length < 10 || updatePhone.isPending}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                    {updatePhone.isPending ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : !phoneSent ? (
              <button onClick={handleSendPhone} disabled={sendOtp.isPending}
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                {sendOtp.isPending ? 'Sending...' : '📱 Send Verification Code'}
              </button>
            ) : (
              <>
                <div className="flex gap-2">
                  <input type="text" value={phoneOtp} maxLength={6} placeholder="Enter 6-digit OTP"
                    onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-3 py-2.5 border border-theme rounded-xl text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-purple-300 focus:border-purple-500" />
                  <button onClick={handleVerifyPhone} disabled={phoneOtp.length !== 6 || verifyOtp.isPending}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                    {verifyOtp.isPending ? '...' : 'Verify'}
                  </button>
                </div>
                <button onClick={handleSendPhone} disabled={phoneCountdown > 0 || sendOtp.isPending}
                  className="text-xs text-theme-secondary hover:text-primary disabled:opacity-50">
                  {phoneCountdown > 0 ? `Resend in ${phoneCountdown}s` : 'Resend code'}
                </button>
                {phoneDevHint && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1">{phoneDevHint}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Celebration screen ──────────────────────────────────────────────────────

function CelebrationScreen({ referralCode }: { referralCode: string | null }) {
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const referralLink = referralCode ? `${window.location.origin}/invite/${referralCode}` : ''

  const handleCopy = useCallback(() => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [referralLink])

  return (
    <div className="text-center py-8 space-y-6">
      <div className="relative inline-block">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto shadow-xl shadow-amber-300/40 animate-bounce">
          <Trophy className="h-12 w-12 text-white" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-amber-400 animate-pulse" />
        <Star className="absolute -bottom-1 -left-3 h-6 w-6 text-yellow-500 animate-pulse" />
      </div>

      <div>
        <h2 className="font-display text-3xl font-bold text-theme-primary">You're 100% Verified! 🎉</h2>
        <p className="text-theme-secondary mt-2 max-w-sm mx-auto">Welcome to the WealthSpot community. Your profile is fully complete and verified.</p>
      </div>

      <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700/40 rounded-full px-6 py-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <span className="font-bold text-emerald-700 dark:text-emerald-300">Fully Verified Investor</span>
      </div>

      {referralCode && (
        <div className="bg-gradient-to-r from-primary/5 to-purple-50 border-2 border-primary/20 rounded-2xl p-6 max-w-sm mx-auto">
          <div className="flex items-center gap-2 justify-center mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-theme-primary">Your Referral Code</h3>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-xl px-4 py-3 font-mono text-2xl font-bold text-primary tracking-wider border border-primary/20 mb-3">
            {referralCode}
          </div>
          <button onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition">
            {copied ? <><CheckCheck className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Referral Link</>}
          </button>
          <p className="text-xs text-theme-secondary mt-2">Share with friends and earn rewards</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <button onClick={() => navigate('/vaults')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition flex items-center gap-2 justify-center">
          <Rocket className="h-4 w-4" /> Explore Opportunities
        </button>
        <button onClick={() => navigate('/settings')}
          className="px-6 py-3 border-2 border-theme text-theme-primary rounded-xl font-semibold hover:bg-theme-surface transition">
          View Settings
        </button>
      </div>
    </div>
  )
}

// ── Main Page (Wizard) ──────────────────────────────────────────────────────

export default function ProfileCompletionPage() {
  const { data: profile, isLoading: profileLoading } = useFullProfile()
  const { data: completion, isLoading: completionLoading } = useProfileCompletionStatus()
  const updateS1 = useUpdateProfileSection(1)
  const updateS2 = useUpdateProfileSection(2)
  const updateS3 = useUpdateProfileSection(4)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [showCelebration, setShowCelebration] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Populate form data from profile once loaded
  useEffect(() => {
    if (!profile) return
    setFormData({
      full_name: profile.fullName,
      date_of_birth: profile.dateOfBirth,
      gender: profile.gender,
      occupation: profile.occupation,
      interests: profile.interests,
      preferred_cities: profile.preferredCities,
      address_line1: profile.addressLine1,
      address_line2: profile.addressLine2,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
      country: profile.country || 'India',
    })
  }, [profile])

  // Show celebration if already 100%
  useEffect(() => {
    if (completion?.isComplete) setShowCelebration(true)
  }, [completion?.isComplete])

  const isLoading = profileLoading || completionLoading
  const isSaving = updateS1.isPending || updateS2.isPending || updateS3.isPending
  const currentStep = STEPS[step - 1]

  const saveCurrentStep = useCallback(async () => {
    const handlers = [updateS1, updateS2, updateS3]
    if (step <= 3) {
      await handlers[step - 1]!.mutateAsync(formData)
    }
  }, [step, formData, updateS1, updateS2, updateS3])

  const handleNext = useCallback(async () => {
    if (step <= 3) await saveCurrentStep()
    if (step < 4) {
      setStep(s => s + 1)
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step, saveCurrentStep])

  const handlePrev = useCallback(() => {
    if (step > 1) {
      setStep(s => s - 1)
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step])

  const handleFinish = useCallback(() => {
    setShowCelebration(true)
  }, [])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-theme-secondary animate-pulse">Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (showCelebration) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <CelebrationScreen referralCode={completion?.referralCode ?? profile?.referralCode ?? null} />
        </div>
      </MainLayout>
    )
  }

  const pct = completion?.profileCompletionPct ?? 0

  return (
    <MainLayout>
      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">{pct}% Complete</span>
          <h1 className="page-hero-title">Complete Your Profile</h1>
          <p className="page-hero-subtitle">Unlock premium features, personalized recommendations & your unique referral code</p>
        </div>
      </section>

      <div className="page-section">
        <div className="page-section-container max-w-3xl mx-auto">
        {/* Back link */}
        <Link to="/vaults" className="inline-flex items-center gap-1.5 text-sm text-theme-tertiary hover:text-theme-secondary mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => {
              const SIcon = s.icon
              const isCurrent = step === s.id
              const isDone = completion?.sections && Object.values(completion.sections)[i]
              return (
                <button key={s.id} onClick={() => { if (s.id <= step) setStep(s.id) }}
                  className={cn('flex flex-col items-center gap-1 transition-all group', s.id <= step ? 'opacity-100' : 'opacity-40')}>
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center transition-all text-white bg-gradient-to-br',
                    isCurrent ? `${s.color} shadow-lg scale-110` : isDone ? 'from-emerald-400 to-emerald-600' : 'from-gray-300 to-gray-400',
                  )}>
                    {isDone && !isCurrent ? <Check className="h-5 w-5" /> : <SIcon className="h-5 w-5" />}
                  </div>
                  <span className={cn('text-[10px] font-semibold hidden sm:block', isCurrent ? 'text-theme-primary' : 'text-theme-tertiary')}>
                    {s.title}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="h-1.5 bg-theme-surface-hover rounded-full overflow-hidden -mt-1">
            <div className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Step content card */}
        <div className="bg-[var(--bg-surface)] border border-theme rounded-2xl shadow-sm overflow-hidden">
          {currentStep && (
            <div className={cn('bg-gradient-to-r px-6 py-4 text-white', currentStep.color)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentStep.emoji}</span>
                <div>
                  <h2 className="font-display text-lg font-bold">{currentStep.title}</h2>
                  <p className="text-white/80 text-sm">{currentStep.subtitle}</p>
                </div>
                <div className="ml-auto text-sm font-semibold bg-white/20 rounded-full px-3 py-1">
                  Step {step}/{STEPS.length}
                </div>
              </div>
            </div>
          )}

          <div ref={contentRef} className="p-6 max-h-[60vh] overflow-y-auto">
            {step === 1 && <Step1 data={formData} onChange={setFormData} />}
            {step === 2 && <Step2 data={formData} onChange={setFormData} />}
            {step === 3 && <Step3 data={formData} onChange={setFormData} />}
            {step === 4 && profile && (
              <Step4
                emailVerified={completion?.emailVerified ?? false}
                phoneVerified={completion?.phoneVerified ?? false}
                email={profile.email}
                phone={profile.phone}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="border-t border-theme px-6 py-4 flex items-center justify-between bg-theme-surface/50">
            <button onClick={handlePrev} disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-theme-secondary hover:text-theme-primary disabled:opacity-30 transition">
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {step < 4 ? (
              <button onClick={handleNext} disabled={isSaving}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition shadow-sm shadow-primary/20 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save & Continue'} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={!completion?.emailVerified || !completion?.phoneVerified}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm shadow-emerald-200 disabled:opacity-50">
                <ShieldCheck className="h-4 w-4" />
                {completion?.emailVerified && completion?.phoneVerified ? 'Complete Profile 🎉' : 'Verify to Continue'}
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </MainLayout>
  )
}
