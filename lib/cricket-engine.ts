export type Phase = 'ready' | 'runup' | 'delivery' | 'flight' | 'result' | 'innings_break' | 'complete'
export type Shot = 'ground' | 'loft'
export type CameraMode = 'broadcast' | 'side' | 'pitch' | 'orbit'
export type Team = 'PAKISTAN' | 'INDIA'

export type InningsScore = {
  team: Team
  runs: number
  wickets: number
  balls: number
}

export type MatchView = {
  phase: Phase; paused: boolean; innings: 1 | 2; battingTeam: Team; bowlingTeam: Team;
  runs: number; wickets: number; balls: number; target: number;
  shot: Shot; direction: number; cameraMode: CameraMode; history: string[]; message: string; detail: string;
  result: string; striker: number; batters: { name: string; runs: number; balls: number }[];
  innings1Score: InningsScore | null; winner: string;
}

export const MAX_BALLS = 12
export const DIRECTIONS = ['Square leg', 'Midwicket', 'Straight', 'Cover drive', 'Point']

const TEAM_ROSTERS: Record<Team, { name: string; runs: number; balls: number }[]> = {
  PAKISTAN: [{ name: 'M. RIZWAN', runs: 0, balls: 0 }, { name: 'B. AZAM', runs: 0, balls: 0 }, { name: 'F. ZAMAN', runs: 0, balls: 0 }, { name: 'S. AYUB', runs: 0, balls: 0 }],
  INDIA: [{ name: 'V. KOHLI', runs: 0, balls: 0 }, { name: 'R. SHARMA', runs: 0, balls: 0 }, { name: 'S. GILL', runs: 0, balls: 0 }, { name: 'H. PANDYA', runs: 0, balls: 0 }]
}

export function initialMatch(): MatchView {
  return {
    phase: 'ready', paused: false, innings: 1, battingTeam: 'PAKISTAN', bowlingTeam: 'INDIA',
    runs: 0, wickets: 0, balls: 0, target: 0, shot: 'ground', direction: 2, cameraMode: 'broadcast',
    history: [], message: '1st Innings: Pakistan Batting', detail: 'Set a high target score in 2 overs (12 balls).',
    result: '', striker: 0, batters: TEAM_ROSTERS.PAKISTAN.map(b => ({ ...b })),
    innings1Score: null, winner: ''
  }
}

export class CricketEngine {
  view = initialMatch()
  time = 0
  swingTime = -1
  hit = false
  flightRuns = 0
  shotAngle = 0
  deliveryDuration = 1.6
  onChange: (view: MatchView) => void = () => {}
  onSound: (type: 'hit' | 'wicket' | 'boundary') => void = () => {}

  publish() { this.onChange({ ...this.view, history: [...this.view.history], batters: this.view.batters.map(b => ({ ...b })) }) }
  setPhase(phase: Phase) { this.view.phase = phase; this.time = 0; this.publish() }
  reset() { this.view = initialMatch(); this.time = 0; this.swingTime = -1; this.hit = false; this.publish() }
  togglePause() { if (['complete', 'innings_break'].includes(this.view.phase)) return; this.view.paused = !this.view.paused; this.publish() }
  setDirection(n: number) { this.view.direction = Math.max(0, Math.min(4, n)); this.publish() }
  setShot(shot: Shot) { this.view.shot = shot; this.publish() }
  setCameraMode(mode: CameraMode) { this.view.cameraMode = mode; this.publish() }
  cycleCameraMode() {
    const modes: CameraMode[] = ['broadcast', 'side', 'pitch', 'orbit']
    const idx = modes.indexOf(this.view.cameraMode)
    this.view.cameraMode = modes[(idx + 1) % modes.length]
    this.publish()
  }

  startInnings2() {
    if (!this.view.innings1Score) return
    const target = this.view.innings1Score.runs + 1
    const nextBattingTeam: Team = this.view.innings1Score.team === 'PAKISTAN' ? 'INDIA' : 'PAKISTAN'
    const nextBowlingTeam: Team = this.view.innings1Score.team === 'PAKISTAN' ? 'PAKISTAN' : 'INDIA'

    this.view.innings = 2
    this.view.battingTeam = nextBattingTeam
    this.view.bowlingTeam = nextBowlingTeam
    this.view.runs = 0
    this.view.wickets = 0
    this.view.balls = 0
    this.view.target = target
    this.view.history = []
    this.view.striker = 0
    this.view.batters = TEAM_ROSTERS[nextBattingTeam].map(b => ({ ...b }))
    this.view.message = `2nd Innings: ${nextBattingTeam} Chasing ${target}`
    this.view.detail = `Need ${target} runs in 2 overs (12 balls) to win!`
    this.setPhase('ready')
  }

  bowl() {
    if (this.view.phase !== 'ready' || this.view.paused) return
    this.hit = false; this.swingTime = -1; this.flightRuns = 0
    this.deliveryDuration = Math.max(1.1, 1.65 - this.view.balls * 0.035)
    this.view.message = 'Watch the ball'
    this.view.detail = this.view.innings === 2 ? `${Math.max(0, this.view.target - this.view.runs)} needed from ${MAX_BALLS - this.view.balls} balls.` : `Set a target in 2 overs.`
    this.setPhase('runup')
  }

