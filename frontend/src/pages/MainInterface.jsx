import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useCoreState }     from '../../hooks/useCoreState'
import { uploadAndExtract } from '../../lib/api'
import { downloadMidi }     from '../../lib/midiDownload'
import { useWebGLSupport }  from '../../hooks/useWebGLSupport'
import DumuCore    from '../core/DumuCore'
import CoreFallback from '../core/CoreFallback' // CSS-only version for mobile/no-WebGL
import DumuLogo    from '../ui/DumuLogo'
import TerminalLog from '../ui/TerminalLog'
import GhostButton from '../ui/GhostButton'
import Background  from '../layout/Background'
import Scanlines   from '../layout/Scanlines'

const ACCEPTED_TYPES = { 'audio/*': ['.mp3', '.wav', '.flac', '.aiff', '.m4a'] }

export default function MainInterface() {
  const { phase, midiB64, filename, reset, setPhase } = useCoreState()
  const { supported, isMobile } = useWebGLSupport()

  // useCallback memoizes this function so react-dropzone doesn't re-render
  // unnecessarily every time the parent component re-renders.
  const onDrop = useCallback((files) => {
    if (!files[0]) return
    uploadAndExtract(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
    // Disable the drop zone while actively processing or uploading
    disabled: !['idle', 'error'].includes(phase),
    onDragEnter: () => setPhase('dragging'),
    onDragLeave: () => setPhase('idle'),
  })

  // If WebGL isn't available or the user is on mobile, skip Three.js entirely
  const use3D = supported && !isMobile

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center gap-10 overflow-hidden bg-base">
      <Background />
      <Scanlines />
      <DumuLogo />

      {/* The drop zone wraps the 3D core — the entire sphere is the upload target */}
      <div {...getRootProps()} className="relative w-80 h-80 cursor-pointer" style={{ outline: 'none' }}>
        <input {...getInputProps()} />
        {use3D ? <DumuCore /> : <CoreFallback phase={phase} />}

        {/* Status text below the core — updates reactively with the FSM phase */}
        <div className="absolute -bottom-8 inset-x-0 text-center font-mono text-[10px] tracking-ultra text-muted">
          {phase === 'idle'       && '// DROP AUDIO FILE OR CLICK'}
          {phase === 'dragging'   && '// RELEASE TO INITIALIZE'}
          {phase === 'uploading'  && '// TRANSMITTING...'}
          {phase === 'processing' && '// NEURAL EXTRACTION ACTIVE'}
          {phase === 'done'       && '// EXTRACTION COMPLETE'}
          {phase === 'error'      && '// PROCESS FAILED'}
        </div>
      </div>

      <TerminalLog />

      <div className="flex gap-4">
        {/* Download button only renders after a successful extraction */}
        {phase === 'done' && (
          <GhostButton variant="electric" onClick={() => downloadMidi(midiB64, filename)}>
            Download .mid
          </GhostButton>
        )}
        {/* Reset button appears on both 'done' and 'error' so the user isn't stuck */}
        {['done', 'error'].includes(phase) && (
          <GhostButton variant="purple" onClick={reset}>
            New Session
          </GhostButton>
        )}
      </div>

      {/* Version/stack info — fixed to bottom, very low opacity */}
      <div className="fixed bottom-4 font-mono text-[9px] text-muted/40 tracking-ultra">
        DUMU v1.0.0 — DEMUCS-4 / BASIC-PITCH / LIBROSA
      </div>
    </div>
  )
}