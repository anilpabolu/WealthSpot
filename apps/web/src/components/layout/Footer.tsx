import { Link } from 'react-router-dom'
import { Twitter, Linkedin, Instagram, Youtube, ArrowRight, Mail, MapPin } from 'lucide-react'
import { useUserStore } from '@/stores/user.store'
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
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube,   href: '#', label: 'YouTube' },
]

const BG = '#080d1a'

function CompactFooter() {
  return (
    <footer style={{ background: BG }} role="contentinfo">
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-body text-xs text-white/40">
          &copy; {new Date().getFullYear()} WealthSpot Technologies Pvt. Ltd. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          <Link to="/legal/terms"   className="font-body text-xs text-white/40 hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
          <Link to="/legal/privacy" className="font-body text-xs text-white/40 hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

export default function Footer() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)

  if (isAuthenticated) return <CompactFooter />

  return (
    <footer style={{ background: BG }} role="contentinfo">
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        {/* Main grid */}
        <div className="py-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.6fr]">

          {/* Brand column */}
          <div className="flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-2.5">
              <WLogo3D size={52} light />
              <div className="flex flex-col">
                <span
                  className="text-lg font-bold tracking-tight text-white leading-none"
                  style={{ fontFamily: 'Constantia, Cambria, Georgia, serif' }}
                >
                  Wealth<span className="text-[#D4AF37]">Spot</span>
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/50 leading-none mt-0.5">
                  Private Wealth Access
                </span>
              </div>
            </Link>
            <p className="font-body text-sm text-white/55 leading-relaxed max-w-[220px]">
              India&apos;s trusted fractional real estate investment platform. Build generational wealth, one fraction at a time.
            </p>
            <div className="space-y-2">
              <a href="mailto:hello@wealthspot.in" className="flex items-center gap-2 font-body text-sm text-white/50 hover:text-[#D4AF37] transition-colors">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                hello@wealthspot.in
              </a>
              <div className="flex items-start gap-2 font-body text-sm text-white/50">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Bengaluru, Karnataka, India
              </div>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_NAV).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-body text-[11px] font-bold text-white uppercase tracking-[0.18em] mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="font-body text-sm text-white/55 hover:text-white transition-colors"
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
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/60 px-5 py-2.5 font-body text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-200"
              >
                Request Access <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div>
              <p className="font-body text-[11px] text-white/40 uppercase tracking-[0.16em] mb-3">Find us on social</p>
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

        {/* Risk disclaimer — two columns */}
        <div className="py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <p className="font-body text-[11.5px] text-white/60 leading-relaxed">
            <span className="font-semibold text-white/75">Risk Disclaimer: </span>
            Investments in fractional real estate are subject to market risks. Past performance does not guarantee future returns. The projected IRR is an estimate and actual returns may vary. Please read all related documents carefully before investing.
          </p>
          <p className="font-body text-[11.5px] text-white/60 leading-relaxed">
            WealthSpot is a technology platform and does not provide financial advice. Investment opportunities on this platform are intended for informed investors. Please consult a qualified financial advisor before making any investment decisions.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <Link to="/legal/terms"   className="font-body text-xs text-white/38 hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
            <Link to="/legal/privacy" className="font-body text-xs text-white/38 hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
          </div>
          <p className="font-body text-xs text-white/38">
            &copy; {new Date().getFullYear()} WealthSpot Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}
