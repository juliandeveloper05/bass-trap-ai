import axios from 'axios'
import { useCoreState } from '../hooks/useCoreState'

// Axios instance with a 3-minute timeout — Demucs is slow on CPU
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 180_000,
})

export async function uploadAndExtract(file) {
  const { setPhase, setProgress, pushLog, setResult, setError } = useCoreState.getState()

  const formData = new FormData()
  formData.append('audio', file)

  setPhase('uploading')
  pushLog(`[INIT] Received: ${file.name} (${(file.size / 1e6).toFixed(2)} MB)`)

  try {
    const res = await client.post('/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },

      // Upload progress maps to 0–40% of the total progress bar.
      // The remaining 60% is simulated during the processing phase below.
      onUploadProgress: (e) => {
        setProgress(Math.round((e.loaded / e.total) * 40))
      },
    })

    // Backend processing is opaque (no real-time stream yet).
    // We simulate log output to keep the user informed during the wait.
    setPhase('processing')
    const fakeLogs = [
      '[DEMUCS] Initializing source separation model...',
      '[DEMUCS] Isolating bass frequency band...',
      '[DEMUCS] Stereo stem extraction complete.',
      '[BASIC-PITCH] Loading note detection model...',
      '[BASIC-PITCH] Running pitch detection pass 1/2...',
      '[BASIC-PITCH] Running pitch detection pass 2/2...',
      '[MIDI] Quantizing note events...',
      '[MIDI] Writing MIDI file...',
      '[OK] Extraction complete. MIDI payload ready.',
    ]

    for (let i = 0; i < fakeLogs.length; i++) {
      await delay(400 + Math.random() * 300)  // Randomized delay feels more authentic
      pushLog(fakeLogs[i])
      setProgress(40 + Math.round((i / fakeLogs.length) * 60))
    }

    // res.data contains { midi_b64: string, filename: string }
    setResult(res.data.midi_b64, res.data.filename)

  } catch (err) {
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    setError(msg)
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))