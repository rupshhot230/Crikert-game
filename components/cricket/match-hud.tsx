'use client'

import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Crosshair, MoveUpRight, Pause, Play, RotateCcw, Trophy } from 'lucide-react'
import { CricketEngine, DIRECTIONS, MatchView, MAX_BALLS } from '@/lib/cricket-engine'

export function Radar({ direction }: { direction: number }) {
  const points = [[28, 31], [41, 25], [61, 29], [71, 44], [30, 63], [78, 68], [22, 20], [80, 20], [50, 39], [50, 65]]
  return <div className="radar-block"><div className="radar" aria-label={`Field positions. Aiming ${DIRECTIONS[direction]}`}><span className="radar-infield" /><span className="radar-pitch" /><span className="radar-aim" style={{ transform: `rotate(${(direction - 2) * 34}deg)` }} />{points.map(([x, y], i) => <span className="radar-player" key={i} style={{ left: `${x}%`, top: `${y}%` }} />)}<span className="radar-batter" /></div><span className="eyebrow">FIELD OVERVIEW</span></div>
}
export function Scoreboard({ match }: { match: MatchView }) {
  const batter = match.batters[match.striker]
  const partner = match.batters[match.striker === 0 ? 1 : 0]
  const rate = match.balls ? (match.runs / (match.balls / 6)).toFixed(2) : '0.00'
  const isPak = match.battingTeam === 'PAKISTAN'

  return <section className="scoreboard" aria-label="Live match scoreboard">
    <div className="score-main">
      <div className="team-score">
        <span className={isPak ? 'pak-flag' : 'ind-flag'} aria-label={`${match.battingTeam} flag`}>
          {isPak ? <span>☾</span> : <span className="ind-wheel">☸</span>}
        </span>
        <span className="team-code">{match.battingTeam === 'PAKISTAN' ? 'PAK' : 'IND'}</span>
        <strong data-testid="score">{match.runs}<span>/{match.wickets}</span></strong>
      </div>
      <div className="overs-score">
        <span className="eyebrow">OVERS</span>
        <strong>{Math.floor(match.balls / 6)}.{match.balls % 6}<small> / 2</small></strong>
      </div>
      <div className="chase-score">
        {match.innings === 1 ? (
          <>
            <span className="eyebrow">1ST INNINGS</span>
            <span>Setting Target Score · <b>{MAX_BALLS - match.balls}</b> balls remaining</span>
          </>
        ) : (
          <>
            <span className="eyebrow">TARGET {match.target}</span>
            <span>{match.runs >= match.target ? `${match.battingTeam} wins the match!` : <><b>{match.target - match.runs}</b> runs needed from <b>{MAX_BALLS - match.balls}</b> balls</>}</span>
          </>
        )}
      </div>
      <div className="match-label">
        <span className="live-dot" /> INN {match.innings} <span className="muted">·</span> {match.battingTeam} vs {match.bowlingTeam} <span className="match-format">T2</span>
      </div>
    </div>
    <div className="score-secondary">
      <div className="batter-stat">
        <span className="striker-indicator" />{batter.name}<strong>{batter.runs} <small>({batter.balls})</small></strong>
        <span className="partner">{partner.name}<strong>{partner.runs} <small>({partner.balls})</small></strong></span>
      </div>
      <span className="bowler-name">{match.bowlingTeam === 'INDIA' ? 'BUMRAH' : 'SHAHEEN'} <span className="muted">TO</span> {batter.name.split('. ')[1] ?? batter.name}</span>
      <div className="over-history" aria-label="Recent balls">
        {Array.from({ length: 6 }, (_, i) => {
          const start = Math.max(0, Math.floor((Math.max(1, match.balls) - 1) / 6) * 6);
          const result = match.history[start + i];
          return <span key={i} className={`ball-result ${result === 'W' ? 'wicket' : Number(result) >= 4 ? 'boundary' : ''}`}>{result ?? '·'}</span>
        })}
      </div>
      <span className="run-rate">CRR <strong>{rate}</strong></span>
    </div>
  </section>
}

