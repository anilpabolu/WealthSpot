import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Gift, Copy, Share2, Users, IndianRupee, Check, ChevronRight } from 'lucide-react'
import { formatINR } from '@/lib/formatters'

const REFERRAL_CODE = 'WEALTH2024'
const REFERRAL_LINK = `https://wealthspot.in/signup?ref=${REFERRAL_CODE}`

const REFERRALS_MOCK = [
  { name: 'Priya S.', status: 'invested', reward: 250, date: '2024-01-15' },
  { name: 'Amit K.', status: 'signed_up', reward: 0, date: '2024-01-18' },
  { name: 'Sneha R.', status: 'invested', reward: 250, date: '2024-02-02' },
]

const STEPS = [
  { step: 1, title: 'Share Your Code', desc: 'Send your unique referral code to friends and family.' },
  { step: 2, title: 'Friend Signs Up', desc: 'They create an account using your referral link.' },
  { step: 3, title: 'Both Earn ₹250', desc: 'When they make their first investment, you both get rewarded.' },
]

export default function ReferralPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalReferred = REFERRALS_MOCK.length
  const investedCount = REFERRALS_MOCK.filter((r) => r.status === 'invested').length
  const totalEarned = REFERRALS_MOCK.reduce((sum, r) => sum + r.reward, 0)

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Refer & Earn ₹250
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Invite friends to WealthSpot. When they make their first investment,
            both of you earn ₹250 in rewards.
          </p>
        </div>

        {/* Referral Code Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white mb-8">
          <p className="text-sm text-white/70 mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-2xl font-bold tracking-wider">{REFERRAL_CODE}</span>
            <button
              onClick={() => handleCopy(REFERRAL_CODE)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={REFERRAL_LINK}
              className="flex-1 text-sm bg-white/10 rounded-lg px-3 py-2 text-white/90 outline-none"
            />
            <button
              onClick={() => handleCopy(REFERRAL_LINK)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-white/90 transition"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Referred', value: totalReferred, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Invested', value: investedCount, icon: Check, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Earned', value: formatINR(totalEarned, 0), icon: IndianRupee, color: 'text-primary bg-primary/10' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* How it Works */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-display text-lg font-bold text-gray-900">Referral History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {REFERRALS_MOCK.map((ref, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {ref.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{ref.name}</p>
                  <p className="text-xs text-gray-400">{ref.date}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    ref.status === 'invested'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {ref.status === 'invested' ? 'Invested' : 'Signed Up'}
                </span>
                {ref.reward > 0 && (
                  <span className="text-sm font-bold text-primary">+{formatINR(ref.reward, 0)}</span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
