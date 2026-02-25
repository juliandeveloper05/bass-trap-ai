import { useState, useCallback, useRef } from 'react'
import { extractBass } from '../api/bassApi'

/** FSM status constants — exported so App.jsx can reference them */
export const Status = Object.freeze({
  IDLE:       'idle',
  PROCESSING: 'processing',
  DONE:       'done',
  ERROR:      'error',
})

const LOG_STEPS = [
  { delay: 0,     text: '🎵 Reading audio file...' },
  { delay: 2000,  text: '📊 Detecting BPM with Librosa...' },
  { delay: 5000,  text: '🤖 Demucs isolating bass stem (this takes a while)...' },
  { delay: 15000, text: '⏳ Demucs is still processing...' },
  { delay: 30000, text: '🎹 Converting bass audio to MIDI with Basic Pitch...' },
  { delay: 45000, text: '✨ Finalizing and encoding MIDI...' },
]

/**
 * Custom hook that owns all extraction-related async state.
 * Returns { status, logs, result, error, startExtraction, downloadResult, reset }
 */
export function useExtraction() {
  const [status, setStatus] = useState(Status.IDLE)
  const [logs,   setLogs]   = useState([])
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)
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

    // Start simulated log steps
    clearTimers()
    timersRef.current = LOG_STEPS.map(({ delay, text }) =>
      setTimeout(() => pushLog(text), delay)
    )

    try {
      const data = await extractBass(file)
      pushLog('🎉 Done! MIDI is ready.')
      setResult(data)
      setStatus(Status.DONE)
    } catch (err) {
      const msg = err.message?.includes('Failed to fetch')
        ? 'Cannot reach the backend. Is the server running?'
        : err.message || 'Unknown error'
      setError(msg)
      setStatus(Status.ERROR)
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
  }, [clearTimers])

  return { status, logs, result, error, startExtraction, downloadResult, reset }
}