import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Fresnel shader: makes the sphere nearly invisible head-on,
// bright and glowing at the edges — like a glass energy field.
// The math: fresnel = pow(1 - dot(viewDirection, surfaceNormal), power)
// The closer the view angle is to 90°, the brighter the edge becomes.
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal  = normalize(normalMatrix * normal);
    vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-worldPos.xyz); // Vector from surface toward camera
    gl_Position = projectionMatrix * worldPos;
  }
`
const fragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uColor;
  varying vec3  vNormal;
  varying vec3  vViewDir;

  void main() {
    float fresnel = pow(1.0 - clamp(dot(vViewDir, vNormal), 0.0, 1.0), 3.5);
    float pulse   = sin(uTime * 1.2) * 0.15 + 0.85; // Breathing idle animation
    float alpha   = fresnel * uIntensity * pulse;
    gl_FragColor  = vec4(uColor * fresnel, alpha);
  }
`

export default function CoreSphere({ phase }) {
  const meshRef  = useRef()

  // useMemo prevents recreating shader uniforms on every render.
  // Uniforms are the "inputs" we pass from JS into the GPU shader.
  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uIntensity: { value: 0.9 },
    uColor:     { value: new THREE.Color('#00F0FF') },
  }), [])

  useFrame(({ clock }) => {
    // Update time uniform every frame so the pulse animation runs on the GPU
    uniforms.uTime.value = clock.elapsedTime

    // Smoothly scale up based on phase using lerp (linear interpolation).
    // lerp(target, factor) — factor 0.05 means "move 5% closer to target each frame"
    // This creates a smooth easing without any animation library.
    const targetScale = phase === 'dragging' ? 1.08 : phase === 'processing' ? 1.12 : 1.0
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05)

    // Shift the sphere color toward plasma pink while processing
    const targetColor = phase === 'processing' ? new THREE.Color('#FF006E') : new THREE.Color('#00F0FF')
    uniforms.uColor.value.lerp(targetColor, 0.03)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}             // Don't write to depth buffer — lets particles show through
        blending={THREE.AdditiveBlending} // Colors add together like light, not paint
        side={THREE.FrontSide}
      />
    </mesh>
  )
}