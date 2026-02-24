import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function Background() {
  const noiseRef = useRef()

  // Slowly drifts the noise texture horizontally — creates a subtle "digital fog"
  // feeling without any canvas or shader work. Pure CSS background-position.
  useEffect(() => {
    gsap.to(noiseRef.current, {
      backgroundPositionX: '200%',
      duration: 40, repeat: -1, ease: 'none',
    })
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Layer 1: Dark radial gradient base — center slightly lighter than edges */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #0D1535 0%, #050510 70%)' }} />

      {/* Layer 2: Perspective grid — masked with a radial gradient so it fades
          toward the edges and doesn't look like a flat tile pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* Layer 3: SVG fractal noise rendered inline as a data URI.
          Animated horizontally to simulate slow-moving interference. */}
      <div ref={noiseRef} className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
      }} />

      {/* Layer 4: Vignette — darkens the corners to focus the eye on center */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(5,5,16,0.8) 100%)' }} />
    </div>
  )
}