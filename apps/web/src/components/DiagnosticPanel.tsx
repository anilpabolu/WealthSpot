/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Terminal, X, Minimize2, Maximize2, Trash2, Copy, Check, Filter, ChevronDown, ChevronRight, Clipboard } from 'lucide-react'

// ─── Types ────────────────────────────────────────────
export type LogCategory = 'ui' | 'api' | 'db' | 'nav' | 'system' | 'auth'
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  id: number
  step: number
  timestamp: string
  category: LogCategory
  level: LogLevel
  message: string
  detail?: string        // expandable detail / stack trace
  duration?: number      // ms for API / perf entries
  traceId?: string       // correlate related entries
}

// ─── Visual config per category ───────────────────────
const CATEGORY_CONFIG: Record<LogCategory, { label: string; color: string; bg: string }> = {
  ui:     { label: 'UI',     color: 'text-violet-400', bg: 'bg-violet-500/10' },
  api:    { label: 'API',    color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  db:     { label: 'DB',     color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  nav:    { label: 'NAV',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  system: { label: 'SYS',    color: 'text-theme-tertiary',   bg: 'bg-gray-500/10' },
  auth:   { label: 'AUTH',   color: 'text-rose-400',   bg: 'bg-rose-500/10' },
}

const LEVEL_ICONS: Record<LogLevel, string> = {
  info:  '●',
  warn:  '▲',
  error: '✖',
  debug: '◦',
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info:  'text-blue-400',
  warn:  'text-amber-400',
  error: 'text-red-400',
  debug: 'text-theme-secondary',
}

// ─── Global log bus ───────────────────────────────────
let _logId = 0
let _stepCounter = 0
const _listeners = new Set<(entry: LogEntry) => void>()

/** Generate a short trace ID */
function traceId(): string {
  return Math.random().toString(36).slice(2, 8)
}

/** Push a diagnostic log from anywhere in the app */
export function diagLog(
  category: LogCategory,
  level: LogLevel,
  message: string,
  opts?: { detail?: string; duration?: number; traceId?: string }
) {
  const entry: LogEntry = {
    id: ++_logId,
    step: ++_stepCounter,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    category,
    level,
    message,
    ...opts,
  }
  _listeners.forEach((fn) => fn(entry))
}

/** Start an API trace — returns traceId and a done() callback */
export function diagApiTrace(method: string, url: string) {
  const tid = traceId()
  const start = performance.now()
  diagLog('api', 'info', `→ ${method.toUpperCase()} ${url}`, { traceId: tid })
  return {
    traceId: tid,
    done(status: number, ok: boolean, detail?: string) {
      const ms = Math.round(performance.now() - start)
      diagLog(
        'api',
        ok ? 'info' : 'error',
        `← ${status} ${url} (${ms}ms)`,
        { traceId: tid, duration: ms, detail }
      )
    },
    fail(errorMsg: string) {
      const ms = Math.round(performance.now() - start)
      diagLog('api', 'error', `✖ ${method.toUpperCase()} ${url} — ${errorMsg} (${ms}ms)`, {
        traceId: tid,
        duration: ms,
        detail: errorMsg,
      })
    },
  }
}

// ─── Component ────────────────────────────────────────
export default function DiagnosticPanel() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeCategories, setActiveCategories] = useState<Set<LogCategory>>(
    new Set(['ui', 'api', 'db', 'nav', 'system'])
  )
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(
    new Set(['info', 'warn', 'error', 'debug'])
  )
  const [searchText, setSearchText] = useState('')
  const [issueType, setIssueType] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState(false)
  const [copiedEntryId, setCopiedEntryId] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-499), entry]) // keep max 500
  }, [])

  useEffect(() => {
    _listeners.add(addLog)
    return () => { _listeners.delete(addLog) }
  }, [addLog])

  // ─── Console hooks + boot logs ────────────────────
  useEffect(() => {
    const origWarn = console.warn
    const origError = console.error

    console.warn = (...args: unknown[]) => {
      diagLog('system', 'warn', args.map(String).join(' '))
      origWarn.apply(console, args)
    }
    console.error = (...args: unknown[]) => {
      diagLog('system', 'error', args.map(String).join(' '))
      origError.apply(console, args)
    }

    const logNav = () => diagLog('nav', 'info', `Browser navigated → ${window.location.pathname}`)
    window.addEventListener('popstate', logNav)

    diagLog('system', 'info', 'Diagnostic panel v2 initialized')
    diagLog('system', 'info', `Environment: ${import.meta.env.MODE}`)
    diagLog('system', 'debug', `Viewport: ${window.innerWidth}×${window.innerHeight}`)
    diagLog('system', 'debug', `UA: ${navigator.userAgent.slice(0, 80)}…`)

    return () => {
      console.warn = origWarn
      console.error = origError
      window.removeEventListener('popstate', logNav)
    }
  }, [])

  // ─── Performance observer ─────────────────────────
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 200) {
            diagLog('ui', 'warn', `Long task: ${Math.round(entry.duration)}ms`, {
              duration: Math.round(entry.duration),
            })
          }
        }
      })
      observer.observe({ type: 'longtask', buffered: true })
      return () => observer.disconnect()
    } catch { /* unsupported */ }
  }, [])

  // ─── Auto-scroll ──────────────────────────────────
  useEffect(() => {
    if (scrollRef.current && open && !minimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, open, minimized])

  // ─── Derived filtered logs ────────────────────────
  const filteredLogs = logs.filter((l) => {
    if (!activeCategories.has(l.category)) return false
    if (!activeLevels.has(l.level)) return false
    if (searchText && !l.message.toLowerCase().includes(searchText.toLowerCase())) return false
    if (issueType === 'api_errors' && !(l.category === 'api' && l.level === 'error')) return false
    if (issueType === 'long_tasks' && !(l.category === 'ui' && l.level === 'warn' && l.message.startsWith('Long task'))) return false
    if (issueType === 'navigation' && l.category !== 'nav') return false
    if (issueType === 'console_errors' && !(l.category === 'system' && (l.level === 'error' || l.level === 'warn'))) return false
    return true
  })

  // ─── Handlers ─────────────────────────────────────
  const toggleCategory = (cat: LogCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  const toggleLevel = (lvl: LogLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev)
      if (next.has(lvl)) next.delete(lvl); else next.add(lvl)
      return next
    })
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleCopy = async () => {
    const text = filteredLogs
      .map(
        (e) =>
          `[${e.step.toString().padStart(3, '0')}] ${e.timestamp} [${CATEGORY_CONFIG[e.category].label}] ${e.level.toUpperCase()} ${e.message}${
            e.detail ? `\n    └─ ${e.detail}` : ''
          }${e.duration ? ` (${e.duration}ms)` : ''}${e.traceId ? ` trace:${e.traceId}` : ''}`
      )
      .join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleClear = () => {
    setLogs([])
    _stepCounter = 0
    diagLog('system', 'info', 'Logs cleared')
  }

  const handleCopyEntry = async (entry: LogEntry, e: React.MouseEvent) => {
    e.stopPropagation()
    const lines = [
      `Step:      ${entry.step.toString().padStart(3, '0')}`,
      `Time:      ${entry.timestamp}`,
      `Category:  ${CATEGORY_CONFIG[entry.category].label}`,
      `Level:     ${entry.level.toUpperCase()}`,
      `Message:   ${entry.message}`,
    ]
    if (entry.duration != null) lines.push(`Duration:  ${entry.duration}ms`)
    if (entry.traceId) lines.push(`Trace ID:  ${entry.traceId}`)
    if (entry.detail) lines.push(`Detail:\n${entry.detail}`)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopiedEntryId(entry.id)
    setTimeout(() => setCopiedEntryId(null), 1200)
  }

  // ─── Floating trigger ─────────────────────────────
  if (!open) {
    const errorCount = logs.filter((l) => l.level === 'error').length
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] h-10 w-10 rounded-full bg-gray-900 text-green-400 flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors border border-gray-700"
        title="Open Diagnostics"
      >
        <Terminal className="h-4 w-4" />
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
            {errorCount}
          </span>
        )}
      </button>
    )
  }

  // ─── Panel ────────────────────────────────────────
  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col bg-gray-950 border border-gray-700 shadow-2xl"
      style={{
        width: minimized ? 260 : 520,
        height: minimized ? 36 : 420,
        borderRadius: 8,
        fontFamily: '"DM Mono", "JetBrains Mono", monospace',
      }}
    >
      {/* ── Title bar ──────────────────────────────── */}
      <div className="flex items-center justify-between px-3 h-9 bg-gray-900 rounded-t-lg border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-green-400" />
          <span className="text-xs font-bold text-theme-tertiary tracking-wide">DIAGNOSTICS</span>
          <span className="text-[10px] text-theme-secondary">{filteredLogs.length}/{logs.length}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setShowFilters(!showFilters)} className="p-1 text-theme-secondary hover:text-theme-tertiary transition-colors" title="Filter categories">
            <Filter className="h-3 w-3" />
          </button>
          <button onClick={handleCopy} className="p-1 text-theme-secondary hover:text-theme-tertiary transition-colors" title="Copy filtered logs">
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </button>
          <button onClick={handleClear} className="p-1 text-theme-secondary hover:text-theme-tertiary transition-colors" title="Clear all logs">
            <Trash2 className="h-3 w-3" />
          </button>
          <button onClick={() => setMinimized(!minimized)} className="p-1 text-theme-secondary hover:text-theme-tertiary transition-colors" title={minimized ? 'Expand' : 'Minimize'}>
            {minimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
          <button onClick={() => { setOpen(false); setMinimized(false) }} className="p-1 text-theme-secondary hover:text-red-400 transition-colors" title="Close">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ── Filter bar ────────────────────────── */}
          {showFilters && (
            <div className="flex flex-col gap-1.5 px-3 py-2 border-b border-gray-800 bg-gray-900/50">
              {/* Category filters */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[9px] text-theme-secondary uppercase tracking-wide w-10 shrink-0">Layer</span>
                {(Object.keys(CATEGORY_CONFIG) as LogCategory[]).map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat]
                  const active = activeCategories.has(cat)
                  const count = logs.filter((l) => l.category === cat).length
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 ${
                        active
                          ? `${cfg.bg} ${cfg.color} border border-current/20`
                          : 'text-theme-secondary bg-gray-800/50 border border-gray-800 line-through'
                      }`}
                    >
                      {cfg.label}
                      <span className="text-[9px] opacity-60">{count}</span>
                    </button>
                  )
                })}
              </div>
              {/* Level filters */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[9px] text-theme-secondary uppercase tracking-wide w-10 shrink-0">Level</span>
                {(['info', 'warn', 'error', 'debug'] as LogLevel[]).map((lvl) => {
                  const active = activeLevels.has(lvl)
                  const count = logs.filter((l) => l.level === lvl).length
                  return (
                    <button
                      key={lvl}
                      onClick={() => toggleLevel(lvl)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all flex items-center gap-1 ${
                        active
                          ? `${LEVEL_COLORS[lvl]} bg-gray-800 border border-current/20`
                          : 'text-theme-secondary bg-gray-800/50 border border-gray-800 line-through'
                      }`}
                    >
                      {LEVEL_ICONS[lvl]} {lvl}
                      <span className="text-[9px] opacity-60">{count}</span>
                    </button>
                  )
                })}
              </div>
              {/* Issue type + search */}
              <div className="flex items-center gap-2">
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="text-[10px] bg-gray-800 text-theme-tertiary border border-gray-700 rounded px-1.5 py-0.5 outline-none"
                >
                  <option value="all">All Issues</option>
                  <option value="api_errors">API Errors</option>
                  <option value="long_tasks">Long Tasks</option>
                  <option value="navigation">Navigation</option>
                  <option value="console_errors">Console Errors</option>
                </select>
                <input
                  type="text"
                  placeholder="Search messages…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1 text-[10px] bg-gray-800 text-theme-tertiary border border-gray-700 rounded px-2 py-0.5 outline-none placeholder-gray-600"
                />
              </div>
            </div>
          )}

          {/* ── Log entries ────────────────────────── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden text-[11px] leading-[18px]">
            {filteredLogs.length === 0 && (
              <p className="text-theme-secondary text-center py-10">No log entries match the active filters.</p>
            )}
            {filteredLogs.map((entry) => {
              const cfg = CATEGORY_CONFIG[entry.category]
              const isExpanded = expandedIds.has(entry.id)
              const hasDetail = !!entry.detail || !!entry.traceId

              return (
                <div key={entry.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] group/entry">
                  <div
                    className={`flex items-start gap-1.5 px-2 py-1 ${hasDetail ? 'cursor-pointer' : ''}`}
                    onClick={hasDetail ? () => toggleExpand(entry.id) : undefined}
                  >
                    {/* Step number */}
                    <span className="text-theme-primary shrink-0 w-7 text-right tabular-nums">
                      {entry.step.toString().padStart(3, '0')}
                    </span>

                    {/* Timestamp */}
                    <span className="text-theme-secondary shrink-0">{entry.timestamp}</span>

                    {/* Category badge */}
                    <span className={`shrink-0 px-1.5 py-px rounded text-[9px] font-bold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>

                    {/* Level indicator */}
                    <span className={`shrink-0 ${LEVEL_COLORS[entry.level]}`}>
                      {LEVEL_ICONS[entry.level]}
                    </span>

                    {/* Message */}
                    <span className="text-theme-tertiary break-all flex-1">
                      {entry.message}
                      {entry.duration != null && (
                        <span className="text-theme-secondary ml-1">({entry.duration}ms)</span>
                      )}
                    </span>

                    {/* Expand chevron */}
                    {hasDetail && (
                      <span className="shrink-0 text-theme-secondary">
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </span>
                    )}

                    {/* Per-entry copy */}
                    <button
                      onClick={(e) => handleCopyEntry(entry, e)}
                      className="shrink-0 p-0.5 text-theme-primary hover:text-theme-tertiary transition-colors opacity-0 group-hover/entry:opacity-100"
                      title="Copy this entry"
                    >
                      {copiedEntryId === entry.id
                        ? <Check className="h-3 w-3 text-green-400" />
                        : <Clipboard className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-2 pb-2 pl-[76px]">
                      {entry.traceId && (
                        <div className="text-[10px] text-theme-secondary">
                          trace: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{entry.traceId}</span>
                        </div>
                      )}
                      {entry.detail && (
                        <pre className="text-[10px] text-theme-secondary whitespace-pre-wrap mt-0.5 bg-gray-900 rounded px-2 py-1 border border-gray-800">
                          {entry.detail}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Status bar ─────────────────────────── */}
          <div className="flex items-center justify-between px-3 h-6 border-t border-gray-800 bg-gray-900/50 text-[9px] text-theme-secondary shrink-0 rounded-b-lg">
            <span>
              {logs.filter((l) => l.level === 'error').length} errors
              {' · '}
              {logs.filter((l) => l.level === 'warn').length} warnings
            </span>
            <span>Step {_stepCounter}</span>
          </div>
        </>
      )}
    </div>
  )
}
