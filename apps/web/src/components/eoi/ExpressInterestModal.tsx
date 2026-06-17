import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Toggle, Select, Input, Textarea } from '@/components/ui'
import {
  X, CheckCircle2, Loader2, HandCoins, MessageSquare, AlertTriangle, Info,
} from 'lucide-react'
import {
  useBuilderQuestions, useSubmitEOI, useConnectWithBuilder, useEOIs, useEOIFormOptions,
  type BuilderQuestion,
} from '@/hooks/useEOI'
import { useRecordConsent, useConsentStatus } from '@/hooks/useConsent'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'
import { convertKeysToSnake } from '@wealthspot/api-client'

// ── Types ──────────────────────────────────────────────────────────────────

export type UnitCfg = {
  type?: string
  super_built_up_sqft?: number
  price_per_sqft?: number
  price?: number
  investment_amount?: number
}

export type PlotCfg = {
  type?: string
  area_sqft?: number
  area_sqyd?: number
  area_guntha?: number
  total_plots?: number
  available_plots?: number
  price_per_sqft?: number
  price?: number
  investment_amount?: number
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
  if (cfg.price != null && Number(cfg.price) > 0) return Number(cfg.price)
  if (cfg.investment_amount != null && Number(cfg.investment_amount) > 0) return Number(cfg.investment_amount)
  if (cfg.super_built_up_sqft != null && cfg.price_per_sqft != null) {
    return Number(cfg.super_built_up_sqft) * Number(cfg.price_per_sqft)
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



interface Props {
  opportunityId: string
  opportunityTitle: string
  minInvestment: number
  propertyType?: string
  unitConfigs?: unknown[]
  plotConfigs?: unknown[]
  onClose: () => void
}

type Step = 'confirm' | 'consent' | 'form' | 'success'

export default function ExpressInterestModal({ opportunityId, opportunityTitle, minInvestment, propertyType: _propertyType, unitConfigs: rawUnitConfigs, plotConfigs: rawPlotConfigs, onClose }: Props) {
  const { data: existingEOIs, isLoading: eoisLoading } = useEOIs({ opportunityId })
  const hasExistingInvestment = (existingEOIs?.items?.length ?? 0) > 0

  // The api-client camelCases nested response keys; normalize back to the snake_case
  // these config readers expect (idempotent on already-snake payloads).
  const unitConfigs = useMemo(() => (convertKeysToSnake(rawUnitConfigs ?? []) ?? []) as UnitCfg[], [rawUnitConfigs])
  const plotConfigs = useMemo(() => (convertKeysToSnake(rawPlotConfigs ?? []) ?? []) as PlotCfg[], [rawPlotConfigs])

  // Sort unit configs by super built-up area ascending
  const sortedUnitConfigs = useMemo(() => [...unitConfigs].sort(
    (a, b) => (a.super_built_up_sqft ?? 0) - (b.super_built_up_sqft ?? 0)
  ), [unitConfigs])

  const [step, setStep] = useState<Step>('consent')
  const [eoiId, setEoiId] = useState<string | null>(null)

  const configOptions = useMemo(() => {
    const opts: { value: string; label: string; amount: number; cfg: UnitCfg | PlotCfg; detailLabel: string }[] = []
    
    sortedUnitConfigs.forEach((u, i) => {
      const total = computeUnitTotal(u)
      const amt = total ?? minInvestment
      const uLabel = getUnitLabel(u)
      opts.push({
        value: `unit-${i}`,
        label: `${uLabel} — ${formatLakhs(amt)}`,
        detailLabel: uLabel,
        amount: amt,
        cfg: u
      })
    })
    
    plotConfigs.forEach((p, i) => {
      const total = p.area_sqft != null && p.price_per_sqft != null ? p.area_sqft * p.price_per_sqft : null
      const amt = total ?? minInvestment
      opts.push({
        value: `plot-${i}`,
        label: `${p.type} — ${formatLakhs(amt)}`,
        detailLabel: p.type,
        amount: amt,
        cfg: p
      })
    })
    return opts
  }, [sortedUnitConfigs, plotConfigs, minInvestment])

  const [selectedConfigValue, setSelectedConfigValue] = useState<string>('')
  
  const activeConfigOption = configOptions.find(o => o.value === selectedConfigValue)
  const selectedConfig = activeConfigOption ? activeConfigOption.cfg : null

  // Show confirmation step if user already has EOIs for this property
  useEffect(() => {
    if (!eoisLoading && hasExistingInvestment && (step === 'consent' || step === 'form')) {
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
  const computedInvestment: number = activeConfigOption ? activeConfigOption.amount : (configOptions.length === 1 ? (configOptions[0]?.amount ?? minInvestment) : minInvestment)

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



  const handleConnect = async () => {
    if (!eoiId) return
    await connectBuilder.mutateAsync(eoiId)
    onClose()
  }

  // Portal to document.body so the overlay escapes any sticky/transformed ancestor
  // (e.g. the sticky sidebar on OpportunityDetailPage) and its z-50 layers correctly
  // above the in-page section nav (z-40).
  return createPortal(
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
              onClick={() => setStep('form')}
              disabled={!regulatoryAccepted || !privacyAccepted}
              className="btn-primary w-full py-3 text-base flex justify-center items-center"
            >
              Accept & Continue
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-theme-secondary">
              Interested in <span className="font-semibold text-theme-primary">{opportunityTitle}</span>? Fill in the details below to express your interest. Your contact details will not be shared.
            </p>

            {/* Investment Amount Selection */}
            {configOptions.length > 1 ? (
              <div className="space-y-4 rounded-xl border border-theme bg-theme-surface-hover/30 p-4">
                <div>
                  <label className="text-xs font-semibold text-theme-secondary uppercase mb-1.5 block">Select Configuration</label>
                  <Select
                    value={selectedConfigValue}
                    onChange={setSelectedConfigValue}
                    options={configOptions.map(o => ({ value: o.value, label: o.label }))}
                    placeholder="Choose BHK / Unit Type..."
                  />
                </div>
                {activeConfigOption && (
                  <div className="flex items-center justify-between pt-3 border-t border-theme border-dashed">
                    <div>
                      <p className="text-[10px] font-semibold text-theme-tertiary uppercase mb-0.5">Configuration</p>
                      <p className="text-sm font-bold text-theme-primary">{activeConfigOption.detailLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-theme-tertiary uppercase mb-0.5">Investment</p>
                      <p className="text-sm font-bold text-primary">{formatLakhs(computedInvestment)}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">
                  {configOptions.length === 1 ? 'Investment Amount (₹) - ' + (configOptions[0]?.detailLabel ?? '') : 'Investment Amount (₹)'}
                </label>
                <div className="w-full px-4 py-3 text-sm border border-theme rounded-xl font-mono bg-[var(--bg-surface-hover)] text-theme-primary flex items-center justify-between shadow-inner">
                  <span className="font-semibold text-lg">{computedInvestment.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-primary font-bold px-2 py-1 bg-primary/10 rounded-md">{formatLakhs(computedInvestment)}</span>
                </div>
                <p className="text-[11px] text-theme-tertiary mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {configOptions.length === 1 ? 'Fixed amount for this configuration' : 'Minimum investment required for this property'}
                </p>
              </div>
            )}

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
              disabled={submitEOI.isPending || recordConsent.isPending || (configOptions.length > 1 && !selectedConfigValue)}
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
    </div>,
    document.body,
  )
}
