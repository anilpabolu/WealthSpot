import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Copy, Share2, Users, IndianRupee, Check, ChevronRight } from 'lucide-react'
import { EmptyState, Badge } from '@/components/ui'
import { formatINR } from '@/lib/formatters'
import { useReferralStats, useReferralHistory } from '@/hooks/useReferrals'

const STEPS = [
  { step: 1, title: 'Share Your Code', desc: 'Send your unique referral code to friends and family.' },
  { step: 2, title: 'Friend Signs Up', desc: 'They create an account using your referral link.' },
  { step: 3, title: 'Both Earn ₹250', desc: 'When they make their first investment, you both get rewarded.' },
]

export default function ReferralPage() {
  const [copied, setCopied] = useState(false)
  const { data: stats, isLoading: statsLoading } = useReferralStats()
  const { data: history, isLoading: histLoading } = useReferralHistory()

  const referralCode = stats?.referralCode ?? '—'
  const referralLink = stats?.referralLink ?? `${window.location.origin}/signup?ref=${referralCode}`

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = encodeURIComponent(
    `Join WealthSpot and start investing in premium real estate! Use my referral code ${referralCode}: ${referralLink}`
  )

  const totalReferred = stats?.totalReferrals ?? 0
  const investedCount = stats?.successfulReferrals ?? 0
  const totalEarned = stats?.totalRewards ?? 0

  return (
    <MainLayout>
      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Referrals</span>
          <h1 className="page-hero-title">The Referral Hustle</h1>
          <p className="page-hero-subtitle">Spread the word, stack the rewards. When your friend invests, you both pocket ₹250. Easy money.</p>
        </div>
      </section>

      <div className="page-section">
        <div className="page-section-container max-w-4xl mx-auto">

        {/* Referral Code Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white mb-8">
          <p className="text-sm text-white/70 mb-2">Your Referral Code</p>
          {statsLoading ? (
            <p className="text-white/50 text-sm">Loading…</p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-2xl font-bold tracking-wider">{referralCode}</span>
                <button
                  onClick={() => handleCopy(referralCode)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mb-5">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 text-sm bg-white/10 rounded-lg px-3 py-2 text-white/90 outline-none"
                />
                <button
                  onClick={() => handleCopy(referralLink)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-white/90 transition"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>

              {/* Social share buttons */}
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
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
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
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Referred', value: totalReferred, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Invested', value: investedCount, icon: Check, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Earned', value: formatINR(totalEarned / 100, 0), icon: IndianRupee, color: 'text-primary bg-primary/10' },
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
          <h2 className="section-title text-lg">How It Works</h2>
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
            <h2 className="section-title text-lg">Referral History</h2>
          </div>
          {histLoading && <p className="px-6 py-4 text-sm text-gray-400">Loading…</p>}
          {!histLoading && (!history || history.length === 0) && (
            <div className="px-6 py-4">
              <EmptyState icon={Users} title="No Referrals Yet" message="Your referral scoreboard is empty — time to rally the squad!" />
            </div>
          )}
          {!histLoading && history && history.length > 0 && (
            <div className="divide-y divide-gray-50">
              {history.map((ref) => (
                <div key={ref.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(ref.refereeName[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{ref.refereeName}</p>
                    <p className="text-xs text-gray-400">{new Date(ref.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge
                    variant={ref.status === 'invested' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {ref.status === 'invested' ? 'Invested' : 'Signed Up'}
                  </Badge>
                  {ref.rewardAmount > 0 && (
                    <span className="text-sm font-bold text-primary">+{formatINR(ref.rewardAmount / 100, 0)}</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </MainLayout>
  )
}