  swing() {
    if (this.view.paused) return
    if (this.view.phase === 'ready') { this.bowl(); return }
    if (this.view.phase === 'runup') {
      this.swingTime = 0
      return
    }
    if (this.view.phase !== 'delivery') return
    if (this.swingTime < 0) this.swingTime = this.time

    const error = Math.abs(this.time / this.deliveryDuration - 0.9)
    const loft = this.view.shot === 'loft'
    this.shotAngle = (this.view.direction - 2) * 0.58
    this.hit = true

    if (error <= 0.12) {
      this.flightRuns = loft ? 6 : 4
      this.view.message = loft ? 'SIX! Massive hit!' : 'FOUR! Raced away to the boundary!'
      this.view.detail = 'Right out of the middle of the bat.'
    } else if (error <= 0.28) {
      this.flightRuns = loft ? 4 : (this.view.direction === 2 ? 2 : 3)
      this.view.message = loft ? 'FOUR! Cleared the infield!' : 'Nicely played into the gap!'
      this.view.detail = 'Solid connection.'
    } else if (error <= 0.48) {
      this.flightRuns = loft ? (Math.random() > 0.4 ? 1 : -1) : 1
      this.view.message = this.flightRuns < 0 ? 'Caught out! High in the air.' : 'Edged! Taken a quick single.'
      this.view.detail = 'Mistimed shot off the edge of the bat.'
    } else {
      this.hit = false
      this.flightRuns = -1
      this.view.message = this.time / this.deliveryDuration < 0.67 ? 'Too early! Missed it.' : 'Too late! Bowled!'
      this.view.detail = 'Keep your eyes on the timing bar.'
    }

    this.onSound(this.hit ? (this.flightRuns >= 4 ? 'boundary' : 'hit') : 'wicket')
    this.setPhase('flight')
  }

  finishBall(runs: number) {
    const wicket = runs < 0
    this.view.balls++
    const batter = this.view.batters[this.view.striker]
    batter.balls++
    this.view.runs += Math.max(0, runs); batter.runs += Math.max(0, runs)
    if (wicket) { this.view.wickets++; this.view.striker = Math.min(3, this.view.striker + 1) }
    else if (runs % 2 === 1 && this.view.striker < 2) this.view.striker = this.view.striker === 0 ? 1 : 0
    
    this.view.result = wicket ? 'W' : String(runs)
    this.view.history.push(this.view.result)
    this.view.message = wicket ? (this.hit ? 'Caught out!' : 'Bowled!') : runs === 6 ? 'That’s a SIX!' : runs === 4 ? 'FOUR. Beautifully played.' : `${runs} ${runs === 1 ? 'run' : 'runs'} on the board`
    this.view.detail = wicket ? 'New batter at the crease.' : runs >= 4 ? 'Right out of the middle of the bat.' : 'Find the gaps.'
    this.onSound(wicket ? 'wicket' : runs >= 4 ? 'boundary' : 'hit')
    this.setPhase('result')
  }

  tick(delta: number) {
    if (this.view.paused || ['ready', 'innings_break', 'complete'].includes(this.view.phase)) return
    this.time += Math.min(delta, 0.05)
    if (this.view.phase === 'runup' && this.time >= 1.35) this.setPhase('delivery')
    else if (this.view.phase === 'delivery' && this.time >= this.deliveryDuration * 1.1) this.finishBall(-1)
    else if (this.view.phase === 'flight' && this.time >= 2.0) this.finishBall(this.flightRuns)
    else if (this.view.phase === 'result' && this.time >= 2.5) {
      if (this.view.innings === 1) {
        // Check if 1st Innings is complete
        if (this.view.balls >= MAX_BALLS || this.view.wickets >= 3) {
          this.view.innings1Score = {
            team: this.view.battingTeam,
            runs: this.view.runs,
            wickets: this.view.wickets,
            balls: this.view.balls
          }
          this.view.message = `Innings 1 Complete!`
          this.view.detail = `${this.view.battingTeam} scored ${this.view.runs}/${this.view.wickets}. ${this.view.bowlingTeam} needs ${this.view.runs + 1} runs to win.`
          this.setPhase('innings_break')
          return
        }
      } else {
        // 2nd Innings Check
        const target = this.view.target
        if (this.view.runs >= target) {
          // Chasing team wins
          const wicketsLeft = 3 - this.view.wickets
          this.view.winner = `${this.view.battingTeam} WON BY ${wicketsLeft} ${wicketsLeft === 1 ? 'WICKET' : 'WICKETS'}!`
          this.setPhase('complete')
          return
        }
        if (this.view.balls >= MAX_BALLS || this.view.wickets >= 3) {
          // 2nd Innings Over
          if (this.view.runs === target - 1) {
            this.view.winner = `MATCH TIED!`
          } else {
            const runsWon = target - 1 - this.view.runs
            this.view.winner = `${this.view.bowlingTeam} WON BY ${runsWon} ${runsWon === 1 ? 'RUN' : 'RUNS'}!`
          }
          this.setPhase('complete')
          return
        }
      }

      this.view.message = 'Ready for next ball?'
      this.view.detail = this.view.innings === 2 ? `${Math.max(0, this.view.target - this.view.runs)} runs needed from ${MAX_BALLS - this.view.balls} balls.` : `${MAX_BALLS - this.view.balls} balls remaining in 1st Innings.`
      this.setPhase('ready')
    }
  }
}
