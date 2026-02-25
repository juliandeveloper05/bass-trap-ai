import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

export default function LogConsole({ logs, isLive = false }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (!logs.length) return null

  return (
    <div className="animate-fade-in rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 max-h-48 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-3.5 h-3.5 text-zinc-500" />
        <span className="font-mono text-xs text-zinc-500 tracking-wide">
          Processing Log
        </span>
        {isLive && (
          <span className="w-1.5 h-1.5 rounded-full bg-acid-500 animate-blink ml-auto" />
        )}
      </div>
      {logs.map((log, i) => (
        <p key={i} className={`font-mono text-xs leading-relaxed ${
          log.startsWith('❌') ? 'text-red-400' :
          log.startsWith('🎉') ? 'text-acid-400' :
          'text-zinc-400'
        }`}>
          {log}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}