'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CricketEngine } from '@/lib/cricket-engine'

type Props = { position: [number, number, number]; rotation?: number; role?: 'fielder' | 'batter' | 'bowler' | 'umpire'; number?: string; engine?: CricketEngine }
const skin = '#af7650'
function Limb({ position, rotation = [0, 0, 0], color, length = .55, radius = .11 }: { position: [number, number, number]; rotation?: [number, number, number]; color: string; length?: number; radius?: number }) {
  return <mesh position={position} rotation={rotation} castShadow><capsuleGeometry args={[radius, length, 4, 8]} /><meshStandardMaterial color={color} roughness={.88} /></mesh>
}
export function Player({ position, rotation = 0, role = 'fielder', number = '18', engine }: Props) {
  const root = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Group>(null)
  const legLeft = useRef<THREE.Group>(null)
  const legRight = useRef<THREE.Group>(null)
  const bat = useRef<THREE.Group>(null)

  const isBatter = role === 'batter'
  const isUmpire = role === 'umpire'
  const team = isBatter 
    ? (engine?.view.battingTeam ?? 'PAKISTAN') 
    : isUmpire 
      ? 'ICC' 
      : (engine?.view.bowlingTeam ?? 'INDIA')

  const isPakistan = team === 'PAKISTAN'
  const isIndia = team === 'INDIA'

  // Team kit colors: Pakistan (Deep Green #075743), India (Royal Blue #1373cc), Umpire (Red #ee353c)
  const kit = isPakistan ? '#075743' : isIndia ? '#1373cc' : '#ee353c'
  const pants = isUmpire ? '#202a30' : kit
  const capColor = isPakistan ? '#064335' : isIndia ? '#125395' : '#efeee8'

  const numberTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 160
    const c = canvas.getContext('2d')!; c.fillStyle = kit; c.fillRect(0, 0, 128, 160)
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.font = 'bold 17px Arial'; c.fillText(team, 64, 33)
    c.font = 'bold 76px Arial'; c.fillText(isUmpire ? 'ICC' : number, 64, 112)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture
  }, [kit, team, isUmpire, number])
  useEffect(() => () => numberTexture.dispose(), [numberTexture])

  useFrame((state) => {
    if (!root.current) return
    const clockTime = state.clock.getElapsedTime()

    // 1. Bowler Animation
    if (role === 'bowler' && engine) {
      const { phase } = engine.view
      const t = engine.time
      const running = phase === 'runup'
      root.current.position.z = position[2] + (running ? 4.5 * (1 - t / 1.35) : 0)
      root.current.position.y = running ? Math.abs(Math.sin(t * 14)) * .12 : 0
      if (arm.current) arm.current.rotation.x = running ? Math.sin(t * 14) * 1.2 : phase === 'delivery' ? -Math.PI * 2 * Math.min(1, t / .45) : -.2
      if (legLeft.current) legLeft.current.rotation.x = running ? Math.sin(t * 14) * .7 : 0
      if (legRight.current) legRight.current.rotation.x = running ? -Math.sin(t * 14) * .7 : 0
    }

    // 2. Batsman Stance, Aiming & Shot Swing & Running Animation
    if (isBatter && engine) {
      const { phase, direction } = engine.view
      const flightRuns = engine.flightRuns
      const t = engine.time
      const aimAngle = (direction - 2) * -0.32

      // Check if batsman is running between wickets (in flight/result phase when runs scored)
      const isRunning = (phase === 'flight' || phase === 'result') && flightRuns > 0 && flightRuns <= 4
      if (isRunning) {
        // Run down pitch between -9.5 and +7.5
        const runCycle = Math.sin(t * 10)
        const progress = Math.abs(Math.sin(t * 1.5))
        root.current.position.z = position[2] + progress * 15
        root.current.position.x = position[0] + Math.sin(t * 3) * 0.3
        root.current.position.y = Math.abs(runCycle) * 0.1
        root.current.rotation.y = runCycle > 0 ? 0 : Math.PI

        if (legLeft.current) legLeft.current.rotation.x = runCycle * 0.8
        if (legRight.current) legRight.current.rotation.x = -runCycle * 0.8
        if (arm.current) arm.current.rotation.x = -runCycle * 0.9
      } else {
        // Normal crease stance
        root.current.position.set(position[0], position[1], position[2])
        
        // Idle breathing & subtle bat tap
        const idleTap = Math.sin(clockTime * 4) * 0.08
        const idleBreathe = Math.sin(clockTime * 2) * 0.02
        root.current.position.y = idleBreathe

        // Shot swing vs Stance
        const isFlight = phase === 'flight'
        const isDelivery = phase === 'delivery'
        const hasSwung = engine.swingTime >= 0
        const isSwinging = hasSwung && (isDelivery || isFlight)
        
        // Progress of swing (0 to 1 over 0.4 seconds, then hold pose during flight)
        let swingProgress = 0
        if (isSwinging) {
          const elapsedTime = isFlight ? engine.time + 0.25 : engine.time - Math.max(0, engine.swingTime)
          swingProgress = Math.min(1, Math.max(0, elapsedTime / 0.4))
        }

        // Rotate batsman body towards aiming direction dynamically!
        const targetRotation = rotation + aimAngle + (isSwinging ? Math.sin(swingProgress * Math.PI * .8) * .7 : 0)
        root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, targetRotation, 0.18)

        if (bat.current && arm.current) {
          if (isSwinging) {
            // Full dynamic bat stroke: Backlift -> Downswing -> Impact -> Follow-through
            const swingCurve = Math.sin(swingProgress * Math.PI * 0.9)
            bat.current.rotation.z = -.35 - swingCurve * 2.5
            bat.current.rotation.x = Math.sin(swingProgress * Math.PI) * 0.8
            arm.current.rotation.x = -swingCurve * 1.4
            arm.current.rotation.y = Math.sin(swingProgress * Math.PI * 0.7) * 0.5
          } else {
            // Idle stance with subtle bat tapping
            bat.current.rotation.z = -.35 + idleTap
            bat.current.rotation.x = 0.2
            arm.current.rotation.x = -.35 + idleBreathe
            arm.current.rotation.y = 0
          }
        }

        // Footwork step out on swing
        if (legLeft.current) legLeft.current.rotation.x = isSwinging ? -Math.sin(swingProgress * Math.PI) * 0.45 : 0
        if (legRight.current) legRight.current.rotation.x = isSwinging ? Math.sin(swingProgress * Math.PI) * 0.35 : 0
      }
    }
  })

  return <group ref={root} position={position} rotation={[0, rotation, 0]}>
    <group ref={legLeft} position={[-.19, .79, 0]}>
      <Limb position={[0, -.23, 0]} color={pants} length={.54} radius={.14} />
      <mesh position={[0, -.67, .11]} castShadow><boxGeometry args={[.25, .16, .45]} /><meshStandardMaterial color="#e8ece7" /></mesh>
      {isBatter && <mesh position={[0, -.3, .16]} castShadow><boxGeometry args={[.26, .6, .13]} /><meshStandardMaterial color="#c5d2bd" /></mesh>}
    </group>
    <group ref={legRight} position={[.19, .79, 0]} rotation={[0, 0, -.07]}>
      <Limb position={[0, -.23, 0]} color={pants} length={.54} radius={.14} />
      <mesh position={[0, -.67, .11]} castShadow><boxGeometry args={[.25, .16, .45]} /><meshStandardMaterial color="#e8ece7" /></mesh>
      {isBatter && <mesh position={[0, -.3, .16]} castShadow><boxGeometry args={[.26, .6, .13]} /><meshStandardMaterial color="#c5d2bd" /></mesh>}
    </group>
    <mesh position={[0, 1.27, 0]} castShadow><cylinderGeometry args={[.36, .29, .81, 8]} /><meshStandardMaterial color={kit} /></mesh>
    <mesh position={[0, 1.34, -.313]} rotation={[0, Math.PI, 0]}><planeGeometry args={[.46, .55]} /><meshStandardMaterial map={numberTexture} /></mesh>
    <mesh position={[0, 1.82, 0]} castShadow><sphereGeometry args={[.22, 12, 12]} /><meshStandardMaterial color={skin} /></mesh>
    <mesh position={[0, 1.98, -.025]} castShadow><sphereGeometry args={[.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={capColor} /></mesh>
    <mesh position={[0, 1.965, .15]} castShadow><boxGeometry args={[isUmpire ? .66 : .38, .04, isUmpire ? .6 : .36]} /><meshStandardMaterial color={capColor} /></mesh>
    {isBatter && <group>{[1.79, 1.86].map(y => <mesh key={y} position={[0, y, .2]}><boxGeometry args={[.38, .015, .09]} /><meshStandardMaterial color="#b1bec3" metalness={.7} /></mesh>)}</group>}
    <group ref={arm} position={[-.37, 1.56, 0]} rotation={[-.2, 0, -.2]}>
      <Limb position={[0, -.14, 0]} color={kit} length={.19} radius={.13} />
      <Limb position={[0, -.48, .06]} color={skin} length={.26} radius={.085} />
      <mesh position={[0, -.68, .08]}><sphereGeometry args={[.105, 8, 8]} /><meshStandardMaterial color={isBatter ? '#e8ece7' : skin} /></mesh>
    </group>
    <group position={[.37, 1.56, 0]} rotation={[-.3, 0, .19]}>
      <Limb position={[0, -.14, 0]} color={kit} length={.19} radius={.13} />
      <Limb position={[0, -.48, .06]} color={skin} length={.26} radius={.085} />
      <mesh position={[0, -.68, .08]}><sphereGeometry args={[.105, 8, 8]} /><meshStandardMaterial color={isBatter ? '#e8ece7' : skin} /></mesh>
    </group>
    {isBatter && <group ref={bat} position={[.5, .88, .16]} rotation={[.2, 0, -.35]}>
      <mesh position={[0, -.09, 0]}><cylinderGeometry args={[.045, .045, .38, 8]} /><meshStandardMaterial color="#313c32" /></mesh>
      <mesh position={[0, -.62, 0]} castShadow><boxGeometry args={[.25, .76, .09]} /><meshStandardMaterial color="#e6d2a1" roughness={.9} /></mesh>
      <mesh position={[0, -.5, .048]}><planeGeometry args={[.19, .25]} /><meshStandardMaterial color="#ed4d67" /></mesh>
    </group>}
  </group>
}
