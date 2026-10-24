'use client'

import { useRef } from 'react'
import { ArrowRight, Pause, Play, RotateCcw, Trophy, Worm } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COLS, ROWS, speedFor, type Direction, type Game } from '@/lib/snake'
import { cn } from '@/lib/utils'

const previewSnake = [
  { x: 7, y: 6 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 },
  { x: 4, y: 7 }, { x: 4, y: 8 }, { x: 4, y: 9 }, { x: 4, y: 10 },
  { x: 4, y: 11 }, { x: 4, y: 12 }, { x: 4, y: 13 }, { x: 5, y: 13 },
  { x: 6, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 },
]
const rotation: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 }

export function SnakeBoard({ game, start, pause, turn }: { game: Game; start: () => void; pause: () => void; turn: (direction: Direction) => void }) {
  const board = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const isReady = game.status === 'ready'
  const snake = isReady ? previewSnake : game.snake
  const food = isReady ? { x: 18, y: 6 } : game.food
  const active = game.status === 'playing'
  const ended = game.status === 'over' || game.status === 'won'
  function play() {
    if (game.status === 'paused') pause()
    else start()
    board.current?.focus({ preventScroll: true })
  }
  return (
    <section className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4" aria-label="Snake playfield">
      <div className="flex items-center justify-between px-1 pb-4 pt-1">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><span className={cn('size-1.5 rounded-full', active ? 'bg-primary' : 'bg-muted-foreground/50')} />{active ? 'In the flow' : game.status === 'paused' ? 'Taking a breather' : ended ? 'That’s a wrap' : 'Your next little escape'}</div>
        <span className="font-mono text-sm text-muted-foreground">24 × 20</span>
      </div>
      <div
        ref={board}
        tabIndex={0}
        className="playfield relative aspect-[6/5] touch-none overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Game board. ${game.status}. Score ${game.score}. Use arrow keys to move and space to pause.`}
        onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }}
        onTouchEnd={event => {
          if (!touch.current) return
          const x = event.changedTouches[0].clientX - touch.current.x
          const y = event.changedTouches[0].clientY - touch.current.y
          if (Math.max(Math.abs(x), Math.abs(y)) > 12) turn(Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'))
          touch.current = null
        }}
      >
        <div aria-hidden="true" className={cn('absolute inset-0 transition-opacity duration-300', !active && !isReady && 'opacity-30')}>
          {snake.map((point, index) => (
            <div key={index} data-snake-segment className="snake-segment" style={{ transform: `translate(${point.x * 100}%, ${point.y * 100}%)`, transitionDuration: isReady ? '0ms' : `${speedFor(game.score)}ms`, opacity: Math.max(.4, 1 - index * .022) }}>
              <div className={cn('snake-pixel', index === 0 && 'snake-head')} style={index === 0 ? { transform: `rotate(${rotation[game.direction]}deg)` } : undefined} />
            </div>
          ))}
          <div className="food" style={{ left: `${food.x / COLS * 100}%`, top: `${food.y / ROWS * 100}%` }}><span className="food-dot" /></div>
        </div>
        {!active && (
          <div className={cn('absolute inset-0 flex items-center justify-center', !isReady && 'bg-secondary/65 backdrop-blur-sm')}>
            <div className="entry flex flex-col items-center gap-5 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-card bg-card text-primary shadow-sm sm:size-20">
                {isReady ? <Worm className="size-10 -rotate-12" strokeWidth={2.2} /> : game.status === 'paused' ? <Pause className="size-8" /> : game.status === 'won' ? <Trophy className="size-9" /> : <RotateCcw className="size-8" />}
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{isReady ? 'Ready to roll?' : game.status === 'paused' ? 'No rush.' : game.status === 'won' ? 'You filled the board!' : 'One more round?'}</h2>
                <p className="text-sm text-muted-foreground sm:text-base">{isReady ? 'A classic game. A fresh start.' : game.status === 'paused' ? 'Your snake will be right here.' : `Game over · ${game.score} points · ${snake.length} segments`}</p>
              </div>
              <Button size="lg" onClick={play} className="h-12 min-w-44 rounded-xl px-6">
                {ended ? <RotateCcw data-icon="inline-start" /> : <Play data-icon="inline-start" fill="currentColor" />}
                {isReady ? 'Let’s play' : game.status === 'paused' ? 'Keep going' : 'Play again'}
                <ArrowRight data-icon="inline-end" />
              </Button>
              <span className="text-sm text-muted-foreground">or press <kbd className="rounded border border-primary/15 px-2 py-0.5 font-mono text-sm">space</kbd></span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-1 pb-1 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2 rounded-full bg-accent" />Eat. Grow. Repeat.</div>
        <Button variant="ghost" size="sm" onClick={() => { pause(); board.current?.focus({ preventScroll: true }) }} disabled={isReady || ended} aria-label={game.status === 'paused' ? 'Resume game' : 'Pause game'}>
          {game.status === 'paused' ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}<span>{game.status === 'paused' ? 'Resume' : 'Pause'}</span><span className="hidden sm:inline">[ P ]</span>
        </Button>
      </div>
    </section>
  )
}
