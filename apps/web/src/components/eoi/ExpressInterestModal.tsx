import { useState, useEffect } from 'react'
import { Toggle, Select, Input, Textarea } from '@/components/ui'
import {
  X, CheckCircle2, Loader2, HandCoins, MessageSquare, AlertTriangle,
  CheckCheck, Info, Phone,
} from 'lucide-react'
import {
  useBuilderQuestions, useSubmitEOI, useConnectWithBuilder, useEOIs, useEOIFormOptions,
  type BuilderQuestion,
} from '@/hooks/useEOI'
import { useRecordConsent, useConsentStatus } from '@/hooks/useConsent'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'

// ── Types ──────────────────────────────────────────────────────────────────

export type UnitCfg = {
  type?: string
  super_built_up_sqft?: number
  price_per_sqft?: number
}

export type PlotCfg = {
  type: string
  area_sqft?: number
  area_sqyd?: number
  area_guntha?: number
  total_plots?: number
  available_plots?: number
  price_per_sqft?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatLakhs(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`
  return `₹${(amount / 100_000).toFixed(2)} L`
}

function getUnitLabel(cfg: UnitCfg): string {
  return cfg.type ?? 'Unit'
}

function computeUnitTotal(cfg: UnitCfg): number | null {
  if (cfg.super_built_up_sqft != null && cfg.price_per_sqft != null) {
    return cfg.super_built_up_sqft * cfg.price_per_sqft
  }
  return null
}

// ── ChipSelect ────────────────────────────────────────────────────────────

function ChipSelect({
  label,
  options,
  selected,
  onChange,
  multi = true,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (vals: string[]) => void
  multi?: boolean
}) {
  const toggle = (v: string) => {
    if (multi) {
      onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
    } else {
      onChange(selected[0] === v ? [] : [v])
    }
  }
  return (
    <div>
      <label className="text-xs font-semibold text-theme-secondary uppercase mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selected.includes(o.value)
                ? 'bg-primary text-white shadow-sm'
                : 'bg-[var(--bg-surface-hover)] text-theme-secondary border border-[var(--border-default)] hover:border-primary/40 hover:text-theme-primary'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── SelectedConfigBanner ──────────────────────────────────────────────────

function SelectedConfigBanner({ cfg }: { cfg: UnitCfg | PlotCfg }) {
  const isUnit = 'super_built_up_sqft' in cfg && !('total_plots' in cfg)
  const label = isUnit ? getUnitLabel(cfg as UnitCfg) : (cfg as PlotCfg).type
  const areaText = isUnit
    ? ((cfg as UnitCfg).super_built_up_sqft != null
        ? `${(cfg as UnitCfg).super_built_up_sqft!.toLocaleString('en-IN')} sqft super built-up`
        : '')
    : ((cfg as PlotCfg).area_sqft != null
        ? `${(cfg as PlotCfg).area_sqft!.toLocaleString('en-IN')} sqft`
        : '')
  const total = isUnit
    ? computeUnitTotal(cfg as UnitCfg)
    : ((cfg as PlotCfg).area_sqft != null && (cfg as PlotCfg).price_per_sqft != null
        ? (cfg as PlotCfg).area_sqft! * (cfg as PlotCfg).price_per_sqft!
        : null)
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
      <CheckCheck className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary truncate">{label}</p>
        {areaText && <p className="text-xs text-theme-secondary truncate">{areaText}</p>}
      </div>
      {total != null && (
        <p className="text-sm font-bold text-primary shrink-0">{formatLakhs(total)}</p>
      )}
    </div>
  )
}

interface Props {
  opportunityId: string
  opportunityTitle: string
  minInvestment: number
  propertyType?: string
  unitConfigs?: unknown[]
  plotConfigs?: unknown[]
  onClose: () => void
}

type Step = 'confirm' | 'consent' | 'config' | 'form' | 'success'

export default function ExpressInterestModal({ opportunityId, opportunityTitle, minInvestment, propertyType: _propertyType, unitConfigs: rawUnitConfigs, plotConfigs: rawPlotConfigs, onClose }: Props) {
  const { data: existingEOIs, isLoading: eoisLoading } = useEOIs({ opportunityId })
  const hasExistingInvestment = (existingEOIs?.items?.length ?? 0) > 0

  const unitConfigs = (rawUnitConfigs ?? []) as UnitCfg[]
  const plotConfigs = (rawPlotConfigs ?? []) as PlotCfg[]
  const hasConfigs = unitConfigs.length > 0 || plotConfigs.length > 0

  // Sort unit configs by super built-up area ascending
  const sortedUnitConfigs = [...unitConfigs].sort(
    (a, b) => (a.super_built_up_sqft ?? 0) - (b.super_built_up_sqft ?? 0)
  )

  const [step, setStep] = useState<Step>('consent')
  const [eoiId, setEoiId] = useState<string | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<UnitCfg | PlotCfg | null>(null)
  const [configError, setConfigError] = useState(false)

  // Show confirmation step if user already has EOIs for this property
  useEffect(() => {
    if (!eoisLoading && hasExistingInvestment && (step === 'consent' || step === 'form' || step === 'config')) {
      setStep('confirm')
    }
  }, [eoisLoading, hasExistingInvestment]) // eslint-disable-line react-hooks/exhaustive-deps

  // DB-driven form options
  const { data: formOptions, isLoading: optionsLoading, isFetching: optionsFetching } = useEOIFormOptions()
  const timelineOptions = (formOptions?.investmentTimeline ?? []).map(o => ({ value: o.value, label: o.label }))
  const fundingOptions = (formOptions?.fundingSource ?? []).map(o => ({ value: o.value, label: o.label }))
  const purposeOptions = (formOptions?.purpose ?? []).map(o => ({ value: o.value, label: o.label }))
  const contactOptions = (formOptions?.preferredContact ?? []).map(o => ({ value: o.value, label: o.label }))

  // Computed investment amount from selected config; fallback to minInvestment
  const computedInvestment: number = (() => {
    if (selectedConfig && 'super_built_up_sqft' in selectedConfig) {
      const u = selectedConfig as UnitCfg
      if (u.super_built_up_sqft != null && u.price_per_sqft != null) return u.super_built_up_sqft * u.price_per_sqft
    }
    if (selectedConfig && 'area_sqft' in selectedConfig) {
      const p = selectedConfig as PlotCfg
      if (p.area_sqft != null && p.price_per_sqft != null) return p.area_sqft * p.price_per_sqft
    }
    return minInvestment
  })()

  // Platform questions state
  const [timeline, setTimeline] = useState('')
  const [fundingSource, setFundingSource] = useState<string[]>([])
  const [purpose, setPurpose] = useState<string[]>([])
  const [preferredContact, setPreferredContact] = useState<string[]>([])
  const [bestTime, setBestTime] = useState('')
  const [notes, setNotes] = useState('')
  const [communicationConsent, setCommunicationConsent] = useState(true)
  const [regulatoryAccepted, setRegulatoryAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  // Builder custom question answers
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})

  const { data: builderQuestions = [] } = useBuilderQuestions(opportunityId)
  const submitEOI = useSubmitEOI()
  const connectBuilder = useConnectWithBuilder()
  const recordConsent = useRecordConsent()
  const { data: status } = useConsentStatus(true)
  const CURRENT_VERSION = status?.consent_version || "v1.0"

  const handleSubmit = async () => {
    if (!regulatoryAccepted || !privacyAccepted) return

    const answers = builderQuestions
      .filter((q: BuilderQuestion) => customAnswers[q.id]?.trim())
      .map((q: BuilderQuestion) => ({
        questionId: q.id,
        answerText: customAnswers[q.id] ?? null,
      }))

    try {
      const device_details = {
        userAgent: window.navigator.userAgent,
        language: window.navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
      
      await recordConsent.mutateAsync({
        context: 'EOI',
        consent_version: CURRENT_VERSION,
        regulatory_accepted: regulatoryAccepted,
        privacy_accepted: privacyAccepted,
        communication_accepted: communicationConsent,
        device_details,
        target_id: opportunityId,
      })

      const result = await submitEOI.mutateAsync({
        opportunityId,
        investmentAmount: computedInvestment || undefined,
        investmentTimeline: timeline || undefined,
        fundingSource: fundingSource.length ? fundingSource.join(',') : undefined,
        purpose: purpose.length ? purpose.join(',') : undefined,
        preferredContact: preferredContact.length ? preferredContact.join(',') : undefined,
        bestTimeToContact: bestTime || undefined,
        communicationConsent,
        additionalNotes: notes || undefined,
        selectedUnitConfig: selectedConfig ?? undefined,
        answers,
      })
      setEoiId(result.id)
      setStep('success')
    } catch (error: any) {
      console.warn("Failed to record EOI consent or submit EOI.", error)
      useToastStore.getState().addToast({
        title: "Submission Failed",
        message: "Network Error: Cannot save your request at this time. Please check your connection or backend.",
        type: "error"
      })
    }
  }

  const proceedToForm = () => {
    if (hasConfigs && !selectedConfig) {
      setConfigError(true)
      return
    }
    setStep('form')
  }

  const handleConnect = async () => {
    if (!eoiId) return
    await connectBuilder.mutateAsync(eoiId)
    onClose()
  }

  return (
    <div className="modal-overlay p-4">
      <div className="absolute inset-0 bg-black/10" />
      <div className="modal-panel max-w-lg relative overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Gold accent strip */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-primary to-amber-400/60 z-20" />
        {/* Header */}
        <div className="shrink-0 sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-lg font-bold text-theme-primary">
            {step === 'confirm' ? 'Already Expressed Interest'
              : step === 'consent' ? 'Platform Agreements'
              : step === 'config' ? 'Choose Your Configuration'
              : step === 'form' ? 'Express Your Interest'
              : 'Thank You!'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-surface-hover)]" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
        {step === 'confirm' && (
          <div className="p-6 text-center space-y-5">
            <div className="mx-auto w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-theme-primary mb-2">You've already expressed interest</h3>
              <p className="text-sm text-theme-secondary">
                You have {existingEOIs?.items?.length} existing expression{(existingEOIs?.items?.length ?? 0) > 1 ? 's' : ''} of interest for <span className="font-semibold text-theme-primary">{opportunityTitle}</span>. Would you like to submit another?
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setStep('consent')}
                className="btn-primary w-full py-3 text-base"
              >
                Yes, Submit Again
              </button>
              <button
                onClick={onClose}
                className="btn-secondary w-full py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'consent' && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-theme-secondary">
                Please review and accept the platform agreements before expressing your interest in <span className="font-semibold text-theme-primary">{opportunityTitle}</span>.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Checkbox 1 */}
              <div className={cn(
                "p-3 rounded-xl border transition-colors cursor-pointer",
                regulatoryAccepted ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-theme bg-theme-surface-hover"
              )} onClick={() => setRegulatoryAccepted(!regulatoryAccepted)}>
                <div className="flex gap-3">
                  <div className="pt-0.5">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      regulatoryAccepted ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "border-theme-border bg-theme-surface"
                    )}>
                      {regulatoryAccepted && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <span className="font-semibold text-theme-primary text-sm">Platform Role & Regulatory Acknowledgement</span>
                      <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 w-fit">Mandatory</span>
                    </div>
                    <p className="text-xs text-theme-secondary leading-relaxed">
                      I acknowledge that WealthSpot is an advisory platform and does not guarantee investment outcomes. All decisions are made independently.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox 2 */}
              <div className={cn(
                "p-3 rounded-xl border transition-colors cursor-pointer",
                privacyAccepted ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-theme bg-theme-surface-hover"
              )} onClick={() => setPrivacyAccepted(!privacyAccepted)}>
                <div className="flex gap-3">
                  <div className="pt-0.5">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      privacyAccepted ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "border-theme-border bg-theme-surface"
                    )}>
                      {privacyAccepted && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <span className="font-semibold text-theme-primary text-sm">Privacy & Data Processing Consent</span>
                      <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 w-fit">Mandatory</span>
                    </div>
                    <p className="text-xs text-theme-secondary leading-relaxed">
                      I consent to the processing of my information by WealthSpot and sharing necessary details with the builder for this specific opportunity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Toggle checked={communicationConsent} onChange={setCommunicationConsent} label="I consent to receive communication regarding this opportunity." size="sm" />
            
            <button
              onClick={() => setStep(hasConfigs ? 'config' : 'form')}
              disabled={!regulatoryAccepted || !privacyAccepted}
              className="btn-primary w-full py-3 text-base flex justify-center items-center"
            >
              Accept & Continue
            </button>
          </div>
        )}

        {step === 'config' && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-theme-secondary">
              Select the BHK / unit configuration you are interested in for <span className="font-semibold text-theme-primary">{opportunityTitle}</span>.
            </p>

            {sortedUnitConfigs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">BHK / Unit Configurations</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {sortedUnitConfigs.map((u, i) => {
                    const isSelected = selectedConfig === u
                    const total = computeUnitTotal(u)
                    const label = getUnitLabel(u)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSelectedConfig(u); setConfigError(false) }}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-theme hover:border-primary/50'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <CheckCheck className="h-3 w-3" /> Selected
                          </span>
                        )}
                        <p className={`text-base font-bold mb-3 ${isSelected ? 'text-primary' : 'text-theme-primary'}`}>🏠 {label}</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
                          {u.super_built_up_sqft != null && (
                            <div>
                              <p className="text-[10px] font-semibold text-theme-tertiary uppercase">Super BUA</p>
                              <p className="text-xs font-semibold text-theme-primary">{u.super_built_up_sqft.toLocaleString('en-IN')} sqft</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-theme">
                          {u.price_per_sqft != null && (
                            <p className="text-xs text-theme-secondary">₹{u.price_per_sqft.toLocaleString('en-IN')}<span className="text-theme-tertiary">/sqft</span></p>
                          )}
                          {total != null && (
                            <p className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {formatLakhs(total)}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {plotConfigs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Plot Configurations</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {plotConfigs.map((p, i) => {
                    const isSelected = selectedConfig === p
                    const total = p.area_sqft != null && p.price_per_sqft != null
                      ? p.area_sqft * p.price_per_sqft : null
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSelectedConfig(p); setConfigError(false) }}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md' : 'border-theme hover:border-amber-400/50'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                            <CheckCheck className="h-3 w-3" /> Selected
                          </span>
                        )}
                        <p className={`text-base font-bold mb-3 ${isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-theme-primary'}`}>🌿 {p.type}</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
                          {p.area_sqft != null && (
                            <div>
                              <p className="text-[10px] font-semibold text-theme-tertiary uppercase">Area (sqft)</p>
                              <p className="text-xs font-semibold text-theme-primary">{p.area_sqft.toLocaleString('en-IN')}</p>
                            </div>
                          )}
                          {p.area_sqyd != null && (
                            <div>
                              <p className="text-[10px] font-semibold text-theme-tertiary uppercase">Area (sq.yd)</p>
                              <p className="text-xs font-semibold text-theme-primary">{p.area_sqyd.toLocaleString('en-IN')}</p>
                            </div>
                          )}
                          {(p.available_plots ?? p.total_plots) != null && (
                            <div>
                              <p className="text-[10px] font-semibold text-theme-tertiary uppercase">Plots</p>
                              <p className="text-xs font-semibold text-theme-primary">{p.available_plots ?? p.total_plots}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-theme">
                          {p.price_per_sqft != null && (
                            <p className="text-xs text-theme-secondary">₹{p.price_per_sqft.toLocaleString('en-IN')}<span className="text-theme-tertiary">/sqft</span></p>
                          )}
                          {total != null && (
                            <p className={`text-sm font-bold ${isSelected ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {formatLakhs(total)}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {configError && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Please select a configuration to continue.
              </p>
            )}

            <button
              onClick={proceedToForm}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Continue with Selected Configuration
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-theme-secondary">
              Interested in <span className="font-semibold text-theme-primary">{opportunityTitle}</span>? Fill in the details below to express your interest. Your contact details will not be shared.
            </p>

            {/* Selected config summary banner */}
            {selectedConfig && <SelectedConfigBanner cfg={selectedConfig} />}

            {/* Investment Amount – computed from selection or min investment */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Investment Amount (₹)</label>
              <div className="w-full px-3 py-2.5 text-sm border border-theme rounded-lg font-mono bg-[var(--bg-surface-hover)] text-theme-primary flex items-center justify-between">
                <span>{computedInvestment.toLocaleString('en-IN')}</span>
                <span className="text-[11px] text-primary font-semibold">{formatLakhs(computedInvestment)}</span>
              </div>
              <p className="text-[11px] text-theme-tertiary mt-1">
                {selectedConfig ? 'Computed from your selected configuration' : 'Minimum investment for this property'}
              </p>
            </div>

            {/* DB-driven form options */}
            {(optionsLoading || (optionsFetching && !timelineOptions.length)) ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-theme-tertiary" />
                <span className="text-xs text-theme-secondary">Loading options…</span>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-hover)]/30 p-4 space-y-5">
                <ChipSelect
                  label="⏱ Investment Timeline"
                  options={timelineOptions}
                  selected={timeline ? [timeline] : []}
                  onChange={vals => setTimeline(vals[0] ?? '')}
                  multi={false}
                />
                <div className="h-px bg-[var(--border-subtle)]" />
                <ChipSelect
                  label="💰 Funding Source"
                  options={fundingOptions}
                  selected={fundingSource}
                  onChange={setFundingSource}
                />
                <div className="h-px bg-[var(--border-subtle)]" />
                <ChipSelect
                  label="🎯 Purpose"
                  options={purposeOptions}
                  selected={purpose}
                  onChange={setPurpose}
                />
                <div className="h-px bg-[var(--border-subtle)]" />
                <ChipSelect
                  label="📞 Preferred Contact Method"
                  options={contactOptions}
                  selected={preferredContact}
                  onChange={setPreferredContact}
                />
              </div>
            )}

            {/* Best time */}
            <Input
              label="Best Time to Contact"
              type="text"
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
              placeholder="e.g. Weekdays 10am-6pm"
            />

            {/* Builder custom questions */}
            {builderQuestions.length > 0 && (
              <div className="border-t pt-5">
                <p className="text-xs font-semibold text-theme-secondary uppercase mb-3">Additional Questions from Builder</p>
                <div className="space-y-4">
                  {builderQuestions.map((q: BuilderQuestion) => (
                    <div key={q.id}>
                      <label className="text-sm font-medium text-theme-primary mb-1 block">
                        {q.questionText} {q.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      {q.questionType === 'select' && q.options?.choices ? (
                        <Select
                          value={customAnswers[q.id] ?? ''}
                          onChange={(v) => setCustomAnswers(prev => ({ ...prev, [q.id]: v }))}
                          placeholder="Select an option"
                          options={(q.options.choices as string[]).map((c: string) => ({ value: c, label: c }))}
                        />
                      ) : q.questionType === 'boolean' ? (
                        <div className="flex gap-4">
                          {['Yes', 'No'].map(v => (
                            <button key={v} onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: v }))} className={`px-4 py-2 rounded-lg text-sm font-medium ${customAnswers[q.id] === v ? 'bg-primary text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'}`}>{v}</button>
                          ))}
                        </div>
                      ) : (
                        <Input
                          type={q.questionType === 'number' ? 'number' : 'text'}
                          value={customAnswers[q.id] ?? ''}
                          onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Your answer..."
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <Textarea
              label="Additional Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any questions or comments..."
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitEOI.isPending || recordConsent.isPending}
              className="btn-primary w-full py-3 text-base inline-flex items-center justify-center gap-2"
            >
              {(submitEOI.isPending || recordConsent.isPending) ? <Loader2 className="h-5 w-5 animate-spin" /> : <HandCoins className="h-5 w-5" />}
              Submit Expression of Interest
            </button>

            {submitEOI.isError && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">Something went wrong. Please try again.</p>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-theme-primary mb-2">Interest Submitted!</h3>
              <p className="text-sm text-theme-secondary">
                Thank you for expressing interest in <span className="font-semibold">{opportunityTitle}</span>.
                The builder will be notified and may reach out to you through the platform.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleConnect}
                disabled={connectBuilder.isPending}
                className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2"
              >
                {connectBuilder.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                Connect with Builder
              </button>
              <button
                onClick={onClose}
                className="btn-secondary w-full py-3"
              >
                Close
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
