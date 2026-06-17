import re

with open("apps/web/src/components/eoi/ExpressInterestModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add useMemo
content = content.replace(
    "import { useState, useEffect } from 'react'",
    "import { useState, useEffect, useMemo } from 'react'"
)

# 2. Update Step type
content = content.replace(
    "type Step = 'confirm' | 'consent' | 'config' | 'form' | 'success'",
    "type Step = 'confirm' | 'consent' | 'form' | 'success'"
)

# 3. Update state hooks
old_states = """  const [step, setStep] = useState<Step>('consent')
  const [eoiId, setEoiId] = useState<string | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<UnitCfg | PlotCfg | null>(null)
  const [configError, setConfigError] = useState(false)"""

new_states = """  const [step, setStep] = useState<Step>('consent')
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
  const selectedConfig = activeConfigOption ? activeConfigOption.cfg : null"""

content = content.replace(old_states, new_states)

# 4. Fix useEffect dependencies
content = content.replace(
    "step === 'consent' || step === 'form' || step === 'config'",
    "step === 'consent' || step === 'form'"
)

# 5. Fix computedInvestment
old_computed = """  // Computed investment amount from selected config; fallback to minInvestment
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
  })()"""

new_computed = """  // Computed investment amount from selected config; fallback to minInvestment
  const computedInvestment: number = activeConfigOption ? activeConfigOption.amount : (configOptions.length === 1 ? configOptions[0].amount : minInvestment)"""

content = content.replace(old_computed, new_computed)

# 6. Button logic
content = content.replace(
    "onClick={() => setStep(hasConfigs ? 'config' : 'form')}",
    "onClick={() => setStep('form')}"
)

# 7. Remove proceedToForm
content = content.replace(
    "  const proceedToForm = () => {\n    if (hasConfigs && !selectedConfig) {\n      setConfigError(true)\n      return\n    }\n    setStep('form')\n  }",
    ""
)

# 8. Remove the config step block from render
config_regex = re.compile(r"\{\s*step === 'config'.*?\}\s*\{\s*step === 'form'", re.DOTALL)
content = config_regex.sub("{step === 'form'", content)

# 9. Clean up header
content = content.replace(
    "              : step === 'config' ? 'Choose Your Configuration'\n",
    ""
)

# 10. Update the Form's Investment UI
old_form_investment = """            {/* Selected config summary banner */}
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
            </div>"""

new_form_investment = """            {/* Investment Amount Selection */}
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
                  {configOptions.length === 1 ? 'Investment Amount (₹) - ' + configOptions[0].detailLabel : 'Investment Amount (₹)'}
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
            )}"""

content = content.replace(old_form_investment, new_form_investment)

# 11. Disable submit button if multi config and not selected
content = content.replace(
    "disabled={submitEOI.isPending || recordConsent.isPending}",
    "disabled={submitEOI.isPending || recordConsent.isPending || (configOptions.length > 1 && !selectedConfigValue)}"
)

with open("apps/web/src/components/eoi/ExpressInterestModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
