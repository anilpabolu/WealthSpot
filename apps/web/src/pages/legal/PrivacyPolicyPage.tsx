import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { ShieldCheck } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <SEOHead
        title="Privacy Policy"
        description="Privacy Policy for WealthSpot"
        path="/legal/privacy"
      />
      <section
        className="page-hero-compact bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
        </div>

        <div className="page-hero-content">
          <div className="animate-fade-up max-w-3xl">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
              Legal Documents
            </p>
            <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight leading-[1.1]">
              Privacy Policy
            </h1>
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden py-20 sm:py-28"
        style={{ background: '#FDFBF5' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        
        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-16 space-y-12">
          <p className="font-body text-[16px] text-[#4B5563] leading-relaxed">
            WealthSpot Private Limited ("WealthSpot", "the Company", "We", "Us", or "Our") operates the website and underlying platform infrastructure. This Privacy Policy outlines our uncompromising protocols regarding the collection, storage, encryption, processing, and protection of data provided by high-net-worth individuals, enterprise network members, and users ("Members", "You", "Your"). This policy is designed in complete alignment with the Digital Personal Data Protection (DPDP) Act, and applicable global enterprise data privacy regulations.
          </p>

          <div className="space-y-6">
            <h2 className="font-hero text-2xl font-bold text-[#111827] flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
              Data Collection Principles & Scope
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Because WealthSpot acts as an exclusive Real Estate Intelligence and Private Discovery network, we collect highly deliberate, specialized data points to ensure the integrity of our invite-only ecosystem. We collect:
            </p>
            <div className="grid gap-4">
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #FDFBF5 100%)', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Identity Data</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">First name, last name, phone number, encrypted email communication channels, and residency status (Resident Indian / Non-Resident Indian (NRI)).</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #FDFBF5 100%)', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Verification & Profile Data</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">PAN (Permanent Account Number), Tax Residency documentation (where relevant for cross-border introduction validation), and basic accredited profile parameters.</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #FDFBF5 100%)', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Engagement & Intelligence Preferences</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">Geographic property preferences, asset class interest trends, allocation scales, and specific intelligence reports requested.</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #FDFBF5 100%)', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Technical & Usage Metadata</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">IP address, browser parameters, cookies, and system logs captured via secure enterprise framework systems.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-2xl font-bold text-[#111827] flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
              Explicit Purpose Limitation & Processing Logic
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              WealthSpot utilizes your data strictly under the 'lawful basis' and 'explicit consent' frameworks of the DPDP Act. We do not engage in monetization, algorithmic trading of individual identities, or cross-platform tracking. Your data is processed solely to:
            </p>
            <div className="grid gap-4">
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #FDFBF5 100%)', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Verify Membership Eligibility</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">Validate platform access credentials and preserve a secure, invite-only HNI ecosystem.</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #FDFBF5 100%)', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Customize Discovery Portfolios</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">Provide customized real estate intelligence metrics, market research, and asset analytics tailored to your specified geographic parameters.</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #ffffff 60%, #FDFBF5 100%)', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold text-[#111827] mb-2">Direct Intermediary Facilitation</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">Facilitate direct, one-to-one introductions to third-party developers, builder networks, or independent consulting entities strictly upon your direct instruction.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-2xl font-bold text-[#111827] flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
              Enterprise Data Protection, Localization & Cross-Border Controls
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Your data is secured through AES-256 cryptographic standards at rest and TLS 1.3 protocol standards during transit. WealthSpot stores and processes all core personal data on physically isolated cloud infrastructure located locally within the sovereign boundaries of India. For global NRI members, cross-border transmission of localized account logs is performed in strict compliance with standard contractual clauses and rules framed under the DPDP Act.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-hero text-2xl font-bold text-[#111827] flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
              Your Rights under Data Protection Frameworks
            </h2>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              As a Data Principal under the law, you retain complete sovereign control over your information. You may invoke your rights at any time via our Data Protection Officer (DPO) at compliance@wealthspot.in. These rights include: (a) The Right to Access and Summary of processed data; (b) The Right to Correction, Update, and Erasure; (c) The Right to Withdraw Consent completely, which will result in immediate termination of membership access to prevent further processing loops.
            </p>
          </div>

        </div>
      </section>
    </MainLayout>
  )
}
