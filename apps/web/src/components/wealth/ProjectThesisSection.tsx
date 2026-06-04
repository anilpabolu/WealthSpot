import { Sparkles, Map, Target, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'

interface ProjectThesisSectionProps {
  title: string
  projectRoadmap?: any[] | null
  riskFactors?: string | null
  whyInvestors?: string | null
  investmentThesis?: string | null
}

/** Replace {project_name} placeholder with the live opportunity title. */
function replacePlaceholder(str: string | null | undefined, title: string): string | null {
  if (!str) return null
  const cleaned = str.replace(/\{project_name\}/g, title || 'this project').trim()
  return cleaned.length > 0 ? cleaned : null
}

/** Muted italic placeholder shown when a section has no content yet. */
function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-theme-tertiary italic leading-relaxed">
      {children}
    </p>
  )
}

/**
 * Parse the Investment Thesis text into a heading + checklist + paragraphs.
 * Lines beginning with ✓ ✔ • - * become highlighted checklist rows; a leading
 * non-bullet line (e.g. "Why This Opportunity?") is rendered as a sub-heading.
 */
function ThesisBody({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  const bulletRe = /^[✓✔•\-*]\s*/

  const heading: string[] = []
  const bullets: string[] = []
  const paragraphs: string[] = []

  let bulletsStarted = false
  for (const line of lines) {
    if (bulletRe.test(line)) {
      bulletsStarted = true
      bullets.push(line.replace(bulletRe, '').trim())
    } else if (!bulletsStarted) {
      heading.push(line)
    } else {
      paragraphs.push(line)
    }
  }

  // No bullets detected — just render the raw text gracefully.
  if (bullets.length === 0) {
    return (
      <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">{text}</p>
    )
  }

  return (
    <div className="space-y-4">
      {heading.length > 0 && (
        <p className="text-base font-semibold text-theme-primary">{heading.join(' ')}</p>
      )}
      <div className="grid sm:grid-cols-2 gap-2.5">
        {bullets.map((b, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 hover:border-emerald-500/30 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-[13px] text-theme-secondary leading-snug">{b}</span>
          </div>
        ))}
      </div>
      {paragraphs.length > 0 && (
        <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
          {paragraphs.join('\n')}
        </p>
      )}
    </div>
  )
}

export function ProjectThesisSection({
  title,
  projectRoadmap,
  riskFactors,
  whyInvestors,
  investmentThesis
}: ProjectThesisSectionProps) {
  const whyInvestorsText = replacePlaceholder(whyInvestors, title)
  const investmentThesisText = replacePlaceholder(investmentThesis, title)
  const riskFactorsText = replacePlaceholder(riskFactors, title)

  return (
    <div className="space-y-6 mt-8">
      {/* Why Investors — always shown */}
      <div id="why-investors" className="card p-6 relative overflow-hidden scroll-mt-32">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/70 via-amber-400/50 to-amber-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3), transparent)' }} />
        <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            <Target className="h-4 w-4" />
          </span>
          Why Investors Are Looking At {title || 'This Project'}
        </h2>
        {whyInvestorsText ? (
          <p className="text-[15px] text-theme-secondary leading-relaxed whitespace-pre-wrap">
            {whyInvestorsText}
          </p>
        ) : (
          <EmptyNote>The investment rationale for this opportunity has not been published yet.</EmptyNote>
        )}
      </div>

      {/* Investment Thesis — always shown */}
      <div id="investment-thesis" className="card p-6 relative overflow-hidden scroll-mt-32">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
        <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sparkles className="h-4 w-4" />
          </span>
          Investment Thesis
        </h2>
        {investmentThesisText ? (
          <ThesisBody text={investmentThesisText} />
        ) : (
          <EmptyNote>An investment thesis has not been provided for this opportunity yet.</EmptyNote>
        )}
      </div>

      {/* Project Roadmap — only when data exists */}
      {projectRoadmap && projectRoadmap.length > 0 && (
        <div id="roadmap" className="card p-6 relative overflow-hidden scroll-mt-32">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
          <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 shrink-0">
              <Map className="h-4 w-4" />
            </span>
            Project Roadmap
          </h2>

          <div className="space-y-4 relative mt-6">
            <div className="absolute left-4 top-4 bottom-4 w-[2px] border-l-2 border-dashed border-theme-border z-0"></div>
            {projectRoadmap.map((r, i) => (
              <div key={i} className="relative z-10 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-theme-surface border-2 border-indigo-400 flex-shrink-0 flex items-center justify-center shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                </div>
                <div className="flex-grow bg-theme-surface-hover p-4 rounded-xl border border-theme">
                  <p className="text-[10px] font-bold uppercase text-theme-tertiary mb-1">{r.phase}</p>
                  <h4 className="text-sm font-semibold text-theme-primary">{r.stage}</h4>
                  {r.timeline && (
                    <p className="text-xs text-theme-secondary mt-1">{r.timeline}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors — always shown, last (advisory) */}
      <div id="risk-factors" className="card p-6 relative overflow-hidden scroll-mt-32">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
        <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/15 text-red-500 dark:text-red-400 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </span>
          Risk Factors
        </h2>
        {riskFactorsText ? (
          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-4 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500/80 dark:text-red-400/80 shrink-0 mt-0.5" />
            <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
              {riskFactorsText}
            </p>
          </div>
        ) : (
          <EmptyNote>No specific risk factors have been disclosed for this opportunity yet. All investments carry inherent market, execution and liquidity risk — review all documentation before investing.</EmptyNote>
        )}
      </div>
    </div>
  )
}
