import { useCallback, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

const ALLOWED_EXTS = ['.mp3', '.wav', '.flac', '.ogg', '.aiff', '.m4a']
const MAX_SIZE_MB  = 100

export default function DropZone({ onFile, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }, [disabled, onFile])

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        animate-fade-in
        border-2 border-dashed rounded-xl p-10 text-center
        transition-all duration-200 cursor-pointer
        ${disabled
          ? 'cursor-not-allowed opacity-40 border-zinc-800'
          : isDragging
          ? 'border-acid-400 bg-acid-500/5'
          : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTS.join(',')}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-acid-400' : 'text-zinc-600'}`} />
      <p className="font-mono text-sm text-zinc-400">
        {isDragging ? 'Drop it here' : 'Drag & drop or click to upload'}
      </p>
      <p className="font-mono text-xs text-zinc-600 mt-1.5">
        MP3, WAV, FLAC, OGG · Max {MAX_SIZE_MB}MB
      </p>
    </div>
  )
}