import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, HandCoins, ShieldCheck, Lock, EyeOff } from 'lucide-react'
import { daysRemaining } from '@/lib/formatters'
import ExpressInterestModal from '@/components/eoi/ExpressInterestModal'
import { getRawMinInvestment, getOpportunityInvestmentDisplay } from '@/utils/opportunity'



function TrustBadge({ icon: Icon, label }: { icon: React.FC<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-[9px] text-theme-tertiary leading-tight text-center">{label}</span>
    </div>
  )
}

export function InterestPanel({ opportunity }: { opportunity: { id: string; title: string; status: string; raisedAmount: number; targetAmount: number | null; minInvestment: number | null; investorCount: number; closingDate: string | null; fundingOpenAt?: string | null; property_type?: string | null; property_specs?: Record<string, unknown> | null; propertyType?: string | null; propertySpecs?: Record<string, unknown> | null } }) {
  const [showEOI, setShowEOI] = useState(false)
  const daysLeft = opportunity.closingDate ? daysRemaining(opportunity.closingDate) : 0
  const now = Date.now()
  const closingDateMs = opportunity.closingDate ? new Date(opportunity.closingDate).getTime() : null
  const fundingOpenAtMs = opportunity.fundingOpenAt ? new Date(opportunity.fundingOpenAt).getTime() : null
  
  const isClosed = opportunity.status === 'closed' || (closingDateMs && now >= closingDateMs)
  const isComingSoon = !isClosed && (opportunity.status === 'coming_soon' || (fundingOpenAtMs && now < fundingOpenAtMs))
  const daysUntilOpen = fundingOpenAtMs ? Math.max(0, Math.ceil((fundingOpenAtMs - now) / 86400000)) : 0
  const isUrgent = !isClosed && !isComingSoon && daysLeft > 0 && daysLeft <= 10

  return (
    <>
      <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-primary/25 transition-all duration-300 hover:ring-primary/40">
        {/* Dark premium header — matches hero palette */}
        <div className="relative px-5 pt-5 pb-6 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0d1324 0%, #13102e 55%, #0d1324 100%)' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl"
            style={{ background: 'rgba(212,175,55,0.12)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-end mb-4">
              {isComingSoon ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Clock className="h-3.5 w-3.5" /> Starts in {daysUntilOpen} days
                </span>
              ) : daysLeft > 0 && !isClosed ? (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  isUrgent
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-white/50'
                }`}>
                  <Clock className="h-3.5 w-3.5" /> {daysLeft} days left
                </span>
              ) : isClosed ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/30">
                  Closed
                </span>
              ) : null}
            </div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-1.5">Investment</p>
            <p className="font-mono font-bold text-xl leading-tight" style={{ color: '#D4AF37' }}>
              {getOpportunityInvestmentDisplay(opportunity.minInvestment, opportunity.propertySpecs || opportunity.property_specs)}
            </p>
            {opportunity.investorCount > 0 && (
              <p className="mt-2.5 text-white/40 text-[11px] flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {opportunity.investorCount} investor{opportunity.investorCount !== 1 ? 's' : ''} have expressed interest
              </p>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="bg-[var(--bg-card)] px-5 pt-4 pb-5">
          {!isClosed && !isComingSoon ? (
            <button
              onClick={() => setShowEOI(true)}
              className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #f0d060 50%, #b8952e 100%)',
                color: '#1a0e00',
                boxShadow: '0 8px 24px rgba(212,175,55,0.25)',
              }}
            >
              <HandCoins className="h-5 w-5" />
              Express Interest
            </button>
          ) : isComingSoon ? (
            <button disabled className="w-full py-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-semibold cursor-not-allowed text-base border border-indigo-500/20">
              Coming Soon {daysUntilOpen > 0 ? `(${daysUntilOpen} days)` : ''}
            </button>
          ) : (
            <button disabled className="w-full py-3.5 rounded-xl bg-[var(--bg-surface-hover)] text-theme-secondary font-semibold cursor-not-allowed text-base">
              Opportunity Closed
            </button>
          )}

          <p className="text-center text-[10px] text-theme-tertiary mt-2.5 leading-relaxed">
            By expressing interest, you agree to our{' '}
            <Link to="/legal/terms" className="underline hover:text-theme-secondary">Terms</Link>.
            {' '}Your contact details will not be shared.
          </p>

          {/* Trust signals */}
          <div className="mt-4 pt-4 border-t border-theme grid grid-cols-3 gap-2">
            <TrustBadge icon={ShieldCheck} label="WealthSpot Verified" />
            <TrustBadge icon={Lock} label="Secure & Private" />
            <TrustBadge icon={EyeOff} label="Discreet Contact" />
          </div>
        </div>
      </div>

      {showEOI && (
        <ExpressInterestModal
          opportunityId={opportunity.id}
          opportunityTitle={opportunity.title}
          minInvestment={(() => {
            const prices = getRawMinInvestment(opportunity.minInvestment, opportunity.propertySpecs || opportunity.property_specs)
            if (prices.length > 0) {
              const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b)
              return uniquePrices[0] ?? opportunity.minInvestment ?? 0
            }
            return opportunity.minInvestment ?? 0
          })()}
          propertyType={opportunity.propertyType ?? opportunity.property_type ?? undefined}
          unitConfigs={(((opportunity.propertySpecs ?? opportunity.property_specs)?.configurations ?? (opportunity.propertySpecs ?? opportunity.property_specs)?.unitConfigurations ?? (opportunity.propertySpecs ?? opportunity.property_specs)?.unit_configurations) as unknown[]) ?? undefined}
          plotConfigs={(((opportunity.propertySpecs ?? opportunity.property_specs)?.plotConfigurations ?? (opportunity.propertySpecs ?? opportunity.property_specs)?.plot_configurations) as unknown[]) ?? undefined}
          projectPricePerSqft={((opportunity.propertySpecs ?? opportunity.property_specs)?.current_price_per_sqft as number) ?? ((opportunity.propertySpecs ?? opportunity.property_specs)?.price_per_sqft as number) ?? undefined}
          onClose={() => setShowEOI(false)}
        />
      )}
    </>
  )
}
