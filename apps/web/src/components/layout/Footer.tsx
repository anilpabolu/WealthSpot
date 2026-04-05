import { Link } from 'react-router-dom'
import { Shield, Twitter, Linkedin, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const FOOTER_LINKS = {
  Platform: [
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'For Builders', href: '/builders' },
    { label: 'For Lenders', href: '/lenders' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
  ],
  Resources: [
    { label: 'Community', href: '/community' },
  ],
}

const SOCIAL_LINKS = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-7 w-7 text-primary" />
              <span className="font-display text-lg font-bold text-white">
                Wealth<span className="text-primary">Spot</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
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
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-400 hover:text-primary transition-colors"
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
        <div className="border-t border-gray-800" />

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500 text-center sm:text-left">
            <p>© {new Date().getFullYear()} WealthSpot Technologies Pvt. Ltd. All rights reserved.</p>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
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
        <div className="py-4 border-t border-gray-800">
          <p className="text-[11px] leading-relaxed text-gray-600 text-center">
            <strong className="text-gray-500">Risk Disclaimer:</strong> Investments in fractional real estate 
            are subject to market risks. Past performance does not guarantee future returns. 
            The projected IRR is an estimate and actual returns may vary. Please read all related documents 
            carefully before investing. WealthSpot is a technology platform and does not provide financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
