import { useState, useCallback, useRef, useEffect } from 'react'
import { extractBass } from '../api/bassApi'

/** FSM status constants — exported so App.jsx can reference them */
export const Status = Object.freeze({
  IDLE:       'idle',
  PROCESSING: 'processing',
  DONE:       'done',
  ERROR:      'error',
})

const LOG_STEPS = [
  { delay: 0,     text: '🎵 Reading audio file...',                         pct: 5  },
  { delay: 3000,  text: '📊 Detecting BPM with Librosa...',                 pct: 10 },
  { delay: 8000,  text: '🤖 Demucs isolating bass stem (this takes a while)...', pct: 20 },
  { delay: 30000, text: '⏳ Demucs is still processing...',                  pct: 40 },
  { delay: 60000, text: '⏳ Still working… CPU processing takes time.',      pct: 55 },
  { delay: 90000, text: '🎹 Almost there… converting to MIDI soon.',        pct: 65 },
  { delay: 120000,text: '🎹 Converting bass audio to MIDI with Basic Pitch...',  pct: 80 },
  { delay: 180000,text: '✨ Finalizing and encoding MIDI...',                pct: 90 },
]

/**
 * Custom hook that owns all extraction-related async state.
 * Returns { status, logs, result, error, progress, startExtraction, downloadResult, reset }
 */
export function useExtraction() {
  const [status, setStatus]     = useState(Status.IDLE)
  const [logs,   setLogs]       = useState([])
  const [result, setResult]     = useState(null)
  const [error,  setError]      = useState(null)
  const [progress, setProgress] = useState(0)
  const timersRef = useRef([])

  const pushLog = useCallback((text) => {
    setLogs((prev) => [...prev, text])
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const startExtraction = useCallback(async (file) => {
    // Reset state
    setStatus(Status.PROCESSING)
    setError(null)
    setResult(null)
    setLogs([])
    setProgress(0)

    // Start simulated log steps with progress updates
    clearTimers()
    timersRef.current = LOG_STEPS.map(({ delay, text, pct }) =>
      setTimeout(() => {
        pushLog(text)
        setProgress(pct)
      }, delay)
    )

    try {
      const data = await extractBass(file)
      pushLog('🎉 Done! MIDI is ready.')
      setProgress(100)
      setResult(data)
      setStatus(Status.DONE)
    } catch (err) {
      const msg = err.message?.includes('Failed to fetch')
        ? 'Cannot reach the backend. Is the server running?'
        : err.message || 'Unknown error'
      setError(msg)
      setStatus(Status.ERROR)
      setProgress(0)
      pushLog(`❌ Error: ${msg}`)
    } finally {
      clearTimers()
    }
  }, [pushLog, clearTimers])

  const downloadResult = useCallback(() => {
    if (!result?.midi_b64) return
    const binary = atob(result.midi_b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'audio/midi' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${result.filename?.replace(/\.[^.]+$/, '') || 'bass'}_extracted.mid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }, [result])

  const reset = useCallback(() => {
    clearTimers()
    setStatus(Status.IDLE)
    setLogs([])
    setResult(null)
    setError(null)
    setProgress(0)
  }, [clearTimers])

  return { status, logs, result, error, progress, startExtraction, downloadResult, reset }
}