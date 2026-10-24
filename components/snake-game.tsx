'use client'

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CornerDownLeft, MoveUpRight, Worm } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SnakeBoard } from '@/components/snake-board'
import { GameStats } from '@/components/game-stats'
import { useSnake } from '@/hooks/use-snake'
import type { Direction } from '@/lib/snake'

const arrows = [{ direction: 'left', Icon: ArrowLeft }, { direction: 'up', Icon: ArrowUp }, { direction: 'down', Icon: ArrowDown }, { direction: 'right', Icon: ArrowRight }] as const

export function SnakeGame() {
  const { game, best, start, pause, turn } = useSnake()
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10 sm:py-7">
        <a href="/" className="flex items-center gap-2.5" aria-label="Snake home"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Worm className="size-6 -rotate-12" /></span><span className="text-2xl font-semibold tracking-tight">snake<span className="text-primary">.</span></span></a>
        <a href="#how-to-play" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">How to play <MoveUpRight className="size-4" /></a>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-9 px-5 pb-10 sm:px-8">
        <div className="entry flex flex-col items-center gap-4 pb-1 pt-7 text-center sm:pt-10">
          <span className="rounded-full border border-primary/15 bg-secondary px-3.5 py-1.5 text-sm font-medium text-primary">A good old game. A brand new groove.</span>
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">One more <span className="text-primary">bite.</span></h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">Small beginnings. Longer adventures. See how far you can grow.</p>
        </div>
        <div className="entry flex flex-col gap-5 lg:flex-row" style={{ animationDelay: '100ms' }}>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <SnakeBoard game={game} start={start} pause={pause} turn={turn} />
            <div className="flex flex-col items-center gap-3 lg:hidden" aria-label="Touch controls">
              <div className="flex gap-3">{arrows.map(({ direction, Icon }) => <Button key={direction} variant="outline" size="icon-lg" className="size-12" aria-label={`Move ${direction}`} onClick={() => turn(direction as Direction)}><Icon /></Button>)}</div>
              <p className="text-sm text-muted-foreground">Tap a direction or swipe the board.</p>
            </div>
          </div>
          <GameStats score={game.score} best={best} />
        </div>
        <section id="how-to-play" aria-label="How to play" className="flex scroll-mt-6 flex-col items-center justify-between gap-5 rounded-xl border border-border/80 px-5 py-5 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3"><div className="flex gap-1">{arrows.map(({ direction, Icon }) => <kbd className="keycap" key={direction} aria-label={direction}><Icon className="size-3.5" /></kbd>)}</div><span className="text-sm text-muted-foreground">to move</span></div>
          <div className="flex items-center gap-2"><kbd className="keycap">space</kbd><span className="text-sm text-muted-foreground">to pause</span></div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CornerDownLeft className="size-4 text-primary" /><span>Stay curious. Avoid the walls & yourself.</span></div>
        </section>
        <footer className="flex items-center justify-center gap-2 pt-1 text-sm text-muted-foreground/80"><span>A tiny break from the everyday.</span><span className="text-primary">Happy snaking.</span></footer>
      </main>
    </div>
  )
}
