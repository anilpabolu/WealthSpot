import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { FileText } from 'lucide-react'

export default function LegalDisclaimerPage() {
  return (
    <MainLayout>
      <SEOHead
        title="Legal Disclaimer"
        description="Legal Disclaimer for WealthSpot"
        path="/legal/disclaimer"
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
              Legal Disclaimer
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

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Regulatory Intermediary Status
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot Private Limited (including its corporate affiliates, technology divisions, and advisory entities, hereinafter referred to as "WealthSpot") operates strictly as an independent Real Estate Discovery Platform, Lead-Generation Network, and Premium Property Advisory Intermediary. WealthSpot functions as a registered real estate intermediary in compliance with the Real Estate (Regulation and Development) Act (RERA).
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Absolute Non-Pooling Architecture
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot is NOT a Securities and Exchange Board of India (SEBI) registered Asset Management Company (AMC), Alternative Investment Fund (AIF), Mutual Fund, Portfolio Manager, or Investment Adviser. The platform does not solicit, accept, process, aggregate, or pool investor capital, nor does it operate a Collective Investment Scheme (CIS) under Section 11AA of the SEBI Act. WealthSpot does not structure, manage, or coordinate Special Purpose Vehicles (SPVs), fractional real estate ownership instruments, or asset-backed tokenized securities.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Nature of Platform Intelligence
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              All real estate market research, analytics, cash-flow transparency projections, and localized economic data hosted on the platform are provided solely for informational, structural discovery, and educational benchmarking purposes. Such materials do not constitute regulated financial advisory, investment solicitations, or security placement offerings. Members retain independent, day-to-day absolute control over their allocations and are mandated to perform independent legal title tracking and financial due diligence before executing any property transaction.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#D4AF37] shrink-0" />
              Absolute Limitation of Liability
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot, its directors, enterprise architects, and advisory panel members assume zero liability for any financial loss, property delivery defaults, structural defects, title disputes, or economic variances arising from transactions executed between platform users and independent third-party developers. All outcomes are subject to the individual contracts executed directly between buyers and builders.
            </p>
          </div>

        </div>
      </section>
    </MainLayout>
  )
}
