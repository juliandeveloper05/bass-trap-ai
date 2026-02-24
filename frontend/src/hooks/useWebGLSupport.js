// Checks whether the browser supports WebGL before mounting the 3D scene.
// Three.js on low-end mobile (especially Safari) can crash or perform poorly.
// If WebGL is unavailable, we fall back to a pure CSS animated ring (CoreFallback).
export function useWebGLSupport() {
  const canvas = document.createElement('canvas')
  const gl     = canvas.getContext('webgl2') || canvas.getContext('webgl')
  const isMobile = /iPhone|Android|iPad/i.test(navigator.userAgent)
  return { supported: !!gl, isMobile }
}