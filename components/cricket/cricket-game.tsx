'use client'

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Camera, CircleHelp, Maximize, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react'
import { CricketEngine, initialMatch } from '@/lib/cricket-engine'
import { BattingControls, MatchPrompt, Radar, Scoreboard } from './match-hud'

const CricketScene = dynamic(() => import('./cricket-scene'), { ssr: false, loading: () => <div className="scene-loading"><span className="loading-ball" />Preparing the pitch…</div> })
class SceneBoundary extends Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? <div className="canvas-fallback">The 3D pitch could not load. Enable hardware acceleration, then <button onClick={() => window.location.reload()}>reload the game</button>.</div> : this.props.children }
}
export function CricketGame() {
  const [engine] = useState(() => new CricketEngine())
  const [match, setMatch] = useState(initialMatch)
  const [sound, setSound] = useState(false)
  const [cameraMode, setCameraMode] = useState(false)
  const [notice, setNotice] = useState('')
  const markerRef = useRef<HTMLDivElement>(null)
  const help = useRef<HTMLDialogElement>(null)
  const root = useRef<HTMLElement>(null)
  const audio = useRef<AudioContext | null>(null)
  const helpPaused = useRef(false)
  useEffect(() => { engine.onChange = setMatch; return () => { engine.onChange = () => {} } }, [engine])
  useEffect(() => {
    engine.onSound = (type) => {
      if (!sound || !audio.current) return
      const ctx = audio.current; const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination); osc.type = type === 'hit' ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(type === 'wicket' ? 170 : type === 'boundary' ? 740 : 440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(type === 'wicket' ? 65 : 230, ctx.currentTime + .25)
      gain.gain.setValueAtTime(.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .3)
      osc.start(); osc.stop(ctx.currentTime + .32)
    }
    return () => { engine.onSound = () => {} }
  }, [engine, sound])
  useEffect(() => () => { void audio.current?.close() }, [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229 || help.current?.open || (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return
      const key = event.key.toLowerCase()
      if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', 'p', 'l', 'c', 'escape'].includes(key)) event.preventDefault()
      if (event.repeat) return
      if (key === ' ') engine.swing()
      else if (key === 'arrowleft' || key === 'a') engine.setDirection(engine.view.direction - 1)
      else if (key === 'arrowright' || key === 'd') engine.setDirection(engine.view.direction + 1)
      else if (key === 'l') engine.setShot(engine.view.shot === 'ground' ? 'loft' : 'ground')
      else if (key === 'arrowup' || key === 'w') engine.setShot('loft')
      else if (key === 'arrowdown' || key === 's') engine.setShot('ground')
      else if (key === 'c') engine.cycleCameraMode()
      else if (key === 'p' || key === 'escape') engine.togglePause()
    }
    const onHidden = () => { if (document.hidden && !engine.view.paused && !['ready', 'complete'].includes(engine.view.phase)) engine.togglePause() }
    window.addEventListener('keydown', onKey); document.addEventListener('visibilitychange', onHidden)
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onHidden) }
  }, [engine])
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer) }, [notice])
  const toggleSound = async () => {
    if (!sound) {
      try { if (!audio.current) audio.current = new AudioContext(); await audio.current.resume() } catch { setNotice('Audio is not available in this browser.'); return }
    }
    setSound(!sound)
  }
  const fullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.current?.requestFullscreen() } catch { setNotice('Fullscreen is unavailable in this preview. Open the published game for fullscreen play.') }
  }
  const openHelp = () => {
    helpPaused.current = !engine.view.paused && engine.view.phase !== 'complete'
    if (helpPaused.current) engine.togglePause()
    help.current?.showModal()
  }
  const closeHelp = useCallback(() => { if (helpPaused.current && engine.view.paused) engine.togglePause(); helpPaused.current = false }, [engine])
  return <main className="cricket-app font-sans" ref={root}>
    <header className="app-header">
      <a className="brand" href="/" aria-label="CRIKERT home"><span className="wicket-mark" aria-hidden="true"><i /><i /><i /><b /></span>CRIKERT<span className="brand-dot">.</span></a>
      <div className="header-divider" /><span className="mode-tag">QUICK MATCH</span><span className="header-caption">The game. In your hands.</span>
      <div className="header-actions"><button className="help-button" onClick={openHelp}><CircleHelp size={17} /><span>How to play</span></button><span className="header-divider" /><button className="header-icon" aria-label={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound} onClick={toggleSound}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button><button className="header-icon" aria-label="Toggle fullscreen" onClick={fullscreen}><Maximize size={18} /></button></div>
    </header>
    <section className="arena" aria-label="3D cricket match" data-phase={match.phase} data-paused={match.paused}>
      <div className="scene"><SceneBoundary><CricketScene engine={engine} markerRef={markerRef} /></SceneBoundary></div>
      <div className="arena-vignette" />
      <div className="arena-top"><Radar direction={match.direction} /><div className="match-heading"><span className="eyebrow">WORLD CRICKET SERIES</span><div>PAKISTAN <span>v</span> INDIA</div><span className="venue">DAY MATCH <span>·</span> NATIONAL STADIUM</span></div><div className="broadcast-controls"><span className="live-label"><span className="live-dot" /> LIVE <span>HD</span></span><button className="pause-button" aria-label={match.paused ? 'Resume match' : 'Pause match'} disabled={match.phase === 'complete'} onClick={() => engine.togglePause()}>{match.paused ? <Play size={21} /> : <Pause size={21} fill="currentColor" />}</button></div></div>
      <div className="camera-row">
        <button className="camera-button" onClick={() => engine.cycleCameraMode()}>
          <Camera size={15} />
          {match.cameraMode === 'broadcast' ? 'BROADCAST' : match.cameraMode === 'side' ? 'SIDE VIEW' : match.cameraMode === 'pitch' ? 'PITCH CAM' : 'FREE 3D ORBIT'}
          <span>↗</span>
        </button>
      </div>
      <BattingControls match={match} engine={engine} markerRef={markerRef} />
      <MatchPrompt match={match} engine={engine} />
      <Scoreboard match={match} />
      {notice && <div className="game-notice" role="status">{notice}</div>}
    </section>
    <footer className="app-footer"><span className="footer-status"><span className="live-dot" /> ALL PLAY. NO DOWNLOADS.</span><div className="footer-shortcuts"><span><kbd>SPACE</kbd> Play shot</span><span><kbd>← / A</kbd><kbd>→ / D</kbd> Aim</span><span><kbd>L</kbd> Loft</span><span><kbd>C</kbd> Camera</span><span><kbd>P</kbd> Pause</span></div><button onClick={openHelp}>New to the crease? <ArrowUpRight size={14} /></button></footer>
    <dialog className="help-dialog" ref={help} onClose={closeHelp} onClick={e => { if (e.target === e.currentTarget) help.current?.close() }}>
      <div className="help-content"><button className="dialog-close header-icon" aria-label="Close instructions" onClick={() => help.current?.close()}><X size={20} /></button><span className="eyebrow">YOUR QUICK START</span><h2>Find your timing.</h2><p>Bat for Pakistan. Chase 30 runs in 12 balls before losing 3 wickets.</p><ul><li><kbd>SPACE</kbd><div><strong>Start & swing</strong><span>Start the delivery, then press again when the marker reaches the green zone.</span></div></li><li><kbd>← → / A D</kbd><div><strong>Pick your direction</strong><span>Find a gap with five shot directions. The 3D batsman rotates to face your shot angle!</span></div></li><li><kbd>L</kbd><div><strong>Go big</strong><span>Toggle a lofted shot. Perfect timing scores six; a mistimed loft can be caught.</span></div></li><li><kbd>C</kbd><div><strong>Camera Angle</strong><span>Switch between Broadcast, Side View, Pitch Cam, and Free 3D Orbit drag mode!</span></div></li><li><kbd>P</kbd><div><strong>Take a pause</strong><span>Pause any time. Deliveries get faster as the innings progresses.</span></div></li></ul><p className="help-mobile-note">On touch screens, use the aim arrows, shot selector, camera switcher, and swing button.</p><button className="primary-action" onClick={() => help.current?.close()}><Play size={16} /> Let&apos;s play</button></div>
    </dialog>
  </main>
}
