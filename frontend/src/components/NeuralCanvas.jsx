/**
 * NeuralCanvas.jsx
 *
 * Real-time neural network architecture visualization.
 * Shows Demucs (U-Net + Transformer) and Basic Pitch (CNN) architectures
 * with animated data particles flowing through the network, synced to
 * the actual pipeline progress via SSE events.
 *
 * Progress mapping:
 *   0–10%   → BPM Detection (waveform analysis)
 *   10–84%  → Demucs htdemucs (U-Net encoder → Transformer → decoder)
 *   85–100% → Basic Pitch (CNN layers)
 */
import { useEffect, useRef, useMemo } from 'react'

// ── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#050505',
  nodeFill: 'rgba(163, 230, 53, 0.08)',
  nodeStroke: 'rgba(163, 230, 53, 0.25)',
  nodeActive: 'rgba(163, 230, 53, 0.6)',
  nodeGlow: 'rgba(163, 230, 53, 0.15)',
  connection: 'rgba(163, 230, 53, 0.08)',
  connectionActive: 'rgba(163, 230, 53, 0.3)',
  particle: 'rgba(163, 230, 53, 0.9)',
  particleGlow: 'rgba(163, 230, 53, 0.4)',
  label: 'rgba(163, 230, 53, 0.5)',
  labelActive: 'rgba(163, 230, 53, 0.9)',
  dimText: 'rgba(255, 255, 255, 0.15)',
  skipConn: 'rgba(80, 180, 255, 0.12)',
  skipConnActive: 'rgba(80, 180, 255, 0.35)',
}

// ── Network Architecture Definitions ─────────────────────────────────────────

/**
 * Demucs htdemucs: Hybrid Transformer U-Net
 * Encoder (temporal conv) → Transformer bottleneck → Decoder (transposed conv)
 * Skip connections between encoder and decoder layers
 */
function buildDemucsArch(w, h) {
  const padX = 50, padY = 30
  const usableW = w - padX * 2
  const usableH = h - padY * 2
  const centerY = h / 2

  // Encoder layers (left side, getting smaller)
  const encoderSizes = [1.0, 0.85, 0.7, 0.55]
  // Transformer block (center)
  // Decoder layers (right side, getting bigger)
  const decoderSizes = [0.55, 0.7, 0.85, 1.0]

  const totalCols = encoderSizes.length + 2 + decoderSizes.length // +2 for transformer
  const colW = usableW / (totalCols + 1)

  const layers = []
  const connections = []
  const skipConnections = []

  // Build encoder layers
  encoderSizes.forEach((scale, i) => {
    const x = padX + colW * (i + 0.5)
    const layerH = usableH * scale * 0.65
    layers.push({
      id: `enc_${i}`,
      x, y: centerY,
      w: colW * 0.55,
      h: layerH,
      label: i === 0 ? 'Input' : `Enc ${i}`,
      type: 'encoder',
      group: 'encoder',
    })
    if (i > 0) {
      connections.push({ from: `enc_${i - 1}`, to: `enc_${i}` })
    }
  })

  // Transformer blocks (center)
  for (let i = 0; i < 2; i++) {
    const x = padX + colW * (encoderSizes.length + i + 0.5)
    layers.push({
      id: `trans_${i}`,
      x, y: centerY,
      w: colW * 0.6,
      h: usableH * 0.45 * 0.65,
      label: i === 0 ? 'Attn' : 'FFN',
      type: 'transformer',
      group: 'transformer',
    })
  }
  connections.push({ from: `enc_${encoderSizes.length - 1}`, to: 'trans_0' })
  connections.push({ from: 'trans_0', to: 'trans_1' })

  // Build decoder layers
  decoderSizes.forEach((scale, i) => {
    const x = padX + colW * (encoderSizes.length + 2 + i + 0.5)
    const layerH = usableH * scale * 0.65
    layers.push({
      id: `dec_${i}`,
      x, y: centerY,
      w: colW * 0.55,
      h: layerH,
      label: i === decoderSizes.length - 1 ? 'Bass' : `Dec ${i + 1}`,
      type: 'decoder',
      group: 'decoder',
    })
    if (i === 0) {
      connections.push({ from: 'trans_1', to: 'dec_0' })
    } else {
      connections.push({ from: `dec_${i - 1}`, to: `dec_${i}` })
    }
  })

  // Skip connections (U-Net style)
  encoderSizes.forEach((_, i) => {
    const decIdx = decoderSizes.length - 1 - i
    if (decIdx >= 0) {
      skipConnections.push({ from: `enc_${i}`, to: `dec_${decIdx}` })
    }
  })

  return { layers, connections, skipConnections, title: 'Demucs · htdemucs', subtitle: 'U-Net + Transformer · Meta AI' }
}

