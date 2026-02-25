/**
 * useProgressStream.js
 *
 * Hook that opens an SSE connection to the backend progress endpoint.
 * Uses the native EventSource Web API — no external dependencies.
 *
 * Usage:
 *   const { logs, progress, done, error } = useProgressStream(jobId)
 */
import { useEffect, useState, useRef } from 'react'
import { API_ORIGIN } from '../api/bassApi'

export function useProgressStream(jobId) {
  const [logs, setLogs]         = useState([])
  const [progress, setProgress] = useState(0)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState(null)
  const esRef = useRef(null)

  useEffect(() => {
    if (!jobId) return

    // Reset state for new job
    setLogs([])
    setProgress(0)
    setDone(false)
    setError(null)

    const es = new EventSource(`${API_ORIGIN}/api/progress/${jobId}`)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const { progress: pct, message } = JSON.parse(e.data)

        // Error event from backend (progress = -1)
        if (pct < 0) {
          setError(message)
          setLogs((prev) => [...prev, message])
          es.close()
          return
        }

        setProgress(pct)
        setLogs((prev) => [...prev, message])

        if (pct >= 100) {
          setDone(true)
          es.close()
        }
      } catch {
        // Malformed event — skip
      }
    }

    es.onerror = () => {
      setError('⚠️ Stream connection lost.')
      setLogs((prev) => [...prev, '⚠️ Stream connection lost.'])
      es.close()
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [jobId])

  return { logs, progress, done, error }
}
