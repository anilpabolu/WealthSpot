/**
 * PersonaSelectionPage — multi-select persona cards shown after Clerk signup.
 * User picks 1–4 personas, sets a primary, then proceeds to onboarding video.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'
import { useContent } from '@/hooks/useSiteContent'
import AppShell from '@/components/AppShell'

const PERSONAS = [
  {
    id: 'investor',
    title: 'Investor',
    icon: '💰',
    description: 'Invest in premium real estate opportunities with fractional ownership.',
    color: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'builder',
    title: 'Builder',
    icon: '🏗️',
    description: 'List properties, manage projects, and connect with investors.',
    color: 'from-blue-500 to-indigo-600',
  },
] as const

type PersonaId = (typeof PERSONAS)[number]['id']

export default function PersonaSelectionPage() {
  const navigate = useNavigate()
  const { user, setUser } = useUserStore()
  const [selected, setSelected] = useState<Set<PersonaId>>(new Set(['investor']))
  const [primary, setPrimary] = useState<PersonaId>('investor')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If persona already selected, redirect to vaults
  useEffect(() => {
    if (user?.personaSelectedAt) {
      navigate('/vaults', { replace: true })
    }
  }, [user?.personaSelectedAt, navigate])

  // CMS content
  const pageTitle = useContent('persona', 'title', 'Choose Your Persona')
  const pageSubtitle = useContent('persona', 'subtitle', 'Select how you want to use WealthSpot. You can always add more later.')
  const investorTitle = useContent('persona', 'investor_title', 'Investor')
  const investorDesc = useContent('persona', 'investor_desc', 'Invest in premium real estate opportunities with fractional ownership.')
  const builderTitle = useContent('persona', 'builder_title', 'Builder')
  const builderDesc = useContent('persona', 'builder_desc', 'List properties, manage projects, and connect with investors.')
  const builderNotice = useContent('persona', 'builder_notice', 'Note: Builder access requires verification. You\'ll be able to explore the builder dashboard immediately, but creating opportunities will be enabled after admin approval.')

  const cmsOverrides: Record<string, { title: string; description: string }> = {
    investor: { title: investorTitle, description: investorDesc },
    builder: { title: builderTitle, description: builderDesc },
  }

  const toggle = (id: PersonaId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (primary === id && next.size > 0) {
          setPrimary([...next][0]!)
        }
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await apiPost<{
        roles: string[]
        primaryRole: string
        personaSelectedAt: string
        builderApproved: boolean
      }>('/auth/select-persona', {
        roles: [...selected],
        primary_role: primary,
      })

      if (user) {
        setUser({
          ...user,
          roles: res.roles,
          primaryRole: res.primaryRole,
          personaSelectedAt: res.personaSelectedAt,
          builderApproved: res.builderApproved,
        })
      }

      navigate('/onboarding')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to save persona selection. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="min-h-screen flex items-center justify-center bg-theme-base px-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-theme-primary">
              {pageTitle}
            </h1>
            <p className="text-theme-secondary font-body">
              {pageSubtitle}
            </p>
          </div>

          {/* Persona Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERSONAS.map((persona) => {
              const isSelected = selected.has(persona.id)
              const isPrimary = primary === persona.id
              return (
                <button
                  key={persona.id}
                  onClick={() => toggle(persona.id)}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-lg shadow-[#D4AF37]/10'
                      : 'border-theme-secondary/20 bg-theme-card hover:border-theme-secondary/40'
                  }`}
                >
                  {/* Primary badge */}
                  {isSelected && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPrimary(persona.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setPrimary(persona.id)
                        }
                      }}
                      className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                        isPrimary
                          ? 'bg-[#D4AF37] text-white'
                          : 'bg-theme-secondary/10 text-theme-secondary hover:bg-[#D4AF37]/20'
                      }`}
                    >
                      {isPrimary ? '★ Primary' : 'Set primary'}
                    </span>
                  )}

                  <span className="text-4xl">{persona.icon}</span>
                  <h3 className="mt-3 text-lg font-display font-bold text-theme-primary">
                    {cmsOverrides[persona.id]?.title ?? persona.title}
                  </h3>
                  <p className="mt-1 text-sm text-theme-secondary font-body">
                    {cmsOverrides[persona.id]?.description ?? persona.description}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Builder notice */}
          {selected.has('builder') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
              {builderNotice}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0 || submitting}
            className="w-full py-3 px-6 rounded-xl font-display font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:shadow-lg hover:shadow-[#D4AF37]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Saving…' : `Continue as ${[...selected].join(' & ')}`}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
