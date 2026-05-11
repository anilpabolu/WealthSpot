import { useState } from 'react'
import { LayoutDashboard, List, FileText, Link, Server, ShieldOff, MessageSquare } from 'lucide-react'
import CommDashboard from '@/components/comm/CommDashboard'
import EventRegistry from '@/components/comm/EventRegistry'
import TemplateLibrary from '@/components/comm/TemplateLibrary'
import BindingsManager from '@/components/comm/BindingsManager'
import ProvidersConfig from '@/components/comm/ProvidersConfig'
import SuppressionList from '@/components/comm/SuppressionList'
import MessagesLog from '@/components/comm/MessagesLog'

type CommSection =
  | 'dashboard'
  | 'events'
  | 'templates'
  | 'bindings'
  | 'providers'
  | 'suppression'
  | 'logs'

const TABS: { id: CommSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: List },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'bindings', label: 'Bindings', icon: Link },
  { id: 'providers', label: 'Providers', icon: Server },
  { id: 'suppression', label: 'Suppression', icon: ShieldOff },
  { id: 'logs', label: 'Messages', icon: MessageSquare },
]

export default function CommPlatformTab() {
  const [section, setSection] = useState<CommSection>('dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Communication Platform</h1>
        <p className="text-sm text-theme-secondary mt-1">
          Manage events, templates, bindings, providers, suppression lists, and message delivery logs.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 border-b border-theme pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = section === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
                active
                  ? 'border-theme bg-[var(--bg-surface)] text-primary'
                  : 'border-transparent text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Section content */}
      <div>
        {section === 'dashboard' && <CommDashboard />}
        {section === 'events' && <EventRegistry />}
        {section === 'templates' && <TemplateLibrary />}
        {section === 'bindings' && <BindingsManager />}
        {section === 'providers' && <ProvidersConfig />}
        {section === 'suppression' && <SuppressionList />}
        {section === 'logs' && <MessagesLog />}
      </div>
    </div>
  )
}
