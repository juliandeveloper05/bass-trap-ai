import { CheckCircle2, Download, RotateCcw } from 'lucide-react'

export default function ResultCard({ result, onDownload, onReset }) {
  return (
    <div className="animate-fade-in rounded-xl border border-acid-500/30 bg-acid-500/5 p-5 space-y-4">
      {/* Success header */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-acid-400" />
        <span className="font-mono text-sm font-semibold text-acid-400">
          Extraction Complete
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-900/80 p-3 text-center">
          <p className="font-mono text-xs text-zinc-500 mb-1">Detected BPM</p>
          <p className="font-mono text-2xl font-bold text-acid-400">{result.bpm}</p>
        </div>
        <div className="rounded-lg bg-zinc-900/80 p-3 text-center">
          <p className="font-mono text-xs text-zinc-500 mb-1">Source File</p>
          <p className="font-mono text-sm font-semibold text-zinc-200 truncate">
            {result.filename}
          </p>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onDownload}
        className="
          w-full flex items-center justify-center gap-2
          bg-acid-500 hover:bg-acid-400 text-black
          font-mono text-sm font-semibold py-3 rounded-lg
          transition-all duration-200
          shadow-[0_0_20px_rgba(163,230,53,0.2)]
        "
      >
        <Download className="w-4 h-4" />
        Download MIDI
      </button>
      <button
        onClick={onReset}
        className="
          w-full flex items-center justify-center gap-2
          font-mono text-xs text-zinc-500 hover:text-zinc-300
          py-2 transition-colors
        "
      >
        <RotateCcw className="w-3 h-3" />
        Process another file
      </button>
    </div>
  )
}