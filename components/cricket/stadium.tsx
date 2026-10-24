'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

function makeSurface(pitch = false) {
  if (typeof window === 'undefined') return undefined
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = pitch ? '#bdb284' : '#64893b'; ctx.fillRect(0, 0, 256, 256)
  let seed = 42
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (let i = 0; i < 18000; i++) {
    const value = Math.floor(rand() * 50)
    ctx.fillStyle = pitch ? `rgba(${70 + value},${65 + value},${40 + value},${rand() * .18})` : `rgba(${50 + value},${70 + value},${25 + value},${rand() * .3})`
    ctx.fillRect(rand() * 256, rand() * 256, 1, pitch ? rand() * 4 : 2)
  }
  const tex = new THREE.CanvasTexture(canvas); tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(pitch ? 2 : 26, pitch ? 8 : 26); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  return tex
}
function Advertising({ position, rotation = 0, label = 'CRIKERT', color = '#112a39', width = 10 }: { position: [number, number, number]; rotation?: number; label?: string; color?: string; width?: number }) {
  const tex = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    const c = document.createElement('canvas'); c.width = 1024; c.height = 128
    const ctx = c.getContext('2d')!; ctx.fillStyle = color; ctx.fillRect(0, 0, 1024, 128)
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.font = 'italic 900 67px Arial'; ctx.fillText(label, 512, 90)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [label, color])
  useEffect(() => () => { tex?.dispose() }, [tex])
  return <mesh position={position} rotation={[0, rotation, 0]}><boxGeometry args={[width, 1.25, .12]} /><meshStandardMaterial color={color} map={tex ?? undefined} /></mesh>
}
export function Stumps({ z }: { z: number }) {
  return <group position={[0, 0, z]}>
    {[-.16, 0, .16].map(x => <mesh key={x} position={[x, .49, 0]} castShadow><cylinderGeometry args={[.031, .032, .98, 8]} /><meshStandardMaterial color="#efdfac" /></mesh>)}
    {[-.08, .08].map(x => <mesh key={x} position={[x, .99, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.025, .025, .2, 8]} /><meshStandardMaterial color="#efdfac" /></mesh>)}
  </group>
}
function Seating() {
  const ref = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    if (!ref.current) return
    const object = new THREE.Object3D(); const color = new THREE.Color()
    for (let i = 0; i < 1000; i++) {
      const row = Math.floor(i / 100); const angle = (i % 100) / 100 * Math.PI * 2
      const radius = 53 + row * .75
      object.position.set(Math.sin(angle) * radius, 1.7 + row * .57, Math.cos(angle) * radius)
      object.scale.set(.4, .5 + (i % 3) * .1, .35); object.rotation.y = angle; object.updateMatrix()
      ref.current.setMatrixAt(i, object.matrix); color.set(['#f3ebd6', '#21699d', '#e0a656', '#154c3a', '#a3b4b4'][i % 5]); ref.current.setColorAt(i, color)
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [])
  return <instancedMesh ref={ref} args={[undefined, undefined, 1000]}><boxGeometry /><meshStandardMaterial roughness={1} /></instancedMesh>
}
export function Stadium() {
  const grass = useMemo(() => makeSurface(), [])
  const pitch = useMemo(() => makeSurface(true), [])
  useEffect(() => () => { grass?.dispose(); pitch?.dispose() }, [grass, pitch])
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[70, 96]} /><meshStandardMaterial color="#4a7c36" map={grass ?? undefined} roughness={1} /></mesh>
    {Array.from({ length: 14 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, .006, (i - 7) * 8]} receiveShadow><planeGeometry args={[100, 4]} /><meshStandardMaterial color="#c7dd77" transparent opacity={.07} depthWrite={false} /></mesh>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .013, 0]} receiveShadow><planeGeometry args={[4.7, 22]} /><meshStandardMaterial color="#bdb284" map={pitch ?? undefined} roughness={1} /></mesh>
    {[-9, 9].map(z => <group key={z}>
      <mesh position={[0, .025, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6.7, .065]} /><meshBasicMaterial color="#f6f4df" /></mesh>
      <mesh position={[0, .026, z + (z < 0 ? -1.05 : 1.05)]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.6, .06]} /><meshBasicMaterial color="#f6f4df" /></mesh>
      {[-1.3, 1.3].map(x => <mesh key={x} position={[x, .027, z + (z < 0 ? -.35 : .35)]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.06, 2]} /><meshBasicMaterial color="#f6f4df" /></mesh>)}
    </group>)}
    <Stumps z={-10} /><Stumps z={10} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]}><ringGeometry args={[46, 46.14, 128]} /><meshBasicMaterial color="#f4efda" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .015, 0]}><ringGeometry args={[22, 22.06, 100]} /><meshBasicMaterial color="#f4efda" transparent opacity={.5} /></mesh>
    {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[0, .55 + i * .56, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[52 + i * .75, 52.8 + i * .75, 96]} /><meshStandardMaterial color={i % 2 ? '#d1d8cd' : '#637e80'} side={THREE.DoubleSide} /></mesh>)}
    <Seating />
    {Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return <Advertising key={i} position={[Math.sin(a) * 49, .8, Math.cos(a) * 49]} rotation={a + Math.PI} label={i % 3 === 0 ? 'PLAY THE MOMENT.' : i % 3 === 1 ? 'CRIKERT' : 'WORLD CRICKET SERIES'} color={i % 3 === 0 ? '#c6298a' : '#112a39'} width={12.4} /> })}
    <Advertising position={[0, .09, -20]} rotation={0} label="CRIKERT  •  WORLD SERIES" color="#17698a" width={9} />
    {[-1, 1].flatMap(x => [-1, 1].map(z => <group key={`${x}-${z}`} position={[x * 38, 0, z * 36]}>
      <mesh position={[0, 11, 0]}><cylinderGeometry args={[.14, .3, 22, 8]} /><meshStandardMaterial color="#bac5c5" metalness={.6} /></mesh>
      <mesh position={[0, 22, 0]} rotation={[.2 * z, 0, 0]}><boxGeometry args={[5, 2.6, .3]} /><meshStandardMaterial color="#edf0e5" emissive="#edf0e5" emissiveIntensity={.2} /></mesh>
    </group>))}
  </group>
}
