import MainLayout from '@/components/layout/MainLayout'
import SEOHead from '@/components/SEOHead'
import { ShieldCheck, Scale, AlertTriangle, FileText, Lock } from 'lucide-react'

export default function TermsOfUsePage() {
  return (
    <>
      <SEOHead
        title="Terms of Use | WealthSpot"
        description="WealthSpot Terms of Use and legal agreements."
        path="/legal/terms"
      />
      <MainLayout>
        {/* Hero Section */}
        <section id="hero" className="page-hero-navbar bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -mt-16 relative overflow-hidden pt-[8.5rem] pb-14 lg:pb-16">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
          </div>
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/80 text-xs font-semibold uppercase tracking-widest mb-4">
                <Scale className="h-3.5 w-3.5" />
                Legal Documents
              </div>
              <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
                Terms of Use
              </h1>
              <p className="text-white/60 max-w-2xl text-base leading-relaxed font-body">
                Effective Date: Last Updated: May 26, 2026
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 lg:py-24 theme-violet-control dark bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden flex-1">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
          </div>
          <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-16 relative z-10">
            
            <div className="card p-8 sm:p-12 space-y-10">
              
              <div className="space-y-4">
                <p className="text-lg leading-relaxed text-theme-primary">
                  These Terms of Use constitutes a legally binding agreement executed between WealthSpot Private Limited ("WealthSpot") and any individual or entity gaining authenticated access to our proprietary discovery platform and real estate intelligence frameworks ("Member", "User", "You"). By accessing, browsing, or utilizing the interface, you acknowledge absolute adherence to these terms.
                </p>
              </div>

              <div className="h-px w-full bg-theme-border opacity-20 bg-[#D4AF37]" />

              {/* Section 2.1 */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                    <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">
                    2.1 Scope of Platform Services: Non-Fund, Non-Advisory Operations
                  </h2>
                </div>
                <p className="text-theme-secondary leading-relaxed">
                  WealthSpot functions strictly as a high-governance Real Estate Discovery Platform, Lead-Generation System, and Independent Property Advisory Intermediary. You explicitly acknowledge and agree to the following operational boundaries:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-black/20 rounded-xl p-5 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="font-semibold text-theme-primary mb-2">No Pooling of Capital</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">WealthSpot does not aggregate capital, solicit deposits, manage collective accounts, or handle investor funds. We maintain no pooled treasury, collective investment fund, or investment corpus.</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-5 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="font-semibold text-theme-primary mb-2">No Fractional Issuance or SPV Management</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">WealthSpot does not issue, market, manage, or coordinate fractional property ownership titles, shared-appreciation instruments, or tokenized securities.</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-5 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="font-semibold text-theme-primary mb-2">Direct Transaction Execution</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">All financial parameters, negotiations, documentation, and asset acquisitions occur directly and independently between you and the respective developers. WealthSpot does not act as an agent with discretionary transaction authority.</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-5 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="font-semibold text-theme-primary mb-2">Non-Financial Advisory</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">The information, analytics, and intelligence reports presented on WealthSpot do not constitute regulated financial planning, investment advice under SEBI guidelines, or asset portfolio management.</p>
                  </div>
                </div>
              </div>

              {/* Section 2.2 */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                    <Lock className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">
                    2.2 Permitted Use & Closed Network Restrictions
                  </h2>
                </div>
                <p className="text-theme-secondary leading-relaxed">
                  WealthSpot is an exclusive, non-public interface restricted to authorized, accredited corporate leaders and high-net-worth entities. Members are strictly prohibited from:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <p className="text-theme-secondary text-sm leading-relaxed"><strong>(a)</strong> Scraping, reverse-engineering, or deep-linking into our property intelligence dashboards;</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <p className="text-theme-secondary text-sm leading-relaxed"><strong>(b)</strong> Re-distributing, republishing, or transmitting curated real estate analytics to unauthorized third parties;</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <p className="text-theme-secondary text-sm leading-relaxed"><strong>(c)</strong> Creating unauthorized, side-channel communication systems (such as external groups or broadcast networks) leveraging WealthSpot's name to coordinate collective bidding or capital aggregation loops.</p>
                  </li>
                </ul>
              </div>

              {/* Section 2.3 */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                    <AlertTriangle className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">
                    2.3 Intermediary Limitation of Liability
                  </h2>
                </div>
                <p className="text-theme-secondary leading-relaxed">
                  WealthSpot operates as an intermediary under applicable digital frameworks. While we execute independent vetting checks on listed property developers, we assume zero liability for structural defects, construction delays, regulatory adjustments, or breach of contract by third-party developers. All agreements executed post-discovery are strictly separate; WealthSpot is not a party, guarantor, or indemnifier to any transaction executed between you and a property developer.
                </p>
              </div>

              <div className="h-px w-full bg-theme-border opacity-20 bg-[#D4AF37]" />

              {/* Risk Disclosure Section */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-1">Important Notice</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">
                      Real Estate Allocation and Market Asset Risk Statement
                    </h2>
                  </div>
                </div>
                <p className="text-theme-secondary leading-relaxed text-lg">
                  Deploying capital into premium real estate, land assets, and physical developments involves substantial, multi-dimensional risk parameters. WealthSpot provides property intelligence, data-driven research, and discovery access, but we do not guarantee economic results, value appreciation, or absolute security. Every prospective member must carefully evaluate the following inherent risks prior to initiating an independent transaction with any third-party developer:
                </p>

                <div className="grid gap-6 mt-6">
                  {/* Section 3.1 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">3.1 Market Dynamics, Valuation & Illiquidity Pressures</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      Real estate assets are fundamentally illiquid. Unlike public equity markets, property holdings cannot be instantly liquidated or liquidated without substantial price erosion. Asset valuations fluctuate based on localized micro-market demand shifts, macro-economic inflationary trends, changes in interest rate structures, and broader geopolitical variables. Past performance metrics, historical appreciation rates, or localized price surges hosted within our market research dashboards are indicative historical data points only and cannot be projected as a baseline for future yield metrics.
                    </p>
                  </div>

                  {/* Section 3.2 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">3.2 Third-Party Execution and Developer Compliance Risks</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      Every real estate opportunity discovered via WealthSpot is subject to third-party execution risks. This includes, but is not limited to: structural execution delays, capital misallocation by the developer, supply chain disruptions, changing construction material costs, and developer insolvency. While WealthSpot monitors RERA registration parameters, the ultimate execution, delivery, and lifecycle management of the physical asset remain the exclusive responsibility of the developer.
                    </p>
                  </div>

                  {/* Section 3.3 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">3.3 Legal, Title, and Cross-Border Regulatory Volatility</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      Property acquisition risks include title defect vulnerabilities, zoning modifications, and retroactive legislative changes introduced by statutory authorities. For Non-Resident Indian (NRI) members, transactions are subject to additional layers of complexity, including FEMA (Foreign Exchange Management Act) compliance regulations, shifting tax implications (TDS, capital gains treatments), and repatriation limits. WealthSpot provides structural metadata, but does not provide independent legal title validation or tax structuring services.
                    </p>
                  </div>

                  {/* Section 3.4 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">3.4 Absence of Guaranteed Returns or Income Protection</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      WealthSpot explicitly rejects any concept of guaranteed returns, assured rental multiples, fixed IRR targets, or capital protection mechanisms. No communication on our interface, via our advisory channels, or within our analytical intelligence modules shall be interpreted as a performance assurance. You acknowledge that you bear the absolute economic risk of any capital allocation decision executed post-discovery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-theme-border opacity-20 bg-[#D4AF37]" />

              {/* Legal Disclaimer Section */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                    <FileText className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest block mb-1">Compliance Statement</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">
                      Legal Disclaimer
                    </h2>
                  </div>
                </div>

                <div className="grid gap-6 mt-6">
                  {/* Section 1 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">1. Regulatory Intermediary Status</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      WealthSpot Private Limited (including its corporate affiliates, technology divisions, and advisory entities, hereinafter referred to as "WealthSpot") operates strictly as an independent Real Estate Discovery Platform, Lead-Generation Network, and Premium Property Advisory Intermediary. WealthSpot functions as a registered real estate intermediary in compliance with the Real Estate (Regulation and Development) Act (RERA).
                    </p>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">2. Absolute Non-Pooling Architecture</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      WealthSpot is NOT a Securities and Exchange Board of India (SEBI) registered Asset Management Company (AMC), Alternative Investment Fund (AIF), Mutual Fund, Portfolio Manager, or Investment Adviser. The platform does not solicit, accept, process, aggregate, or pool investor capital, nor does it operate a Collective Investment Scheme (CIS) under Section 11AA of the SEBI Act. WealthSpot does not structure, manage, or coordinate Special Purpose Vehicles (SPVs), fractional real estate ownership instruments, or asset-backed tokenized securities.
                    </p>
                  </div>

                  {/* Section 3 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">3. Nature of Platform Intelligence</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      All real estate market research, analytics, cash-flow transparency projections, and localized economic data hosted on the platform are provided solely for informational, structural discovery, and educational benchmarking purposes. Such materials do not constitute regulated financial advisory, investment solicitations, or security placement offerings. Members retain independent, day-to-day absolute control over their allocations and are mandated to perform independent legal title tracking and financial due diligence before executing any property transaction.
                    </p>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-black/20 rounded-xl p-6 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">4. Absolute Limitation of Liability</h3>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      WealthSpot, its directors, enterprise architects, and advisory panel members assume zero liability for any financial loss, property delivery defaults, structural defects, title disputes, or economic variances arising from transactions executed between platform users and independent third-party developers. All outcomes are subject to the individual contracts executed directly between buyers and builders.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </MainLayout>
    </>
  )
}
