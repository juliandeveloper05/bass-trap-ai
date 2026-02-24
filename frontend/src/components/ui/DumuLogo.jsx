import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function DumuLogo() {
  const logoRef     = useRef()
  const subtitleRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 })
    // Reveal the logo left-to-right using clip-path animation.
    // This mimics a "scan" effect — like the logo is being read by a laser.
    tl.from(logoRef.current, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.2,
      ease: 'power3.inOut',
    })
    // Subtitle fades up slightly after the logo finishes revealing
    .from(subtitleRef.current, {
      opacity: 0, y: 6,
      duration: 0.6,
      ease: 'power2.out',
    }, '-=0.3') // Overlaps by 0.3s with the previous animation
  }, [])

  return (
    <div className="flex flex-col items-center select-none">
      <div ref={logoRef} className="relative animate-flicker">
        {/* SVG approach lets us apply a gradient fill to text,
            which isn't possible with standard CSS color on a <p> tag.
            The blurred duplicate beneath it creates the glow underlay. */}
        <svg
          viewBox="0 0 200 60"
          className="w-48 h-auto"
          style={{ filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.6))' }}
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#00F0FF" />
              <stop offset="50%"  stopColor="#9D00FF" />
              <stop offset="100%" stopColor="#00F0FF" />
            </linearGradient>
          </defs>
          {/* Glow layer — same text, blurred, very low opacity */}
          <text x="50%" y="78%" textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
            fontSize="52" fontWeight="700" letterSpacing="12"
            fill="rgba(0, 240, 255, 0.15)"
            style={{ filter: 'blur(8px)' }}
          >dumu</text>
          {/* Visible text layer with gradient fill */}
          <text x="50%" y="78%" textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
            fontSize="52" fontWeight="700" letterSpacing="12"
            fill="url(#logoGrad)"
          >dumu</text>
        </svg>
      </div>

      {/* "AI-Bass-Extraction" — reads like a firmware module descriptor */}
      <p ref={subtitleRef}
        className="font-mono text-[10px] text-muted mt-1 uppercase"
        style={{ letterSpacing: '0.4em' }}
      >AI-Bass-Extraction</p>

      {/* Thin gradient line — visual separator beneath subtitle */}
      <div className="mt-3 h-px w-32"
        style={{ background: 'linear-gradient(90deg, transparent, #00F0FF55, transparent)' }}
      />
    </div>
  )
}