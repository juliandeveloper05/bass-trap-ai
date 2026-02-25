/**
 * bassApi.js
 * Centralized API module. All fetch logic lives here — no raw fetch calls
 * scattered across components. Returns typed result objects so the UI never
 * has to parse raw Response objects.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

/**
 * Uploads an audio file and starts the full extraction pipeline.
 *
 * @param {File} file - The audio file to process
 * @param {AbortSignal} [signal] - Optional AbortController signal for cancellation
 * @returns {Promise<{ bpm: number, midi_b64: string, filename: string }>}
 */
export async function extractBass(file, signal) {
  const formData = new FormData()
  formData.append('audio_file', file)

  const response = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    body: formData,
    signal,
  })

  // Always parse the JSON body, even on error — FastAPI puts detail there
  const data = await response.json().catch(() => ({
    detail: `Server returned ${response.status} with no JSON body`,
  }))

  if (!response.ok) {
    // Throw a structured error so the caller can display the backend message
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : JSON.stringify(data.detail)
    throw new ApiError(message, response.status)
  }

  return data
}

/**
 * Structured error class so UI can differentiate API errors from
 * network failures (e.g. no `status` on a TypeError).
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}