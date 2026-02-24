// tailwind.config.js
import { fontFamily } from 'tailwindcss/defaultTheme'

export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#050510',
        surface: '#0A0F1F',
        electric:'#00F0FF',
        purple:  '#9D00FF',
        plasma:  '#FF006E',
        dim:     '#1A1F3A',
        muted:   '#4A5080',
      },
      fontFamily: {
        // Primary mono — firmware feel
        mono: ['"JetBrains Mono"', ...fontFamily.mono],
        // Display — wide geometric
        display: ['"Space Grotesk"', ...fontFamily.sans],
      },
      letterSpacing: {
        ultra: '0.35em',
        wide:  '0.2em',
      },
      animation: {
        flicker:   'flicker 4s infinite',
        breathe:   'breathe 3s ease-in-out infinite',
        scanline:  'scanline 8s linear infinite',
        materialize:'materialize 0.4s ease-out forwards',
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: '1' },
          '92%':     { opacity: '1' },
          '93%':     { opacity: '0.4' },
          '94%':     { opacity: '1' },
          '96%':     { opacity: '0.6' },
          '97%':     { opacity: '1' },
        },
        breathe: {
          '0%,100%': { transform: 'scale(1)',   opacity: '0.8' },
          '50%':     { transform: 'scale(1.04)', opacity: '1'   },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        materialize: {
          '0%':   { opacity: '0', transform: 'scaleX(0.6)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'scaleX(1)',   filter: 'blur(0)'   },
        },
      },
      boxShadow: {
        neon:   '0 0 20px rgba(0, 240, 255, 0.4), 0 0 60px rgba(0, 240, 255, 0.15)',
        plasma: '0 0 20px rgba(255, 0, 110, 0.4)',
        purple: '0 0 20px rgba(157, 0, 255, 0.4)',
      },
    },
  },
  plugins: [],
}