/**
 * Basic Pitch: CNN for audio-to-MIDI
 * Spectrogram → Conv layers → Dense → Output (pitch, onset, notes)
 */
function buildBasicPitchArch(w, h) {
  const padX = 60, padY = 30
  const usableW = w - padX * 2
  const usableH = h - padY * 2
  const centerY = h / 2

  const layerDefs = [
    { scale: 1.0,  label: 'Spec',    type: 'input' },
    { scale: 0.9,  label: 'Conv 1',  type: 'conv' },
    { scale: 0.8,  label: 'Conv 2',  type: 'conv' },
    { scale: 0.65, label: 'Conv 3',  type: 'conv' },
    { scale: 0.5,  label: 'Conv 4',  type: 'conv' },
    { scale: 0.35, label: 'Dense',   type: 'dense' },
    { scale: 0.7,  label: 'Pitch',   type: 'output' },
    { scale: 0.5,  label: 'Onset',   type: 'output' },
    { scale: 0.5,  label: 'Notes',   type: 'output' },
  ]

  const mainCount = layerDefs.length - 2 // exclude last 2 outputs (branching)
  const colW = usableW / (mainCount + 1)

  const layers = []
  const connections = []

  // Main pipeline layers
  for (let i = 0; i < mainCount; i++) {
    const def = layerDefs[i]
    const x = padX + colW * (i + 0.5)
    layers.push({
      id: `bp_${i}`,
      x, y: centerY,
      w: colW * 0.5,
      h: usableH * def.scale * 0.6,
      label: def.label,
      type: def.type,
      group: 'cnn',
    })
    if (i > 0) {
      connections.push({ from: `bp_${i - 1}`, to: `bp_${i}` })
    }
  }

  // Output branches (Pitch at center, Onset above, Notes below)
  const lastMainX = padX + colW * (mainCount - 0.5)
  const branchX = lastMainX + colW * 1.1

  const outputs = [
    { id: 'bp_pitch', label: 'Pitch', scale: 0.7, yOff: 0 },
    { id: 'bp_onset', label: 'Onset', scale: 0.5, yOff: -usableH * 0.28 },
    { id: 'bp_notes', label: 'Notes', scale: 0.5, yOff: usableH * 0.28 },
  ]

  outputs.forEach(out => {
    layers.push({
      id: out.id,
      x: branchX,
      y: centerY + out.yOff,
      w: colW * 0.45,
      h: usableH * out.scale * 0.35,
      label: out.label,
      type: 'output',
      group: 'output',
    })
    connections.push({ from: `bp_${mainCount - 1}`, to: out.id })
  })

  return { layers, connections, skipConnections: [], title: 'Basic Pitch · CNN', subtitle: 'Audio-to-MIDI · Spotify' }
}

// ── Particle System ──────────────────────────────────────────────────────────

function createParticles(connections, layers, count) {
  const layerMap = {}
  layers.forEach(l => { layerMap[l.id] = l })

  const particles = []
  for (let i = 0; i < count; i++) {
    const connIdx = Math.floor(Math.random() * connections.length)
    const conn = connections[connIdx]
    const from = layerMap[conn.from]
    const to = layerMap[conn.to]
    if (!from || !to) continue

    particles.push({
      connIdx,
      t: Math.random(), // 0–1 position along connection
      speed: 0.003 + Math.random() * 0.006,
      size: 1.5 + Math.random() * 2,
      brightness: 0.5 + Math.random() * 0.5,
    })
  }
  return particles
}

