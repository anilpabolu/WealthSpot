import { Sparkles, Map, Target, AlertTriangle } from 'lucide-react'

interface ProjectThesisSectionProps {
  title: string
  projectRoadmap?: any[] | null
  riskFactors?: string | null
  whyInvestors?: string | null
  investmentThesis?: string | null
}

export function ProjectThesisSection({
  title,
  projectRoadmap,
  riskFactors,
  whyInvestors,
  investmentThesis
}: ProjectThesisSectionProps) {
  if (!projectRoadmap?.length && !riskFactors && !whyInvestors && !investmentThesis) return null

  // Replace placeholder in string
  const replacePlaceholder = (str: string | null | undefined) => {
    if (!str) return null
    return str.replace(/\{project_name\}/g, title || 'this project')
  }

  const whyInvestorsText = replacePlaceholder(whyInvestors)
  const investmentThesisText = replacePlaceholder(investmentThesis)
  const riskFactorsText = replacePlaceholder(riskFactors)

  return (
    <div className="space-y-6 mt-8">
      {/* Why Investors */}
      {whyInvestorsText && (
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/70 via-amber-400/50 to-amber-500/10" />
          <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Target className="h-4 w-4" />
            </span>
            Why Investors Are Looking At {title || 'This Project'}
          </h2>
          <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
            {whyInvestorsText}
          </p>
        </div>
      )}

      {/* Investment Thesis */}
      {investmentThesisText && (
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/70 via-emerald-400/50 to-emerald-500/10" />
          <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </span>
            Investment Thesis
          </h2>
          <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap font-mono">
            {investmentThesisText}
          </p>
        </div>
      )}

      {/* Roadmap */}
      {projectRoadmap && projectRoadmap.length > 0 && (
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/70 via-indigo-400/50 to-indigo-500/10" />
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

      {/* Risk Factors */}
      {riskFactorsText && (
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/70 via-red-400/50 to-red-500/10" />
          <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/15 text-red-500 dark:text-red-400 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Risk Factors
          </h2>
          <p className="text-xs text-theme-secondary leading-relaxed whitespace-pre-wrap italic">
            {riskFactorsText}
          </p>
        </div>
      )}
    </div>
  )
}
