import { Link, useLocation } from 'react-router-dom'
import { Twitter, Linkedin, Instagram, Youtube, Mail, MapPin } from 'lucide-react'
import WLogo3D from '@/components/ui/WLogo3D'

const FOOTER_NAV = {
  Platform: [
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'For Builders',  href: '/builders' },
    { label: 'FAQs',          href: '/faqs' },
    { label: 'Investment Guide', href: '/investment-guide' },
  ],
  Company: [
    { label: 'About Us',   href: '/about' },
    { label: 'Careers',    href: '/careers' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy',   href: '/legal/privacy' },
  ],
}

const SOCIAL = [
  { icon: Linkedin,  href: '#', label: 'LinkedIn' },
  { icon: Twitter,   href: '#', label: 'Twitter / X' },
  { icon: Instagram, href: 'https://www.instagram.com/wealthspot.in?igsh=MWVtNHF3ZG0yb3FoNA==', label: 'Instagram' },
  { icon: Youtube,   href: '#', label: 'YouTube' },
]

const BG = '#080d1a'

function SlimFooter() {
  return (
    <footer style={{ background: BG }} role="contentinfo">
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <p className="font-body text-[11px] text-white/35 max-w-5xl leading-relaxed">
            &copy; {new Date().getFullYear()} WealthSpot Technologies Pvt. Ltd.
            <span className="mx-2 text-white/20 hidden sm:inline">·</span>
            <span className="block sm:inline mt-1 sm:mt-0">
              WealthSpot operates as an independent real estate discovery and advisory platform. We do not pool funds, manage investments, guarantee returns, or operate regulated investment schemes. All transactions occur directly between investors and respective asset owners/developers. Users are advised to conduct independent due diligence before making investment decisions.
            </span>
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@wealthspot.in" className="font-body text-[11px] text-white/35 hover:text-[#D4AF37] transition-colors">Help</a>
            <Link to="/legal/terms"   className="font-body text-[11px] text-white/35 hover:text-[#D4AF37] transition-colors">Terms</Link>
            <Link to="/legal/privacy" className="font-body text-[11px] text-white/35 hover:text-[#D4AF37] transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Footer() {
  const location = useLocation()

  if (location.pathname !== '/') return <SlimFooter />

  return (
    <footer style={{ background: BG }} role="contentinfo">
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        {/* Main grid */}
        <div className="py-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.6fr]">

          {/* Brand column */}
          <div className="flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-2.5">
              <WLogo3D size={36} />
              <div className="flex flex-col">
                <span
                  className="text-lg font-bold tracking-tight text-white leading-none"
                  style={{ fontFamily: 'Constantia, Cambria, Georgia, serif' }}
                >
                  Wealth<span className="text-[#D4AF37]">Spot</span>
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/65 leading-none mt-0.5">
                  Private Wealth Access
                </span>
              </div>
            </Link>
            <p className="font-body text-sm text-white/75 leading-relaxed max-w-[220px]">
              India&apos;s trusted fractional real estate investment platform. Build generational wealth, one fraction at a time.
            </p>
            <div className="space-y-2">
              <a href="mailto:hello@wealthspot.in" className="flex items-center gap-2 font-body text-sm text-white/75 hover:text-[#D4AF37] transition-colors">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                hello@wealthspot.in
              </a>
              <div className="flex items-start gap-2 font-body text-sm text-white/70">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Bengaluru, Karnataka, India
              </div>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_NAV).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-body text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.18em] mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="font-body text-sm text-white/80 hover:text-[#D4AF37] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA + social column */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-body text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.16em] mb-3">Find us on social</p>
              <div className="flex items-center gap-2.5 flex-wrap">
                {SOCIAL.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-white/55 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all duration-200"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Regulatory & Compliance Disclosure */}
        <div className="py-8 flex flex-col gap-4 font-body text-[11px] text-white/55 leading-relaxed text-justify sm:text-left">
          <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider mb-2">Regulatory & Compliance Disclosure</h4>
          <p>
            WealthSpot (including WealthSpot Technologies Pvt. Ltd. and WealthSpot Advisory LLP) operates strictly as a real estate discovery, market intelligence, networking, and independent property advisory platform. WealthSpot facilitates curated project discovery, developer introductions, real estate research insights, transaction coordination support, and investor-developer connectivity. WealthSpot does not operate as a bank, Non-Banking Financial Company (NBFC), Alternative Investment Fund (AIF), Portfolio Management Service (PMS), Collective Investment Scheme (CIS), crowdfunding platform, real estate investment trust (REIT), or Asset Management Company (AMC).
          </p>
          <p>
            WealthSpot is not registered with the Securities and Exchange Board of India (SEBI) as an Investment Adviser, Research Analyst, Portfolio Manager, or Collective Investment Vehicle, and does not undertake regulated securities activities under applicable SEBI regulations. WealthSpot does not solicit deposits, pool investor capital, manage collective funds, issue fractional ownership securities, guarantee returns, provide assured appreciation, or execute discretionary investment management services.
          </p>
          <p>
            All project information, market intelligence, property analytics, projections, valuation references, and opportunity assessments published on this platform are intended solely for informational, educational, and discovery purposes and should not be construed as financial advice, investment solicitation, securities recommendation, or guaranteed investment guidance. All transactions are executed directly between the investor and the respective developer, landowner, seller, or asset-owning entity. Investors are solely responsible for conducting independent legal, financial, taxation, technical, title, regulatory, and commercial due diligence prior to entering into any transaction or investment decision.
          </p>
          <p>
            WealthSpot does not assume fiduciary responsibility for investor decisions, developer performance, project execution, regulatory approvals, market fluctuations, pricing movements, construction timelines, liquidity outcomes, or investment returns. Users and investors are advised to consult qualified legal, tax, financial, and regulatory professionals before making any real estate acquisition or investment decision.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <Link to="/legal/terms"   className="font-body text-xs text-white/65 hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
            <Link to="/legal/privacy" className="font-body text-xs text-white/65 hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
          </div>
          <p className="font-body text-xs text-white/55">
            &copy; {new Date().getFullYear()} WealthSpot Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}
