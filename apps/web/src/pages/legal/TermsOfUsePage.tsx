import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { Scale } from 'lucide-react'

export default function TermsOfUsePage() {
  return (
    <MainLayout>
      <SEOHead
        title="Terms of Use"
        description="Terms of Use for WealthSpot"
        path="/legal/terms"
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
              Terms of Use
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
          <p className="font-body text-[16px] text-[#4B5563] leading-relaxed">
            These Terms of Use constitutes a legally binding agreement executed between WealthSpot Private Limited ("WealthSpot") and any individual or entity gaining authenticated access to our proprietary discovery platform and real estate intelligence frameworks ("Member", "User", "You"). By accessing, browsing, or utilizing the interface, you acknowledge absolute adherence to these terms.
          </p>

          <div className="space-y-6">
            <h2 className="font-hero text-2xl font-bold text-[#111827] flex items-center gap-3">
              <Scale className="h-6 w-6 text-[#D4AF37]" />
              Scope of Platform Services: Non-Fund, Non-Advisory Operations
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot functions strictly as a high-governance Real Estate Discovery Platform, Lead-Generation System, and Independent Property Advisory Intermediary. You explicitly acknowledge and agree to the following operational boundaries:
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #ffffff 100%)', border: '1px solid rgba(212,175,55,0.18)' }}>
                <h3 className="font-bold text-[#111827] mb-2">No Pooling of Capital</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">WealthSpot does not aggregate capital, solicit deposits, manage collective accounts, or handle investor funds. We maintain no pooled treasury, collective investment fund, or investment corpus.</p>
              </div>
              <div className="rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #ffffff 100%)', border: '1px solid rgba(212,175,55,0.18)' }}>
                <h3 className="font-bold text-[#111827] mb-2">No Fractional Issuance or SPV Management</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">WealthSpot does not issue, market, manage, or coordinate fractional property ownership titles, shared-appreciation instruments, or tokenized securities.</p>
              </div>
              <div className="rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #ffffff 100%)', border: '1px solid rgba(212,175,55,0.18)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Direct Transaction Execution</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">All financial parameters, negotiations, documentation, and asset acquisitions occur directly and independently between you and the respective developers. WealthSpot does not act as an agent with discretionary transaction authority.</p>
              </div>
              <div className="rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #ffffff 100%)', border: '1px solid rgba(212,175,55,0.18)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Non-Financial Advisory</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">The information, analytics, and intelligence reports presented on WealthSpot do not constitute regulated financial planning, investment advice under SEBI guidelines, or asset portfolio management.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-2xl font-bold text-[#111827] flex items-center gap-3">
              <Scale className="h-6 w-6 text-[#D4AF37]" />
              Permitted Use & Closed Network Restrictions
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot is an exclusive, non-public interface restricted to authorized, accredited corporate leaders and high-net-worth entities. Members are strictly prohibited from: (a) Scraping, reverse-engineering, or deep-linking into our property intelligence dashboards; (b) Re-distributing, republishing, or transmitting curated real estate analytics to unauthorized third parties; (c) Creating unauthorized, side-channel communication systems (such as external groups or broadcast networks) leveraging WealthSpot's name to coordinate collective bidding or capital aggregation loops.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-2xl font-bold text-[#111827] flex items-center gap-3">
              <Scale className="h-6 w-6 text-[#D4AF37]" />
              Intermediary Limitation of Liability
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot operates as an intermediary under applicable digital frameworks. While we execute independent vetting checks on listed property developers, we assume zero liability for structural defects, construction delays, regulatory adjustments, or breach of contract by third-party developers. All agreements executed post-discovery are strictly separate; WealthSpot is not a party, guarantor, or indemnifier to any transaction executed between you and a property developer.
            </p>
          </div>

        </div>
      </section>
    </MainLayout>
  )
}
