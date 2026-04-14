/**
 * PersonaSelectionModal — non-dismissable modal shown when a signed-in user
 * hasn't selected a persona yet. Clean single-select with SVG icons.
 */

import { useState } from 'react'
import { apiPost } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

const PERSONAS = [
  {
    id: 'investor' as const,
    title: 'Investor',
    subtitle: 'Grow your wealth through premium real estate',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="22" width="8" height="18" rx="1" className="fill-emerald-100 dark:fill-emerald-900/40 stroke-emerald-600 dark:stroke-emerald-400" />
        <rect x="20" y="14" width="8" height="26" rx="1" className="fill-emerald-200 dark:fill-emerald-800/40 stroke-emerald-600 dark:stroke-emerald-400" />
        <rect x="34" y="8" width="8" height="32" rx="1" className="fill-emerald-300 dark:fill-emerald-700/40 stroke-emerald-600 dark:stroke-emerald-400" />
        <path d="M6 44h36" className="stroke-emerald-600 dark:stroke-emerald-400" />
      </svg>
    ),
  },
  {
    id: 'builder' as const,
    title: 'Builder',
    subtitle: 'List properties and connect with investors',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6L4 20h40L24 6Z" className="fill-amber-100 dark:fill-amber-900/40 stroke-amber-600 dark:stroke-amber-400" />
        <rect x="8" y="20" width="32" height="22" rx="1" className="fill-amber-50 dark:fill-amber-950/30 stroke-amber-600 dark:stroke-amber-400" />
        <rect x="18" y="28" width="12" height="14" rx="1" className="fill-amber-200 dark:fill-amber-800/40 stroke-amber-600 dark:stroke-amber-400" />
        <circle cx="24" cy="14" r="2" className="fill-amber-400 stroke-amber-600 dark:stroke-amber-400" />
      </svg>
    ),
    notice: 'Builder access requires admin approval. You can explore the dashboard while verification is in progress.',
  },
]

type PersonaId = 'investor' | 'builder'

export default function PersonaSelectionModal() {
  const { user, setUser } = useUserStore()
  const [selected, setSelected] = useState<PersonaId | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await apiPost<{
        roles: string[]
        primaryRole: string
        personaSelectedAt: string
        builderApproved: boolean
      }>('/auth/select-persona', {
        roles: [selected],
        primary_role: selected,
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Select your persona"
    >
      <div className="max-w-md w-full mx-4 bg-theme-card rounded-2xl shadow-2xl border border-theme overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] shadow-lg shadow-[#D4AF37]/20 mb-4">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h2 className="text-xl font-display font-bold text-theme-primary">
            How will you use WealthSpot?
          </h2>
          <p className="mt-1 text-sm text-theme-secondary">
            Pick your primary role. You can add more later.
          </p>
        </div>

        {/* Persona Options */}
        <div className="px-6 pb-2 space-y-3">
          {PERSONAS.map((persona) => {
            const isActive = selected === persona.id
            return (
              <button
                key={persona.id}
                onClick={() => setSelected(persona.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                  isActive
                    ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-md shadow-[#D4AF37]/10'
                    : 'border-transparent bg-theme-surface hover:bg-theme-surface-hover'
                }`}
              >
                <div className="shrink-0">{persona.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-theme-primary">{persona.title}</p>
                  <p className="text-xs text-theme-secondary mt-0.5">{persona.subtitle}</p>
                </div>
                <div className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isActive ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-theme-secondary/30'
                }`}>
                  {isActive && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Builder notice */}
        {selected === 'builder' && (
          <div className="mx-6 mt-1 mb-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
            Builder access requires admin approval. You can explore the dashboard while verification is in progress.
          </div>
        )}

        {error && (
          <div className="mx-6 mt-1 mb-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="px-6 pb-6 pt-3">
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:shadow-lg hover:shadow-[#D4AF37]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            {submitting ? 'Setting up…' : selected ? `Continue as ${selected.charAt(0).toUpperCase() + selected.slice(1)}` : 'Select a persona'}
          </button>
        </div>
      </div>
    </div>
  )
}
