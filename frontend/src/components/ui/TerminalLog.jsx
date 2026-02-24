import { useEffect, useRef } from 'react'
import { useCoreState } from '../../hooks/useCoreState'

// Formats a Unix timestamp as HH:MM:SS.ms — firmware log style
const fmtTime = (ts) => {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).slice(0,2)}`
}

export default function TerminalLog() {
  const logs      = useCoreState((s) => s.logs)
  const bottomRef = useRef()

  // Auto-scroll to the latest log entry every time a new one appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (!logs.length) return null

  return (
    <div className="w-full max-w-lg font-mono text-[11px] bg-black/40 border border-dim p-4 max-h-48 overflow-y-auto"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div className="text-muted mb-2 tracking-wide">// PROCESS LOG</div>
      {logs.map((l, i) => (
        <div key={i} className="flex gap-3 leading-relaxed">
          <span className="text-muted shrink-0">{fmtTime(l.ts)}</span>
          {/* Color-coded by message prefix for quick scanning */}
          <span className={
            l.msg.startsWith('[ERROR]') ? 'text-plasma' :
            l.msg.startsWith('[OK]')    ? 'text-electric' :
            'text-gray-400'
          }>{l.msg}</span>
        </div>
      ))}
      <div ref={bottomRef} /> {/* Invisible anchor for auto-scroll */}
    </div>
  )
}