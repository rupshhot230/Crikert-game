import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { CricketEngine } from '@/lib/cricket-engine'
import { Player } from './player'
import { Stadium } from './stadium'

export const FIELDERS: [number, number, number][] = [[-6, 0, -13], [-10, 0, -10], [5, 0, -14], [11, 0, -7], [-12, 0, 5], [17, 0, 10], [-21, 0, -18], [23, 0, -22]]

function AimIndicator({ direction }: { direction: number }) {
  const angle = (direction - 2) * 0.58
  const dx = Math.sin(angle) * 12
  const dz = -9.55 + Math.cos(angle) * 12
  return <group position={[-.46, 0.05, -9.55]}>
    {/* Line pointing to aimed gap */}
    <mesh rotation={[-Math.PI / 2, 0, -angle]} position={[Math.sin(angle) * 4, 0, Math.cos(angle) * 4]}>
      <planeGeometry args={[0.25, 8]} />
      <meshBasicMaterial color="#c5ed8b" transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
    {/* Aim target circle */}
    <mesh position={[Math.sin(angle) * 8.5, 0, Math.cos(angle) * 8.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 0.7, 24]} />
      <meshBasicMaterial color="#c5ed8b" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  </group>
}

function MatchScene({ engine, markerRef }: { engine: CricketEngine; markerRef: React.RefObject<HTMLDivElement | null> }) {
  const ball = useRef<THREE.Mesh>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const controlsRef = useRef<any>(null)
  const cameraTarget = useRef(new THREE.Vector3(0, 0, -2))
  const { camera, size } = useThree()

  useFrame((_, delta) => {
    engine.tick(delta)
    const { phase, cameraMode, direction } = engine.view
    
    // Update HUD timing marker
    if (markerRef.current) {
      const progress = phase === 'delivery' ? Math.min(1, engine.time / engine.deliveryDuration) : 0
      markerRef.current.style.transform = `translateX(${progress * 218}px)`
    }

    if (!ball.current || !shadow.current) return
    const t = engine.time
    const visible = phase !== 'result' && phase !== 'complete'
    ball.current.visible = visible; shadow.current.visible = visible

    if (phase === 'delivery') {
      const p = engine.time / engine.deliveryDuration
      if (p >= 0.84) {
        // Auto-trigger shot play when ball reaches batsman at crease
        engine.swingTime = -1
        engine.swing()
      }
    }

    if (phase === 'delivery') {
      const p = t / engine.deliveryDuration
      const y = p < .6 ? 2.5 * (1 - p / .6) + .12 : .12 + (p - .6) * 3.2
      ball.current.position.set(-.08, y, 8 - p * 19)
    } else if (phase === 'flight') {
      const distance = t * (engine.flightRuns >= 4 ? 32 : engine.hit ? 18 : 10)
      const startX = -.25
      const startZ = -9.3
      const startY = .95
      const y = engine.hit
        ? (engine.view.shot === 'loft' ? Math.max(.12, startY + t * 14 - 5.2 * t * t) : Math.max(.13, startY - t * 1.5))
        : Math.max(.12, startY - t * 2)
      ball.current.position.set(
        startX + Math.sin(engine.shotAngle) * distance,
        y,
        startZ + Math.cos(engine.shotAngle) * distance
      )
    } else {
      ball.current.position.set(-.78, 2.1, phase === 'runup' ? 8 + 4.5 * (1 - t / 1.35) : 8)
    }
    
    shadow.current.position.set(ball.current.position.x, .04, ball.current.position.z)
    ball.current.rotation.x += delta * 9

    // Dynamic Ball Tracking for Orbit Controls & Camera
    const ballPos = ball.current.position
    const trackingLookAt = new THREE.Vector3(0, 0, -2)

    if (phase === 'flight') {
      trackingLookAt.set(ballPos.x, ballPos.y + 0.3, ballPos.z)
    } else if (phase === 'delivery') {
      trackingLookAt.set(ballPos.x, ballPos.y, ballPos.z)
    } else if (phase === 'runup') {
      trackingLookAt.set(0, 1.2, 4)
    } else {
      trackingLookAt.set(-0.2, 1.0, -5)
    }

    if (controlsRef.current) {
      if (cameraMode === 'orbit') {
        controlsRef.current.enabled = true
        controlsRef.current.target.lerp(trackingLookAt, 0.1)
        controlsRef.current.update()
      } else {
        controlsRef.current.enabled = false
      }
    }

    if (cameraMode !== 'orbit') {
      const portrait = size.width / size.height < 1
      const targetPos = new THREE.Vector3(0, portrait ? 24 : 17.8, portrait ? 38 : 26)

      if (cameraMode === 'side') {
        targetPos.set(13, 7, -5)
      } else if (cameraMode === 'pitch') {
        targetPos.set(0, 3.2, -15.5)
      } else {
        // Broadcast preset view: smoothly follow ball position
        if (phase === 'flight') {
          targetPos.set(
            ballPos.x * 0.4,
            15 + ballPos.y * 0.3,
            24 + ballPos.z * 0.2
          )
        } else if (phase === 'delivery') {
          targetPos.set(0, 15.5, 23)
        } else if (phase === 'runup') {
          targetPos.set(0, 18, 28)
        }
      }

      camera.position.lerp(targetPos, 0.08)
      cameraTarget.current.lerp(trackingLookAt, 0.08)
      camera.lookAt(cameraTarget.current)
    }
  })

  return <>
    <color attach="background" args={['#c4d9d5']} />
    <fog attach="fog" args={['#c4d9d5', 62, 155]} />
    <hemisphereLight args={['#f2f3e4', '#456031', 2.2]} />
    <directionalLight position={[-18, 32, 10]} intensity={2.7} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={28} shadow-camera-bottom={-28} shadow-camera-far={100} shadow-normalBias={.035} />
    
    <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.06} minDistance={3} maxDistance={120} maxPolarAngle={Math.PI / 2 - 0.01} />

    <Stadium />
    <AimIndicator direction={engine.view.direction} />
    
    {/* 3D Bat Impact Spark / Flash Effect when ball hits bat */}
    {engine.view.phase === 'flight' && engine.hit && engine.time < 0.22 && (
      <mesh position={[-.25, .95, -9.3]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial color="#c5ed8b" transparent opacity={0.85} />
      </mesh>
    )}

    <Player position={[-.46, 0, -9.55]} rotation={.3} role="batter" number="16" engine={engine} />
    <Player position={[0, 0, -12.5]} role="fielder" number="1" engine={engine} />
    <Player position={[-.65, 0, 8]} rotation={Math.PI} role="bowler" number="93" engine={engine} />
    <Player position={[.1, 0, 12]} rotation={Math.PI} role="umpire" engine={engine} />
    <Player position={[2.65, 0, 8.6]} rotation={Math.PI - .3} role="batter" number="56" engine={engine} />
    {FIELDERS.map((position, index) => <Player key={index} position={position} rotation={Math.atan2(-position[0], -8 - position[2])} number={String([18, 8, 7, 45, 33, 12, 9, 22][index])} engine={engine} />)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .04, -3.4]}><ringGeometry args={[.32, .41, 24, 1, 0, Math.PI * .42]} /><meshBasicMaterial color="#ea4c55" side={THREE.DoubleSide} /></mesh>
    {[1, 2, 3].map(i => <mesh key={i} rotation={[-Math.PI / 2, 0, i * Math.PI / 2]} position={[0, .04, -3.4]}><ringGeometry args={[.32, .41, 24, 1, 0, Math.PI * .42]} /><meshBasicMaterial color="#ea4c55" side={THREE.DoubleSide} /></mesh>)}
    <mesh ref={ball} castShadow><sphereGeometry args={[.11, 12, 12]} /><meshStandardMaterial color="#fff7de" roughness={.45} emissive="#fff7de" emissiveIntensity={.12} /></mesh>
    <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.14, 16]} /><meshBasicMaterial color="#15291c" transparent opacity={.3} depthWrite={false} /></mesh>
  </>
}

export default function CricketScene({ engine, markerRef }: { engine: CricketEngine; markerRef: React.RefObject<HTMLDivElement | null>; cameraMode?: boolean }) {
  return <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 43, near: .1, far: 180, position: [0, 17.8, 26] }} gl={{ antialias: true, powerPreference: 'high-performance' }} fallback={<div className="canvas-fallback">This game needs WebGL. Please enable hardware acceleration or try another browser.</div>}>
    <Suspense fallback={null}><MatchScene engine={engine} markerRef={markerRef} /></Suspense>
  </Canvas>
}
