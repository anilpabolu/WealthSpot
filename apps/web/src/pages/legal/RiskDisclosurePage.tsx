import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { AlertTriangle } from 'lucide-react'

export default function RiskDisclosurePage() {
  return (
    <MainLayout>
      <SEOHead
        title="Risk Disclosure"
        description="Risk Disclosure for WealthSpot"
        path="/legal/risk-disclosure"
      />
      <section
        className="page-hero-compact bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden !pb-10 lg:!pb-14"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
        </div>

        <div className="page-hero-content text-center flex flex-col items-center">
          <div className="animate-fade-up max-w-4xl mx-auto">
            <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Risk Disclosure
            </h1>
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden py-20 sm:py-24"
        style={{ background: '#ffffff' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 lg:px-16 space-y-12">
          
          <div className="rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, #ffffff 60%, #ffffff 100%)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-red-600 flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              IMPORTANT NOTICE: REAL ESTATE ALLOCATION AND MARKET ASSET RISK STATEMENT
            </h2>
            <p className="font-body text-[15px] sm:text-[16px] text-[#4B5563] leading-relaxed">
              Deploying capital into premium real estate, land assets, and physical developments involves substantial, multi-dimensional risk parameters. WealthSpot provides property intelligence, data-driven research, and discovery access, but we do not guarantee economic results, value appreciation, or absolute security. Every prospective member must carefully evaluate the following inherent risks prior to initiating an independent transaction with any third-party developer:
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Market Dynamics, Valuation & Illiquidity Pressures
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Real estate assets are fundamentally illiquid. Unlike public equity markets, property holdings cannot be instantly liquidated or liquidated without substantial price erosion. Asset valuations fluctuate based on localized micro-market demand shifts, macro-economic inflationary trends, changes in interest rate structures, and broader geopolitical variables. Past performance metrics, historical appreciation rates, or localized price surges hosted within our market research dashboards are indicative historical data points only and cannot be projected as a baseline for future yield metrics.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Third-Party Execution and Developer Compliance Risks
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Every real estate opportunity discovered via WealthSpot is subject to third-party execution risks. This includes, but is not limited to: structural execution delays, capital misallocation by the developer, supply chain disruptions, changing construction material costs, and developer insolvency. While WealthSpot monitors RERA registration parameters, the ultimate execution, delivery, and lifecycle management of the physical asset remain the exclusive responsibility of the developer.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Legal, Title, and Cross-Border Regulatory Volatility
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Property acquisition risks include title defect vulnerabilities, zoning modifications, and retroactive legislative changes introduced by statutory authorities. For Non-Resident Indian (NRI) members, transactions are subject to additional layers of complexity, including FEMA (Foreign Exchange Management Act) compliance regulations, shifting tax implications (TDS, capital gains treatments), and repatriation limits. WealthSpot provides structural metadata, but does not provide independent legal title validation or tax structuring services.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Absence of Guaranteed Returns or Income Protection
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot explicitly rejects any concept of guaranteed returns, assured rental multiples, or capital protection mechanisms. No communication on our interface, via our advisory channels, or within our analytical intelligence modules shall be interpreted as a performance assurance. You acknowledge that you bear the absolute economic risk of any capital allocation decision executed post-discovery.
            </p>
          </div>

        </div>
      </section>
    </MainLayout>
  )
}
