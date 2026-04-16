import { useState } from 'react'
import { PortalLayout } from '@/components/layout'
import { HelpCircle, ChevronDown, ChevronUp, Mail, MessageCircle, BookOpen, ExternalLink } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'How do I create a new listing?',
    a: 'Navigate to "Add Property" in the sidebar or click "Add Property" from your listings page. Choose a vault type, fill in the details, upload media, and submit for approval.',
  },
  {
    q: 'How long does approval take?',
    a: "Most listings are reviewed within 24-48 hours. You'll receive a notification once your listing is approved or if any changes are needed.",
  },
  {
    q: 'Can I edit a listing after submission?',
    a: 'Yes, you can edit your listing at any time from the listing detail page. Some changes to approved listings may trigger a re-review.',
  },
  {
    q: 'How do I track my investors?',
    a: 'Visit the "Investors" section in the sidebar to see all investors across your listings, including investment amounts and statuses.',
  },
  {
    q: 'What document types can I upload?',
    a: 'You can upload PDF, DOC, DOCX, XLS, and XLSX files (up to 25 MB each). For media, images and videos are supported through the listing form.',
  },
  {
    q: 'How is the funding progress calculated?',
    a: 'Funding progress shows the percentage of your target amount that has been raised through confirmed investments.',
  },
  {
    q: 'What is RERA and do I need it?',
    a: 'RERA (Real Estate Regulatory Authority) registration is mandatory for real estate projects in India. Add your RERA number in Settings to increase investor trust.',
  },
  {
    q: 'How do builder updates work?',
    a: 'You can post updates on each listing to keep investors informed about project progress. Updates appear on the public listing page.',
  },
]

const SUPPORT_LINKS = [
  { label: 'Email Support', href: 'mailto:support@wealthspot.in', icon: Mail, desc: 'Get help via email' },
  { label: 'Documentation', href: '#', icon: BookOpen, desc: 'Browse our knowledge base' },
  { label: 'Community Forum', href: '#', icon: MessageCircle, desc: 'Connect with other builders' },
]

export default function BuilderHelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <PortalLayout variant="builder">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="section-title text-2xl">Help & Support</h1>
          <p className="text-theme-secondary mt-1">Find answers and get in touch</p>
        </div>

        {/* Support channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SUPPORT_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4 hover:border-primary/50 transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <link.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-theme-primary flex items-center gap-1">
                {link.label}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </p>
              <p className="text-xs text-theme-tertiary mt-0.5">{link.desc}</p>
            </a>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-[var(--bg-surface)] rounded-xl border border-theme">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Frequently Asked Questions
            </h2>
          </div>
          <div className="divide-y divide-theme">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <span className="text-sm font-medium text-theme-primary pr-4">{item.q}</span>
                  {openIdx === idx ? <ChevronUp className="h-4 w-4 text-theme-tertiary flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-theme-tertiary flex-shrink-0" />}
                </button>
                {openIdx === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-theme-secondary leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
