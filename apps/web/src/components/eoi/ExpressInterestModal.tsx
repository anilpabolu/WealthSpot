import { useState } from 'react'
import { Toggle, Select } from '@/components/ui'
import { X, CheckCircle2, Loader2, HandCoins, MessageSquare } from 'lucide-react'
import { useBuilderQuestions, useSubmitEOI, useConnectWithBuilder, type BuilderQuestion } from '@/hooks/useEOI'

const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (within 2 weeks)' },
  { value: '1-3_months', label: '1-3 Months' },
  { value: '3-6_months', label: '3-6 Months' },
  { value: 'exploring', label: 'Just Exploring' },
]

const FUNDING_OPTIONS = [
  { value: 'own_funds', label: 'Own Funds' },
  { value: 'bank_loan', label: 'Bank Loan' },
  { value: 'both', label: 'Both' },
]

const PURPOSE_OPTIONS = [
  { value: 'investment', label: 'Investment / Returns' },
  { value: 'rental_income', label: 'Rental Income' },
  { value: 'self_use', label: 'Self Use' },
]

const CONTACT_OPTIONS = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

interface Props {
  opportunityId: string
  opportunityTitle: string
  minInvestment: number
  onClose: () => void
}

type Step = 'form' | 'success'

export default function ExpressInterestModal({ opportunityId, opportunityTitle, minInvestment, onClose }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [eoiId, setEoiId] = useState<string | null>(null)

  // Platform questions state
  const [investmentAmount, setInvestmentAmount] = useState<number>(minInvestment)
  const [timeline, setTimeline] = useState('')
  const [fundingSource, setFundingSource] = useState('')
  const [purpose, setPurpose] = useState('')
  const [preferredContact, setPreferredContact] = useState('')
  const [bestTime, setBestTime] = useState('')
  const [notes, setNotes] = useState('')
  const [communicationConsent, setCommunicationConsent] = useState(true)

  // Builder custom question answers
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})

  const { data: builderQuestions = [] } = useBuilderQuestions(opportunityId)
  const submitEOI = useSubmitEOI()
  const connectBuilder = useConnectWithBuilder()

  const handleSubmit = async () => {
    const answers = builderQuestions
      .filter((q: BuilderQuestion) => customAnswers[q.id]?.trim())
      .map((q: BuilderQuestion) => ({
        questionId: q.id,
        answerText: customAnswers[q.id] ?? null,
      }))

    const result = await submitEOI.mutateAsync({
      opportunityId,
      investmentAmount: investmentAmount || undefined,
      investmentTimeline: timeline || undefined,
      fundingSource: fundingSource || undefined,
      purpose: purpose || undefined,
      preferredContact: preferredContact || undefined,
      bestTimeToContact: bestTime || undefined,
      communicationConsent,
      additionalNotes: notes || undefined,
      answers,
    })
    setEoiId(result.id)
    setStep('success')
  }

  const handleConnect = async () => {
    if (!eoiId) return
    await connectBuilder.mutateAsync(eoiId)
    onClose()
  }

  return (
    <div className="modal-overlay p-4">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      <div className="modal-panel max-w-lg relative">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="font-display text-lg font-bold text-theme-primary">
            {step === 'form' ? 'Express Your Interest' : 'Thank You!'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-surface-hover)]" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        {step === 'form' && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-theme-secondary">
              Interested in <span className="font-semibold text-theme-primary">{opportunityTitle}</span>? Fill in the details below to express your interest. Your contact details will not be shared.
            </p>

            {/* Investment Amount */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Investment Amount (₹)</label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Math.max(0, Number(e.target.value)))}
                min={0}
                className="w-full px-3 py-2.5 text-sm border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
                placeholder="Enter amount"
              />
            </div>

            {/* Timeline */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Investment Timeline</label>
              <Select value={timeline} onChange={setTimeline} placeholder="Select timeline" options={TIMELINE_OPTIONS} />
            </div>

            {/* Funding Source */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Funding Source</label>
              <div className="flex flex-wrap gap-2">
                {FUNDING_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setFundingSource(o.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${fundingSource === o.value ? 'bg-primary text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Purpose</label>
              <div className="flex flex-wrap gap-2">
                {PURPOSE_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setPurpose(o.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${purpose === o.value ? 'bg-primary text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Contact */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Preferred Contact Method</label>
              <div className="flex flex-wrap gap-2">
                {CONTACT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setPreferredContact(o.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${preferredContact === o.value ? 'bg-primary text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Best time */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Best Time to Contact</label>
              <input type="text" value={bestTime} onChange={(e) => setBestTime(e.target.value)} placeholder="e.g. Weekdays 10am-6pm" className="w-full px-3 py-2.5 text-sm border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>

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
                        <input
                          type={q.questionType === 'number' ? 'number' : 'text'}
                          value={customAnswers[q.id] ?? ''}
                          onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="w-full px-3 py-2.5 text-sm border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="Your answer..."
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label className="text-xs font-semibold text-theme-secondary uppercase mb-1 block">Additional Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any questions or comments..." className="w-full px-3 py-2.5 text-sm border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
            </div>

            {/* Consent */}
            <Toggle checked={communicationConsent} onChange={setCommunicationConsent} label="I consent to receive communication regarding this opportunity." size="sm" />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitEOI.isPending}
              className="btn-primary w-full py-3 text-base inline-flex items-center justify-center gap-2"
            >
              {submitEOI.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <HandCoins className="h-5 w-5" />}
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
  )
}
