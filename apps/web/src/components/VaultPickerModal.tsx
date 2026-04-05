/**
 * VaultPickerModal — Lets users pick a vault to view their DNA or start profiling.
 *
 * Flow:
 *  1. User clicks "Discover Your DNA" → modal opens showing 3 vault cards
 *  2. User picks a vault:
 *     - If DNA profiling is complete → navigate to result page
 *     - If profiling incomplete → show graceful message with CTA to start/continue profiling
 *     - If vault is "coming soon" (opportunity) → disabled state
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Building2, Rocket, Users, X, Sparkles, Lock, ArrowRight } from 'lucide-react'
import { useOverallProgress } from '@/hooks/useProfiling'
import type { VaultProgressDetail } from '@/hooks/useProfiling'

interface VaultPickerModalProps {
  open: boolean
  onClose: () => void
}

const VAULT_OPTIONS = [
  {
    id: 'wealth' as const,
    title: 'Wealth Vault',
    icon: Building2,
    gradient: 'from-[#1B2A4A] via-[#2D3F5E] to-[#1B2A4A]',
    accent: 'text-[#D4AF37]',
    bg: 'bg-[#F5F0E1]',
    border: 'border-[#D4AF37]/30',
    emoji: '🏛️',
    comingSoon: false,
  },
  {
    id: 'opportunity' as const,
    title: 'Opportunity Vault',
    icon: Rocket,
    gradient: 'from-[#FF6B6B] via-[#FF8E8E] to-[#CC4848]',
    accent: 'text-[#FF6B6B]',
    bg: 'bg-[#FFF0F0]',
    border: 'border-[#20E3B2]/30',
    emoji: '🚀',
    comingSoon: true,
  },
  {
    id: 'community' as const,
    title: 'Community Vault',
    icon: Users,
    gradient: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    accent: 'text-[#065F46]',
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#065F46]/30',
    emoji: '🤝',
    comingSoon: false,
  },
] as const

export default function VaultPickerModal({ open, onClose }: VaultPickerModalProps) {
  const navigate = useNavigate()
  const { data: overall } = useOverallProgress()
  const [selected, setSelected] = useState<string | null>(null)

  if (!open) return null

  const selectedVault = VAULT_OPTIONS.find((v) => v.id === selected)
  const vaultProgress: VaultProgressDetail | undefined =
    selected && overall ? overall.vaults[selected] : undefined

  const handleVaultClick = (vaultId: string, comingSoon: boolean) => {
    if (comingSoon) return
    setSelected(vaultId)
  }

  const handleNavigate = () => {
    if (!selected) return
    onClose()
    navigate(`/vault-profiling?vault=${selected}`)
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <h2 className="font-display text-xl font-bold text-gray-900">Discover Your Investor DNA</h2>
          </div>
          <p className="text-sm text-gray-500">
            Select a vault to view your personality profile or start your profiling journey.
          </p>
        </div>

        {/* Vault selection cards */}
        <div className="px-6 space-y-3">
          {VAULT_OPTIONS.map((vault) => {
            const Icon = vault.icon
            const progress = overall?.vaults[vault.id]
            const isSelected = selected === vault.id
            const isComplete = progress?.isComplete ?? false

            return (
              <button
                key={vault.id}
                onClick={() => handleVaultClick(vault.id, vault.comingSoon)}
                disabled={vault.comingSoon}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  vault.comingSoon
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? `${vault.border} ${vault.bg} shadow-md scale-[1.01]`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${vault.gradient} flex items-center justify-center shrink-0`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{vault.title}</span>
                      {vault.comingSoon && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                          <Lock className="h-2.5 w-2.5" /> Soon
                        </span>
                      )}
                      {isComplete && !vault.comingSoon && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          ✨ DNA Ready
                        </span>
                      )}
                    </div>
                    {!vault.comingSoon && progress && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${vault.gradient} transition-all`}
                            style={{ width: `${Math.min(progress.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{Math.round(progress.pct)}%</span>
                      </div>
                    )}
                    {!vault.comingSoon && !progress && (
                      <p className="text-xs text-gray-400 mt-0.5">Not started yet</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Result section */}
        <div className="px-6 pb-6 pt-4">
          {selected && selectedVault && !selectedVault.comingSoon && (
            <div className="space-y-3">
              {vaultProgress?.isComplete ? (
                <>
                  <div className={`rounded-xl ${selectedVault.bg} p-3 text-center`}>
                    <p className="text-sm font-semibold text-gray-700">
                      🎉 Your {selectedVault.title} DNA is ready!
                    </p>
                    {vaultProgress.archetype && (
                      <p className={`text-xs font-bold ${selectedVault.accent} mt-1`}>
                        Archetype: {vaultProgress.archetype}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleNavigate}
                    className={`w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl bg-gradient-to-r ${selectedVault.gradient} text-white hover:opacity-90 transition-all shadow-md`}
                  >
                    View Your DNA Profile
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-amber-50 border border-amber-200/50 p-3 text-center">
                    <p className="text-sm font-semibold text-amber-800">
                      Complete your {selectedVault.title} profiling to discover your investor DNA
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {vaultProgress && vaultProgress.pct > 0
                        ? `You're ${Math.round(vaultProgress.pct)}% there — keep going!`
                        : 'Answer a few fun questions to unlock your personality profile.'}
                    </p>
                  </div>
                  <button
                    onClick={handleNavigate}
                    className={`w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl bg-gradient-to-r ${selectedVault.gradient} text-white hover:opacity-90 transition-all shadow-md`}
                  >
                    {vaultProgress && vaultProgress.pct > 0 ? 'Continue Profiling' : 'Start Profiling'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
          {!selected && (
            <p className="text-center text-xs text-gray-400">Pick a vault above to get started</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
