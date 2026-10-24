import { ArrowUpRight, Trophy, Zap } from 'lucide-react'
import { levelFor } from '@/lib/snake'

export function GameStats({ score, best }: { score: number; best: number }) {
  const level = levelFor(score)
  const remaining = 5 - (score / 10) % 5
  return (
    <aside className="flex flex-col gap-4 lg:w-64 xl:w-72" aria-label="Game statistics">
      <div className="grid grid-cols-2 gap-4 lg:flex lg:flex-col">
        <section className="flex flex-col gap-5 rounded-2xl border border-primary/15 bg-secondary p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-primary">YOUR SCORE</h2><ArrowUpRight className="size-4 text-primary" /></div>
          <span className="font-mono text-5xl font-medium tracking-tighter text-foreground sm:text-6xl" aria-live="polite">{String(score).padStart(3, '0')}</span>
          <p className="text-sm text-muted-foreground">Every bite counts. <span className="text-primary">+10 pts</span></p>
        </section>
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Trophy className="size-4" /><h2>SESSION BEST</h2></div>
          <span className="font-mono text-3xl font-medium tracking-tight">{String(best).padStart(3, '0')}</span>
          <p className="text-sm text-muted-foreground">Your personal little challenge.</p>
        </section>
      </div>
      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Zap className="size-4" /><h2>LEVEL {String(level).padStart(2, '0')}</h2></div><span className="rounded-md bg-secondary px-2 py-1 text-sm text-primary">{level < 3 ? 'Easy does it' : level < 6 ? 'Picking up' : level < 9 ? 'Quick thinking' : 'Full speed'}</span></div>
        <div className="flex gap-1.5" role="progressbar" aria-label="Progress to next level" aria-valuenow={level === 10 ? 5 : (score / 10) % 5} aria-valuemin={0} aria-valuemax={5}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} className="h-1.5 flex-1 rounded-full bg-primary" style={{ opacity: level === 10 || index < (score / 10) % 5 ? 1 : .13 }} />)}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{level === 10 ? 'Top speed. You’re in a league of your own.' : `${remaining} more ${remaining === 1 ? 'bite' : 'bites'} to level up. A little faster, a little trickier.`}</p>
      </section>
      <div className="flex items-start gap-3 px-2 py-2 text-sm leading-relaxed text-muted-foreground"><span className="pt-0.5 text-primary"><Wink /></span><p>No finish line. No pressure.<br />Just you and one more bite.</p></div>
    </aside>
  )
}
function Wink() { return <span aria-hidden="true" className="font-mono text-lg">:)</span> }
