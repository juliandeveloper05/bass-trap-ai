import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { Suspense } from 'react'
import CoreSphere    from './CoreSphere'
import WaveformTorus from './WaveformTorus'
import NeuralArcs    from './NeuralArcs'
import ParticleField from './ParticleField'
import MidiGrid      from './MidiGrid'
import { useCoreState } from '../../hooks/useCoreState'

export default function DumuCore() {
  const phase = useCoreState((s) => s.phase)

  return (
    // `alpha: true` makes the canvas background transparent so our CSS
    // deep-space gradient shows through behind the 3D objects.
    // `frameloop` switches to "demand" when idle to save GPU resources —
    // R3F will only re-render when something actually changes.
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={phase === 'idle' ? 'demand' : 'always'}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        {/* Minimal lighting — we want the scene to feel dark and surgical.
            Most brightness comes from emissive shaders, not from lights. */}
        <ambientLight intensity={0.05} />
        <pointLight position={[0, 0, 0]} intensity={2}   color="#00F0FF" />
        <pointLight position={[3, 2, 1]} intensity={0.5}  color="#9D00FF" />

        {/* Render order matters here — particles and arcs first (background),
            then torus and sphere on top (foreground). All use AdditiveBlending
            so they layer like light, not like opaque surfaces. */}
        <ParticleField phase={phase} />
        <NeuralArcs    phase={phase} />
        <WaveformTorus phase={phase} />
        <CoreSphere    phase={phase} />

        {/* MidiGrid only mounts after a successful extraction */}
        {phase === 'done' && <MidiGrid />}

        {/* Post-processing stack — runs as a single GPU pass after the scene renders.
            Bloom intensity increases during processing to signal "activity".
            ChromaticAberration adds the subtle RGB split for a cold digital feel. */}
        <EffectComposer>
          <Bloom
            intensity={phase === 'processing' ? 2.2 : 1.2}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            blendFunction={BlendFunction.ADD}
          />
          <ChromaticAberration
            offset={new Vector2(0.0008, 0.0004)}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}