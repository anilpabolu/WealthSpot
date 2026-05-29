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

            </div>
          </div>
        </section>
      </MainLayout>
    </>
  )
}
