/**
 * NeuralCanvas.jsx
 *
 * Matrix-style neural network rain animation rendered on a <canvas>.
 * Displays during PROCESSING state. Characters fall in columns, glowing
 * acid-green, with random speed/brightness — pure cyberpunk vibes.
 */
import { useEffect, useRef } from 'react'

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ01001110BASSDEMUCS♩♪♫♬MIDI'

export default function NeuralCanvas({ progress = 0 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const fontSize = 13
    let cols, drops, speeds, brightnessArr

    function init() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      cols = Math.floor(canvas.width / fontSize)
      drops     = Array.from({ length: cols }, () => Math.random() * -50)
      speeds    = Array.from({ length: cols }, () => 0.3 + Math.random() * 0.7)
      brightnessArr = Array.from({ length: cols }, () => 0.4 + Math.random() * 0.6)
    }

    init()

    const resizeObserver = new ResizeObserver(init)
    resizeObserver.observe(canvas)

    let rafId
    function draw() {
      // Translucent black overlay — creates the trail/fade effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px "Courier New", monospace`

      for (let i = 0; i < cols; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        // Lead character — bright white/acid
        const bright = brightnessArr[i]
        if (drops[i] * fontSize > 0) {
          ctx.fillStyle = `rgba(220, 255, 180, ${bright})`
          ctx.fillText(char, x, y)
        }

        // Trail characters are pure acid green
        const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)]
        ctx.fillStyle = `rgba(163, 230, 53, ${bright * 0.6})`
        ctx.fillText(trailChar, x, y - fontSize)

        // Reset when column falls off screen
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
          brightnessArr[i] = 0.4 + Math.random() * 0.6
        }
        drops[i] += speeds[i]
      }

      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-acid-500/20 bg-[#050505]"
         style={{ height: '160px' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {/* Overlay: centered progress text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
        <div className="font-mono text-xs text-acid-400/80 tracking-widest uppercase select-none"
             style={{ textShadow: '0 0 12px rgba(163,230,53,0.8)' }}>
          Neural Processing
        </div>
        <div className="font-mono text-3xl font-bold text-acid-400 tabular-nums"
             style={{ textShadow: '0 0 20px rgba(163,230,53,0.6)' }}>
          {progress}%
        </div>
        <div className="flex gap-1 mt-1">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-acid-400"
              style={{
                animation: `pulse 1.2s ease-in-out ${i * 0.4}s infinite`,
                boxShadow: '0 0 6px rgba(163,230,53,0.8)',
              }}
            />
          ))}
        </div>
      </div>
      {/* Top/bottom vignette */}
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
    </div>
  )
}
