import { Link } from 'react-router-dom'
import { Shield, Twitter, Linkedin, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { useUserStore } from '@/stores/user.store'

const FOOTER_LINKS = {
  Platform: [
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'For Builders', href: '/builders' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Investment Guide', href: '/investment-guide' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
  ],
}

const SOCIAL_LINKS = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
]

export default function Footer() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return (
      <footer className="bg-slate-950 text-theme-tertiary" role="contentinfo">
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-theme-secondary">
            © {new Date().getFullYear()} WealthSpot Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/legal/terms" className="text-xs text-theme-tertiary hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/legal/privacy" className="text-xs text-theme-tertiary hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-slate-950 text-theme-tertiary" role="contentinfo">
      {/* Gradient accent stripe */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-7 w-7 text-[#D4AF37]" />
              <span className="font-display text-lg font-bold text-white">
                Wealth<span className="text-[#D4AF37]">Spot</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-theme-tertiary mb-4">
              India’s trusted fractional real estate investment platform.
              Build generational wealth, one fraction at a time.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:hello@wealthspot.in" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                hello@wealthspot.in
              </a>
              <a href="tel:+91-1800-XXX-XXXX" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                1800-XXX-XXXX
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Bengaluru, Karnataka, India</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-theme-tertiary hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-theme-secondary text-center sm:text-left">
            <p>© {new Date().getFullYear()} WealthSpot Technologies Pvt. Ltd. All rights reserved.</p>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="p-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/25 transition-all duration-200"
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="py-4 border-t border-white/5">
          <p className="text-[11px] leading-relaxed text-theme-secondary text-center">
            <strong className="text-theme-secondary">Risk Disclaimer:</strong> Investments in fractional real estate 
            are subject to market risks. Past performance does not guarantee future returns. 
            The projected IRR is an estimate and actual returns may vary. Please read all related documents 
            carefully before investing. WealthSpot is a technology platform and does not provide financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
