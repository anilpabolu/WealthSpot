import { useState } from 'react'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useCommMessages, useCommMessageDetail } from '@/hooks/useCommMessages'
import type { CommMessage } from '@/hooks/useCommMessages'

const CHANNELS = ['email', 'sms', 'whatsapp', 'in_app']
const STATUSES = ['pending', 'sending', 'sent', 'delivered', 'failed']

function StatusIcon({ status }: { status: string }) {
  if (status === 'sent' || status === 'delivered') return <CheckCircle className="h-4 w-4 text-emerald-500" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />
  return <Clock className="h-4 w-4 text-amber-500" />
}

function MessageRow({
  message,
  onSelect,
  selected,
}: {
  message: CommMessage
  onSelect: (id: string) => void
  selected: boolean
}) {
  return (
    <tr
      className={`border-b border-theme cursor-pointer transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-theme-surface/50'}`}
      onClick={() => onSelect(message.id)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <StatusIcon status={message.status} />
          <span className="text-xs font-medium text-theme-primary capitalize">{message.status}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm capitalize text-theme-secondary">{message.channel}</td>
      <td className="py-3 px-4 text-sm text-theme-primary truncate max-w-[200px]">{message.recipient}</td>
      <td className="py-3 px-4 text-sm text-theme-secondary truncate max-w-[200px]">{message.subject ?? '—'}</td>
      <td className="py-3 px-4 text-xs text-theme-tertiary">
        {new Date(message.created_at).toLocaleString()}
      </td>
    </tr>
  )
}

export default function MessagesLog() {
  const [filterChannel, setFilterChannel] = useState<string | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: messages, isLoading } = useCommMessages(filterChannel, filterStatus, 0, 100)
  const { data: detail } = useCommMessageDetail(selectedId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-theme-primary">Messages Log</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setFilterChannel(undefined)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!filterChannel ? 'border-primary text-primary bg-primary/5' : 'border-theme text-theme-secondary'}`}
          >
            All channels
          </button>
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${filterChannel === ch ? 'border-primary text-primary bg-primary/5' : 'border-theme text-theme-secondary'}`}
            >
              {ch}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterStatus(undefined)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!filterStatus ? 'border-primary text-primary bg-primary/5' : 'border-theme text-theme-secondary'}`}
          >
            All statuses
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${filterStatus === s ? 'border-primary text-primary bg-primary/5' : 'border-theme text-theme-secondary'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-theme overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-theme-surface border-b border-theme">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Channel</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Recipient</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-theme-tertiary">Sent at</th>
              </tr>
            </thead>
            <tbody>
              {messages?.map((msg) => (
                <MessageRow
                  key={msg.id}
                  message={msg}
                  onSelect={setSelectedId}
                  selected={selectedId === msg.id}
                />
              ))}
            </tbody>
          </table>
        </div>

        {selectedId && detail && (
          <div className="w-80 shrink-0 rounded-xl border border-theme bg-[var(--bg-surface)] p-4 space-y-3 self-start">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-theme-primary">Detail</p>
              <button onClick={() => setSelectedId(null)} className="text-xs text-theme-tertiary hover:text-theme-primary">
                ✕
              </button>
            </div>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-theme-tertiary">ID</dt>
                <dd className="font-mono text-theme-secondary break-all">{detail.id}</dd>
              </div>
              <div>
                <dt className="text-theme-tertiary">Correlation ID</dt>
                <dd className="font-mono text-theme-secondary break-all">{detail.correlation_id ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-theme-tertiary">Locale</dt>
                <dd className="text-theme-secondary">{detail.locale}</dd>
              </div>
              <div>
                <dt className="text-theme-tertiary">Attempts</dt>
                <dd className="text-theme-secondary">{detail.attempts}</dd>
              </div>
              {detail.error && (
                <div>
                  <dt className="text-red-500">Error</dt>
                  <dd className="text-red-400 break-words">{detail.error}</dd>
                </div>
              )}
              {detail.payload_snapshot && (
                <div>
                  <dt className="text-theme-tertiary mb-1">Payload</dt>
                  <pre className="bg-theme-surface rounded p-2 overflow-x-auto text-theme-secondary text-xs max-h-48">
                    {JSON.stringify(detail.payload_snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
