import { Waves, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
      {/* Glitch-style 404 */}
      <div className="relative mb-6">
        <h1 className="font-mono text-[120px] sm:text-[160px] font-bold leading-none text-zinc-900 select-none">
          404
        </h1>
        <h1 className="font-mono text-[120px] sm:text-[160px] font-bold leading-none text-acid-500/20 absolute inset-0 translate-x-1 translate-y-1 select-none">
          404
        </h1>
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-acid-500/10 border border-acid-500/30 flex items-center justify-center mb-6">
        <Waves className="w-6 h-6 text-acid-500" />
      </div>

      {/* Message */}
      <h2 className="font-sans text-xl font-semibold text-zinc-200 mb-2">
        Signal Lost
      </h2>
      <p className="font-mono text-sm text-zinc-500 max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back to extracting bass.
      </p>

      {/* CTA */}
      <a
        href="/"
        className="
          inline-flex items-center gap-2
          bg-acid-500 hover:bg-acid-400 text-black
          font-mono text-sm font-semibold
          px-6 py-3 rounded-lg
          transition-all duration-200
          shadow-[0_0_20px_rgba(163,230,53,0.2)]
        "
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dumu
      </a>

      {/* Footer note */}
      <p className="font-mono text-[10px] text-zinc-700 mt-12">
        DUMU v1.0 — AI Bass Extraction
      </p>
    </div>
  )
}
