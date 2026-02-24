import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function WaveformTorus({ phase }) {
  const ref = useRef()

  // ShaderMaterial created with useMemo so it's only instantiated once.
  // The vertex shader displaces torus vertices in a wave pattern,
  // making the ring look like it's vibrating with audio energy.
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:  { value: 0 },
      uSpeed: { value: 1.0 }, // Increases during processing for urgency
      uColor: { value: new THREE.Color('#9D00FF') },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSpeed;
      varying float vDisplace;
      void main() {
        float angle    = atan(position.y, position.x);
        // 8 wave peaks around the torus, animated over time
        float wave     = sin(angle * 8.0 + uTime * uSpeed * 3.0) * 0.08;
        vDisplace      = wave;
        // Push each vertex outward along its normal by the wave amount
        vec3 displaced = position + normal * wave;
        gl_Position    = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vDisplace;
      void main() {
        // Peaks of the wave glow brighter — gives a hot-spot effect
        float brightness = 0.5 + vDisplace * 6.0;
        gl_FragColor = vec4(uColor * brightness, 0.85);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime

    // Spin faster during processing — lerp smooths the speed transition
    const rotSpeed = phase === 'processing' ? 0.015 : 0.004
    ref.current.rotation.z += rotSpeed
    ref.current.rotation.x  = 0.4 // Fixed tilt for visual interest

    // Smoothly interpolate the animation speed uniform
    material.uniforms.uSpeed.value +=
      ((phase === 'processing' ? 3.0 : 1.0) - material.uniforms.uSpeed.value) * 0.05
  })

  return (
    // args: [radius, tube thickness, radial segments, tubular segments]
    // High tubular segment count (180) ensures the wave displacement looks smooth
    <mesh ref={ref} material={material}>
      <torusGeometry args={[0.9, 0.04, 16, 180]} />
    </mesh>
  )
}