import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ARC_COUNT = 18 // Number of simultaneously active arcs

// Generates a random arc path on the surface of the sphere.
// Uses a quadratic bezier curve between two random points,
// with a midpoint pushed slightly outward to create a curved trajectory.
function randomArc() {
  const start = new THREE.Vector3().randomDirection().multiplyScalar(1.5)
  const end   = new THREE.Vector3().randomDirection().multiplyScalar(1.5)
  const mid   = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.0)
  return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(40)
}

export default function NeuralArcs({ phase }) {
  const groupRef = useRef()

  // Arc metadata: each arc has a birth time offset and a random lifespan.
  // This staggers them so they don't all appear and disappear simultaneously.
  const arcsData = useMemo(() => Array.from({ length: ARC_COUNT }, () => ({
    points:    randomArc(),
    birthTime: Math.random() * 6,
    lifespan:  2 + Math.random() * 3,
  })), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t         = clock.elapsedTime
    const intensity = phase === 'processing' ? 1.8 : phase === 'idle' ? 0.6 : 1.0

    groupRef.current.children.forEach((line, i) => {
      const { birthTime, lifespan } = arcsData[i]
      const age   = ((t - birthTime) % lifespan) / lifespan // 0 → 1 over the lifespan
      // sin(age * π) peaks at 0.5 — arcs fade in then fade out smoothly
      const alpha = Math.sin(age * Math.PI) * intensity * 0.7
      line.material.opacity = Math.max(0, alpha)

      // When an arc completes its cycle, regenerate its geometry in a new position
      if (age < 0.02) {
        const newPoints   = randomArc()
        const positions   = new Float32Array(newPoints.length * 3)
        newPoints.forEach((p, j) => {
          positions[j*3] = p.x; positions[j*3+1] = p.y; positions[j*3+2] = p.z
        })
        line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      }
    })
  })

  return (
    <group ref={groupRef}>
      {arcsData.map((arc, i) => {
        const positions = new Float32Array(arc.points.length * 3)
        arc.points.forEach((p, j) => {
          positions[j*3] = p.x; positions[j*3+1] = p.y; positions[j*3+2] = p.z
        })
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return (
          <line key={i} geometry={geo}>
            <lineBasicMaterial
              color="#00F0FF" transparent opacity={0}
              blending={THREE.AdditiveBlending} depthWrite={false}
            />
          </line>
        )
      })}
    </group>
  )
}