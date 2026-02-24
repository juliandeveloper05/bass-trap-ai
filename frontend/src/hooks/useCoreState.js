import { create } from 'zustand'

// Global state store using Zustand — single source of truth for the entire UI.
// The app runs as a Finite State Machine (FSM) through these phases:
// idle → dragging → uploading → processing → done (or error)
export const useCoreState = create((set, get) => ({

  phase: 'idle',      // Current FSM phase — drives 3D animations and UI rendering
  progress: 0,        // Upload + processing progress (0–100)
  logs: [],           // Terminal log entries: [{ ts: timestamp, msg: string }]
  midiB64: null,      // Base64-encoded .mid file returned by the backend
  filename: null,     // Original uploaded filename, used for the download

  setPhase:    (phase) => set({ phase }),
  setProgress: (p)     => set({ progress: p }),

  // Appends a new log line without mutating the existing array
  pushLog: (msg) => set((s) => ({
    logs: [...s.logs, { ts: Date.now(), msg }]
  })),

  // Called on success — stores the MIDI payload and advances to 'done' atomically
  setResult: (midiB64, filename) => set({
    midiB64, filename, phase: 'done', progress: 100
  }),

  // Reads current logs via get() before appending the error message
  setError: (msg) => set({ phase: 'error', logs: [
    ...get().logs, { ts: Date.now(), msg: `[ERROR] ${msg}` }
  ]}),

  // Full reset — triggered by the "New Session" button
  reset: () => set({ phase: 'idle', progress: 0, logs: [], midiB64: null, filename: null }),
}))