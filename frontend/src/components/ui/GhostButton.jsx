import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function GhostButton({ children, onClick, variant = 'electric', disabled = false }) {
  const btnRef = useRef()

  // On mount, the button materializes from blurry/invisible to clear.
  // This is intentional — buttons should feel like they "load in",
  // not just appear instantly. It signals that the UI is alive.
  useEffect(() => {
    gsap.fromTo(btnRef.current,
      { scaleX: 0.5, opacity: 0, filter: 'blur(10px)' },
      { scaleX: 1,   opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' }
    )
  }, [])

  const colors = {
    electric: { border: '#00F0FF', glow: 'rgba(0,240,255,0.3)',   text: '#00F0FF' },
    plasma:   { border: '#FF006E', glow: 'rgba(255,0,110,0.3)',   text: '#FF006E' },
    purple:   { border: '#9D00FF', glow: 'rgba(157,0,255,0.3)',   text: '#9D00FF' },
  }
  const c = colors[variant]

  // GSAP handles hover glow instead of CSS :hover because we need to animate
  // box-shadow, which CSS transitions handle poorly across browsers.
  const handleMouseEnter = () => gsap.to(btnRef.current, {
    boxShadow: `0 0 24px ${c.glow}, inset 0 0 24px ${c.glow}`, duration: 0.2
  })
  const handleMouseLeave = () => gsap.to(btnRef.current, {
    boxShadow: `0 0 8px ${c.glow}`, duration: 0.3
  })

  return (
    <button ref={btnRef} onClick={onClick} disabled={disabled}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      className="relative px-8 py-3 font-mono text-xs tracking-ultra uppercase disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        color: c.text, border: `1px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow}`,
        background: 'rgba(0, 240, 255, 0.03)',
        backdropFilter: 'blur(4px)', // Frosted glass surface
      }}
    >
      {/* Corner accent marks — these give the button a "targeting reticle" feel */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: c.border }} />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: c.border }} />
      {children}
    </button>
  )
}