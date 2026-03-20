import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import { useProfileCompletion, type ProfileField } from '@/hooks/useProfileCompletion'
import {
  CheckCircle2,
  XCircle,
  User,
  Shield,
  Settings,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTION_META: Record<string, { icon: typeof User; color: string; route: string; description: string }> = {
  'Personal Info': {
    icon: User,
    color: 'text-blue-600 bg-blue-50',
    route: '/settings',
    description: 'Your basic personal details — name, phone, and photo.',
  },
  'KYC Verification': {
    icon: Shield,
    color: 'text-amber-600 bg-amber-50',
    route: '/auth/kyc/identity',
    description: 'Identity documents required for investing on the platform.',
  },
  Account: {
    icon: Settings,
    color: 'text-purple-600 bg-purple-50',
    route: '/settings',
    description: 'Account settings and referral details.',
  },
}

function SectionCard({ section, fields }: { section: string; fields: ProfileField[] }) {
  const meta = SECTION_META[section] ?? { icon: Settings, color: 'text-gray-600 bg-gray-50', route: '/settings', description: '' }
  const Icon = meta.icon
  const completed = fields.filter((f) => f.completed).length
  const total = fields.length
  const pct = Math.round((completed / total) * 100)
  const allDone = completed === total

  return (
    <div className={cn('border rounded-xl p-5 transition-colors', allDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white')}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', meta.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{section}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
          </div>
        </div>
        <span className={cn('text-xs font-bold px-2 py-1 rounded-full', allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600')}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-500', allDone ? 'bg-emerald-500' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Field checklist */}
      <ul className="space-y-2">
        {fields.map((field) => (
          <li key={field.key} className="flex items-center gap-2 text-sm">
            {field.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className={field.completed ? 'text-gray-600' : 'text-gray-900 font-medium'}>
              {field.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Action link */}
      {!allDone && (
        <Link
          to={meta.route}
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition"
        >
          Complete this section
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

export default function ProfileCompletionPage() {
  const { percentage, fields, isComplete, isLoading } = useProfileCompletion()

  // Group by section
  const sections = useMemo(() => {
    const map: Record<string, ProfileField[]> = {}
    for (const f of fields) {
      ;(map[f.section] ??= []).push(f)
    }
    return Object.entries(map)
  }, [fields])

  const ringColor = isComplete ? 'border-emerald-500' : 'border-red-400'
  const glowStyle = isComplete
    ? '0 0 20px 4px rgba(52,211,153,0.4)'
    : '0 0 20px 4px rgba(248,113,113,0.4)'

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          to="/vaults"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vaults
        </Link>

        {/* Header with ring indicator */}
        <div className="text-center mb-10">
          {/* Percentage circle */}
          <div className="flex justify-center mb-5">
            <div
              className={cn('h-28 w-28 rounded-full border-4 flex items-center justify-center transition-all', ringColor)}
              style={{ boxShadow: glowStyle }}
            >
              {isLoading ? (
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className={cn('font-display text-3xl font-bold', isComplete ? 'text-emerald-600' : 'text-gray-900')}>
                  {percentage}%
                </span>
              )}
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-gray-900">
            {isComplete ? 'Profile Complete! 🎉' : 'Complete Your Profile'}
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {isComplete
              ? 'You\'re all set. Your profile is fully verified and ready to go.'
              : 'Fill in the missing sections below to unlock the full WealthSpot experience.'}
          </p>
        </div>

        {/* Section cards */}
        <div className="grid gap-6">
          {sections.map(([section, sectionFields]) => (
            <SectionCard key={section} section={section} fields={sectionFields} />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
