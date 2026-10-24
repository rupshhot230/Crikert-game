'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { advance, canTurn, initialGame, speedFor, type Direction, type Game } from '@/lib/snake'

export function useSnake() {
  const [game, setGame] = useState<Game>(initialGame)
  const [best, setBest] = useState(0)
  const current = useRef(game)
  const queue = useRef<Direction[]>([])
  const commit = useCallback((next: Game) => {
    current.current = next
    setGame(next)
    setBest(previous => Math.max(previous, next.score))
  }, [])
  const start = useCallback(() => {
    queue.current = []
    commit({ ...initialGame(), status: 'playing' })
  }, [commit])
  const pause = useCallback(() => {
    const state = current.current
    if (state.status === 'playing' || state.status === 'paused') commit({ ...state, status: state.status === 'playing' ? 'paused' : 'playing' })
  }, [commit])
  const turn = useCallback((direction: Direction) => {
    if (current.current.status !== 'playing' || queue.current.length >= 2) return
    const last = queue.current.at(-1) ?? current.current.direction
    if (last !== direction && canTurn(last, direction)) queue.current.push(direction)
  }, [])

  useEffect(() => {
    if (game.status !== 'playing') return
    const timer = setInterval(() => {
      const state = current.current
      commit(advance(state, queue.current.shift() ?? state.direction))
    }, speedFor(game.score))
    return () => clearInterval(timer)
  }, [game.status, game.score, commit])

  useEffect(() => {
    const directions: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return
      if (directions[event.key]) { event.preventDefault(); turn(directions[event.key]); return }
      if ((event.code === 'Space' || event.key.toLowerCase() === 'p' || event.key === 'Escape') && !event.repeat) {
        if (event.code === 'Space' && event.target instanceof HTMLElement && event.target.closest('button')) return
        event.preventDefault()
        if (current.current.status === 'ready' || current.current.status === 'over' || current.current.status === 'won') {
          if (event.key !== 'Escape') start()
        } else pause()
      }
      if (event.key.toLowerCase() === 'r' && !event.repeat && ['over', 'won', 'ready'].includes(current.current.status)) start()
    }
    const autoPause = () => { if (current.current.status === 'playing') pause() }
    const visibility = () => { if (document.hidden) autoPause() }
    window.addEventListener('keydown', keydown)
    window.addEventListener('blur', autoPause)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('blur', autoPause)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [turn, pause, start])
  return { game, best, start, pause, turn }
}
