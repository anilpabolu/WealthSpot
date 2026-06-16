import { Check } from 'lucide-react'

export default function IntrinsicValueArticleContent() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* Definition */}
      <section className="bg-theme-card border border-theme rounded-2xl p-5 sm:p-7 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-theme-primary mb-4">
          What Is Intrinsic Value?
        </h2>
        <div className="bg-theme-surface rounded-xl border border-theme p-4 sm:p-5 mb-6 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mb-2">
            Plain language definition
          </div>
          <p className="text-base font-medium text-theme-primary mb-2">
            Intrinsic value is an estimate of what an asset is truly worth based on its fundamentals, not today’s market mood.
          </p>
          <p className="text-sm text-theme-secondary leading-relaxed">
            It looks at what the asset can generate over its life – cash flows, growth, risk, and quality – and asks: <span className="font-semibold text-primary">“If I owned the whole thing, what should I logically pay for it?”</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-theme-surface/50 border border-theme border-dashed rounded-xl p-4">
            <div className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-2">Intrinsic value</div>
            <p className="text-sm text-theme-secondary mb-3">Driven by fundamentals: cash flows, assets, growth, risk, quality of the business or property.</p>
            <span className="inline-flex px-2 py-0.5 rounded-full border border-theme text-[10px] uppercase tracking-wider text-theme-tertiary bg-theme-surface">Long-term, rational</span>
          </div>
          <div className="bg-theme-surface/50 border border-theme border-dashed rounded-xl p-4">
            <div className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-2">Market price</div>
            <p className="text-sm text-theme-secondary mb-3">Driven by supply–demand, sentiment, narratives, liquidity, fear and greed in the marketplace.</p>
            <span className="inline-flex px-2 py-0.5 rounded-full border border-theme text-[10px] uppercase tracking-wider text-theme-tertiary bg-theme-surface">Short-term, emotional</span>
          </div>
        </div>
      </section>

      {/* Poster Infographic Embed */}
      <section className="bg-theme-card border border-theme rounded-2xl p-5 sm:p-7 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-theme-primary mb-3">
          Premium Pencil-Sketch Infographic
        </h2>
        <p className="text-sm text-theme-secondary leading-relaxed">
          The visual below compresses the full idea into a single, shareable frame – contrasting intrinsic value vs market price for a coffee cup and a real estate property.
        </p>
        <div className="mt-5 rounded-2xl border border-theme border-dashed p-3 sm:p-4 bg-theme-surface/30">
          <img 
            src="/assets/images/intrinsic-value-poster.png" 
            alt="Intrinsic value vs market price premium pencil-sketch poster" 
            className="w-full h-auto rounded-xl shadow-lg border border-theme" 
          />
          <div className="mt-3 text-[11px] text-theme-tertiary text-center italic">
            Premium pencil-sketch style infographic: Coffee Can vs Real Estate Property — intrinsic value at the core, added value on top.
          </div>
        </div>
      </section>

      {/* How it is calculated */}
      <section className="bg-theme-card border border-theme rounded-2xl p-5 sm:p-7 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-theme-primary mb-3">
          How Intrinsic Value Is Calculated
        </h2>
        <p className="text-sm text-theme-secondary leading-relaxed mb-6">
          In practice, professionals estimate intrinsic value using valuation models that convert <span className="font-semibold text-primary">future economic benefits into today’s rupees</span>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-3">Core idea (Discounted cash flow)</h3>
            <p className="text-sm text-theme-secondary mb-3">For many assets, especially businesses and income‑producing real estate, a discounted cash flow (DCF) is used:</p>
            <div className="font-mono text-[11px] sm:text-xs p-3 rounded-lg border border-theme border-dashed bg-theme-surface overflow-x-auto whitespace-nowrap mb-3 text-theme-primary">
              Intrinsic Value ≈ Σ [ Cash Flow<sub className="text-[9px]">t</sub> ÷ (1 + r)<sup className="text-[9px]">t</sup> ]
            </div>
            <p className="text-sm text-theme-secondary">
              Cash flows are the money the asset can generate in each future period, and <code className="bg-theme-surface border border-theme px-1 py-0.5 rounded text-xs font-mono">r</code> is the required return that reflects risk.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-3">Practical workflow</h3>
            <ol className="list-decimal list-outside ml-4 space-y-2 text-sm text-theme-secondary">
              <li>Understand the asset (business, property, project).</li>
              <li>Estimate realistic future cash flows (rents, profits, free cash flows).</li>
              <li>Choose a sensible discount rate that reflects risk.</li>
              <li>Discount those cash flows back to today and sum them up.</li>
              <li>Adjust for balance-sheet items (debt, cash, one-offs).</li>
              <li>Compare your intrinsic value with the current market price.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Infographics: Coffee vs Real Estate textual cards */}
      <section className="bg-theme-card border border-theme rounded-2xl p-5 sm:p-7 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-theme-primary mb-6">
          Intrinsic Value vs Market Price — Coffee & Real Estate
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-6">
          
          {/* Coffee Can */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mb-2">Analogy 1</div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-3">Coffee Can — What’s Inside vs What You Pay</h3>
            <p className="text-sm text-theme-secondary mb-4 leading-relaxed">
              A takeaway coffee has a simple, low intrinsic value, but the market price is much higher because of add‑ons and branding.
            </p>
            <div className="bg-theme-surface rounded-xl border border-theme p-4 mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mb-3">Intrinsic value (Core)</div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Coffee</span>
                <span className="font-mono">₹30</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Milk</span>
                <span className="font-mono">₹20</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold mt-3 pt-3 border-t border-theme border-dashed">
                <span className="text-theme-primary">Total intrinsic value</span>
                <span className="font-mono text-primary">₹50</span>
              </div>
            </div>

            <div className="bg-theme-surface rounded-xl border border-theme p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mb-3">Added value (All extras)</div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Foam</span>
                <span className="font-mono">₹50</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Container</span>
                <span className="font-mono">₹80</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Cap</span>
                <span className="font-mono">₹25</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Sugar</span>
                <span className="font-mono">₹15</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Brand</span>
                <span className="font-mono">₹80</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Marketing</span>
                <span className="font-mono">₹70</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold mt-3 pt-3 border-t border-theme border-dashed">
                <span className="text-theme-primary">Total added value</span>
                <span className="font-mono text-primary">₹320</span>
              </div>
              <div className="text-right text-sm font-semibold mt-3 text-theme-primary">
                Market price = <span className="font-mono text-primary">₹370</span>
              </div>
              <div className="mt-4 rounded-lg p-3 sm:p-3 border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 font-medium italic shadow-sm">
                Focus on what’s INSIDE. That’s where real value is.
              </div>
            </div>
          </div>

          {/* Real Estate */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mb-2">Analogy 2</div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-3">Real Estate Property — Structure vs Story</h3>
            <p className="text-sm text-theme-secondary mb-4 leading-relaxed">
              A modern villa’s intrinsic value is driven by land and construction. The final selling price includes heavy add‑ons.
            </p>
            <div className="bg-theme-surface rounded-xl border border-theme p-4 mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mb-3">Intrinsic value (Core)</div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Land value</span>
                <span className="font-mono">₹20,00,000</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Construction value</span>
                <span className="font-mono">₹30,00,000</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold mt-3 pt-3 border-t border-theme border-dashed">
                <span className="text-theme-primary">Total intrinsic value</span>
                <span className="font-mono text-primary">₹50,00,000</span>
              </div>
              <div className="text-[11px] text-theme-tertiary italic mt-1 text-right">
                (≈ 1/2 of market value)
              </div>
            </div>

            <div className="bg-theme-surface rounded-xl border border-theme p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-theme-tertiary mb-3">Added value (All included)</div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Brand / Developer</span>
                <span className="font-mono">₹20,00,000</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Marketing & advertising</span>
                <span className="font-mono">₹20,00,000</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Glossy presentation</span>
                <span className="font-mono">₹5,00,000</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Operations cost</span>
                <span className="font-mono">₹5,00,000</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5 text-theme-secondary">
                <span className="text-theme-primary">Credits, loans</span>
                <span className="font-mono">₹35,00,000</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold mt-3 pt-3 border-t border-theme border-dashed">
                <span className="text-theme-primary">Total added value</span>
                <span className="font-mono text-primary">₹85,00,000</span>
              </div>
              <div className="text-right text-sm font-semibold mt-3 text-theme-primary">
                Market price = <span className="font-mono text-primary">₹1,35,00,000</span>
              </div>
              <div className="text-[11px] text-theme-tertiary italic mt-1 text-right">
                (Intrinsic value + added value = typically 2–3× intrinsic value)
              </div>
              <div className="mt-4 rounded-lg p-3 sm:p-3 border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 font-medium italic shadow-sm">
                Don’t get blinded by what’s added. Look at the REAL VALUE.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart investor checklist / Branding */}
      <section className="bg-theme-card border border-theme rounded-2xl p-5 sm:p-7 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-theme-primary mb-3">
          From Concept To Action
        </h2>
        <p className="text-sm text-theme-secondary leading-relaxed mb-6">
          The edge lies in behaving like a rational appraiser, not a distracted bidder. Use intrinsic value as your anchor, then negotiate around it.
        </p>
        <hr className="border-theme-subtle mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-4">Smart investor checklist</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2.5 text-sm text-theme-secondary">
                <div className="h-4 w-4 shrink-0 rounded-full border border-primary text-primary flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
                <span>Be a smart buyer.</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-theme-secondary">
                <div className="h-4 w-4 shrink-0 rounded-full border border-primary text-primary flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
                <span>Look deeper than the brochure.</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-theme-secondary">
                <div className="h-4 w-4 shrink-0 rounded-full border border-primary text-primary flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
                <span>Buy near or below intrinsic value.</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-theme-secondary">
                <div className="h-4 w-4 shrink-0 rounded-full border border-primary text-primary flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
                <span>Build real, compounding wealth.</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-3">Wealthspot lens</h3>
            <p className="text-sm text-theme-secondary leading-relaxed mb-4">
              Wealthspot is built to help you separate core value from noise – highlighting assets where fundamentals justify the price you pay.
            </p>
            <div className="flex items-center gap-3 text-sm text-theme-secondary">
              <div className="relative h-7 w-7 rounded-full border border-theme flex items-center justify-center bg-theme-surface">
                <div className="flex items-end gap-[2px] h-3">
                  <div className="w-[2px] rounded-full bg-primary/40 h-[30%]" />
                  <div className="w-[2px] rounded-full bg-primary/60 h-[55%]" />
                  <div className="w-[2px] rounded-full bg-primary/80 h-[75%]" />
                  <div className="w-[2px] rounded-full bg-primary h-full" />
                </div>
                {/* Magnifier handle */}
                <div className="absolute w-3 h-[2px] bg-theme-tertiary rounded-full rotate-45 -bottom-1 -right-1" />
              </div>
              <span>Magnify the signal, not the hype.</span>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.16em] text-theme-primary">
          Intrinsic value today, real wealth tomorrow.
        </div>
      </section>
    </div>
  )
}