export function BattingControls({ match, engine, markerRef }: { match: MatchView; engine: CricketEngine; markerRef: React.RefObject<HTMLDivElement | null> }) {
  const delivery = match.phase === 'delivery'
  return <>
    <div className="direction-control">
      <span className="eyebrow">SHOT DIRECTION</span>
      <div className="direction-row"><button className="glass-icon" aria-label="Aim left" disabled={match.direction === 0} onClick={() => engine.setDirection(match.direction - 1)}><ArrowLeft size={18} /></button><div className="direction-label"><Crosshair size={19} /><span>{DIRECTIONS[match.direction]}</span></div><button className="glass-icon" aria-label="Aim right" disabled={match.direction === 4} onClick={() => engine.setDirection(match.direction + 1)}><ArrowRight size={18} /></button></div>
      <span className="control-hint"><kbd>← / A</kbd> <kbd>→</kbd> aim gap</span>
    </div>
    <div className="batting-control">
      <div className="shot-switch" aria-label="Shot type"><button aria-pressed={match.shot === 'ground'} className={match.shot === 'ground' ? 'selected' : ''} onClick={() => engine.setShot('ground')}><MoveUpRight size={17} /> Ground</button><button aria-pressed={match.shot === 'loft'} className={match.shot === 'loft' ? 'selected' : ''} onClick={() => engine.setShot('loft')}><ArrowUpRight size={17} /> Loft <kbd>L</kbd></button></div>
      <div className="timing-label"><span className="eyebrow">SHOT TIMING</span><span>{delivery ? 'Watch the green zone' : match.shot === 'loft' ? 'High risk. Big reward.' : 'Timing is everything.'}</span></div>
      <div className="timing-meter" role="img" aria-label="Timing bar. Swing when the marker reaches the green zone near the right edge."><span className="perfect-zone" /><span className="timing-marker" ref={markerRef} /><span className="meter-notch" /></div>
      <button className="swing-button" onClick={() => engine.swing()} disabled={!['ready', 'delivery'].includes(match.phase) || match.paused}>{delivery ? 'SWING BAT' : match.phase === 'ready' ? `BOWL (INN ${match.innings})` : match.phase === 'runup' ? 'BOWLER APPROACHING' : 'BALL IN PLAY'}<kbd>SPACE</kbd></button>
    </div>
  </>
}

export function MatchPrompt({ match, engine }: { match: MatchView; engine: CricketEngine }) {
  if (match.phase === 'innings_break') {
    const score = match.innings1Score
    return <div className="match-overlay">
      <div className="end-card" role="status">
        <span className="end-icon"><Check size={36} /></span>
        <span className="eyebrow">INNINGS 1 COMPLETE</span>
        <h2>{score?.team} posted {score?.runs}/{score?.wickets}</h2>
        <p><strong>{match.bowlingTeam}</strong> needs <strong>{match.target} runs</strong> in 2 overs (12 balls) to win the match.</p>
        <button className="primary-action" onClick={() => engine.startInnings2()}>
          <Play size={16} fill="currentColor" /> Start 2nd Innings (Chase Target)
        </button>
      </div>
    </div>
  }

  if (match.phase === 'complete') {
    const score1 = match.innings1Score
    return <div className="match-overlay">
      <div className="end-card" role="status">
        <span className="end-icon"><Trophy size={36} /></span>
        <span className="eyebrow">MATCH FINISHED</span>
        <h2>{match.winner}</h2>
        
        <div className="match-scores-summary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>1st Innings ({score1?.team}):</span>
            <strong>{score1?.runs}/{score1?.wickets} ({Math.floor((score1?.balls ?? 0) / 6)}.{(score1?.balls ?? 0) % 6} ov)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>2nd Innings ({match.battingTeam}):</span>
            <strong>{match.runs}/{match.wickets} ({Math.floor(match.balls / 6)}.{match.balls % 6} ov)</strong>
          </div>
        </div>

        <button className="primary-action" onClick={() => engine.reset()}>
          <RotateCcw size={17} /> Play New Match
        </button>
      </div>
    </div>
  }

  if (match.paused) return <div className="match-overlay"><div className="end-card"><Pause size={28} /><h2>Take a breather.</h2><p>Your innings will be right here.</p><button className="primary-action" onClick={() => engine.togglePause()}><Play size={17} /> Resume match</button><button className="text-action" onClick={() => engine.reset()}>Restart match</button></div></div>
  if (match.phase === 'result' || match.phase === 'flight') return <div className={`result-callout ${match.result === 'W' && match.phase === 'result' ? 'is-wicket' : ''}`} role="status"><span className="result-icon">{match.phase === 'flight' ? <Check size={22} /> : match.result === 'W' ? 'W' : `+${match.result}`}</span><div><strong>{match.message}</strong><span>{match.detail}</span></div></div>
  if (match.phase !== 'ready') return null

  return <div className="ready-callout">
    <div className="ready-line" />
    <span className="eyebrow">{match.innings === 1 ? '1ST INNINGS · SET A TARGET' : '2ND INNINGS · CHASE TARGET'}</span>
    <h1>{match.message}</h1>
    <p>{match.detail}</p>
    <button className="primary-action" onClick={() => engine.bowl()}>
      <Play size={15} fill="currentColor" />{match.balls === 0 ? `Start Innings ${match.innings}` : 'Next delivery'}<kbd>SPACE</kbd>
    </button>
  </div>
}