// ── Rendering ────────────────────────────────────────────────────────────────

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, r)
}

function renderNetwork(ctx, arch, particles, activeGroup, time) {
  const { layers, connections, skipConnections } = arch
  const layerMap = {}
  layers.forEach(l => { layerMap[l.id] = l })

  // Draw skip connections (curved)
  skipConnections.forEach(conn => {
    const from = layerMap[conn.from]
    const to = layerMap[conn.to]
    if (!from || !to) return

    const isActive = activeGroup === 'encoder' || activeGroup === 'decoder' || activeGroup === 'all'
    ctx.beginPath()
    const cpY = Math.min(from.y, to.y) - 40 - Math.abs(to.x - from.x) * 0.15
    ctx.moveTo(from.x, from.y - from.h / 2)
    ctx.quadraticCurveTo((from.x + to.x) / 2, cpY, to.x, to.y - to.h / 2)
    ctx.strokeStyle = isActive ? COLORS.skipConnActive : COLORS.skipConn
    ctx.lineWidth = isActive ? 1.5 : 0.8
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])
  })

  // Draw forward connections
  connections.forEach(conn => {
    const from = layerMap[conn.from]
    const to = layerMap[conn.to]
    if (!from || !to) return

    const active = isLayerActive(from, activeGroup) || isLayerActive(to, activeGroup)
    ctx.beginPath()
    ctx.moveTo(from.x + from.w / 2, from.y)
    ctx.lineTo(to.x - to.w / 2, to.y)
    ctx.strokeStyle = active ? COLORS.connectionActive : COLORS.connection
    ctx.lineWidth = active ? 1.5 : 0.8
    ctx.stroke()
  })

  // Draw layers (nodes)
  layers.forEach(layer => {
    const active = isLayerActive(layer, activeGroup)
    const pulse = active ? Math.sin(time * 3 + layers.indexOf(layer) * 0.5) * 0.15 + 0.85 : 0.4

    // Glow
    if (active) {
      ctx.shadowColor = COLORS.nodeGlow
      ctx.shadowBlur = 12
    }

    // Fill
    drawRoundedRect(ctx, layer.x, layer.y, layer.w, layer.h, 4)
    const alpha = active ? 0.12 + pulse * 0.08 : 0.04
    ctx.fillStyle = `rgba(163, 230, 53, ${alpha})`
    ctx.fill()

    // Stroke
    ctx.strokeStyle = active ? COLORS.nodeActive : COLORS.nodeStroke
    ctx.lineWidth = active ? 1.5 : 0.8
    ctx.stroke()

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Inner pattern (subtle horizontal lines to suggest feature maps)
    if (layer.h > 30) {
      const lines = Math.min(Math.floor(layer.h / 8), 8)
      for (let i = 1; i < lines; i++) {
        const ly = layer.y - layer.h / 2 + (layer.h / lines) * i
        ctx.beginPath()
        ctx.moveTo(layer.x - layer.w / 2 + 3, ly)
        ctx.lineTo(layer.x + layer.w / 2 - 3, ly)
        ctx.strokeStyle = active ? 'rgba(163, 230, 53, 0.1)' : 'rgba(163, 230, 53, 0.03)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    // Label
    ctx.font = '9px "Inter", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = active ? COLORS.labelActive : COLORS.label
    ctx.fillText(layer.label, layer.x, layer.y + layer.h / 2 + 5)
  })

  // Draw particles
  particles.forEach(p => {
    const conn = connections[p.connIdx]
    if (!conn) return
    const from = layerMap[conn.from]
    const to = layerMap[conn.to]
    if (!from || !to) return

    const active = isLayerActive(from, activeGroup) || isLayerActive(to, activeGroup)
    if (!active) return

    const x = from.x + from.w / 2 + (to.x - to.w / 2 - from.x - from.w / 2) * p.t
    const y = from.y + (to.y - from.y) * p.t

    // Glow
    ctx.beginPath()
    ctx.arc(x, y, p.size * 2.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(163, 230, 53, ${p.brightness * 0.15})`
    ctx.fill()

    // Core
    ctx.beginPath()
    ctx.arc(x, y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(163, 230, 53, ${p.brightness * 0.9})`
    ctx.fill()
  })
}

function isLayerActive(layer, activeGroup) {
  if (activeGroup === 'all') return true
  return layer.group === activeGroup
}

function updateParticles(particles) {
  particles.forEach(p => {
    p.t += p.speed
    if (p.t > 1) {
      p.t = 0
      p.speed = 0.003 + Math.random() * 0.006
      p.brightness = 0.5 + Math.random() * 0.5
    }
  })
}

// ── Determine which network + active group based on progress ─────────────────

function getNetworkPhase(progress) {
  if (progress < 10) return { network: 'demucs', activeGroup: 'none', phaseLabel: 'BPM Detection · Librosa' }
  if (progress < 30) return { network: 'demucs', activeGroup: 'encoder', phaseLabel: 'Encoding audio signal...' }
  if (progress < 50) return { network: 'demucs', activeGroup: 'transformer', phaseLabel: 'Transformer attention...' }
  if (progress < 70) return { network: 'demucs', activeGroup: 'decoder', phaseLabel: 'Decoding bass stem...' }
  if (progress < 85) return { network: 'demucs', activeGroup: 'all', phaseLabel: 'Bass isolation complete' }
  if (progress < 100) return { network: 'basicpitch', activeGroup: 'all', phaseLabel: 'Converting to MIDI...' }
  return { network: 'basicpitch', activeGroup: 'all', phaseLabel: 'Done' }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function NeuralCanvas({ progress = 0 }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    particles: { demucs: [], basicpitch: [] },
    initialized: false,
    lastNetwork: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let demucsArch, basicPitchArch
    let rafId
    let time = 0

    function init() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      const w = rect.width
      const h = rect.height

      demucsArch = buildDemucsArch(w, h)
      basicPitchArch = buildBasicPitchArch(w, h)

      stateRef.current.particles.demucs = createParticles(
        demucsArch.connections, demucsArch.layers, 30
      )
      stateRef.current.particles.basicpitch = createParticles(
        basicPitchArch.connections, basicPitchArch.layers, 25
      )
      stateRef.current.initialized = true
    }

    init()

    const resizeObserver = new ResizeObserver(() => {
      init()
    })
    resizeObserver.observe(canvas)

    function draw() {
      if (!stateRef.current.initialized) {
        rafId = requestAnimationFrame(draw)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      time += 0.016

      // Clear
      ctx.clearRect(0, 0, w, h)

      const phase = getNetworkPhase(progress)
      const arch = phase.network === 'demucs' ? demucsArch : basicPitchArch
      const particles = stateRef.current.particles[phase.network]

      if (!arch) {
        rafId = requestAnimationFrame(draw)
        return
      }

      // Update particles
      updateParticles(particles)

      // Render
      renderNetwork(ctx, arch, particles, phase.activeGroup, time)

      // Title overlay
      ctx.font = 'bold 10px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = COLORS.labelActive
      ctx.fillText(arch.title, 10, 10)

      ctx.font = '9px "Inter", sans-serif'
      ctx.fillStyle = COLORS.label
      ctx.fillText(arch.subtitle, 10, 24)

      // Phase label (bottom left)
      ctx.font = '9px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = COLORS.labelActive
      ctx.fillText(phase.phaseLabel, 10, h - 8)

      // Flow direction arrow hint
      ctx.font = '9px "Inter", sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = COLORS.dimText
      ctx.fillText('data flow →', w - 10, h - 8)

      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [progress])

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-acid-500/20 bg-[#050505]"
      style={{ height: '200px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {/* Top/bottom vignette */}
      <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#050505]/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#050505]/80 to-transparent pointer-events-none" />
    </div>
  )
}
