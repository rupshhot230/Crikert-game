export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Status = 'ready' | 'playing' | 'paused' | 'over' | 'won'
export type Game = { snake: Point[]; food: Point; direction: Direction; score: number; status: Status }
export const COLS = 24
export const ROWS = 20
export const vectors: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
export const levelFor = (score: number) => Math.min(10, Math.floor(score / 50) + 1)
export const speedFor = (score: number) => 190 - (levelFor(score) - 1) * 14
export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y
export function initialGame(): Game {
  return { snake: Array.from({ length: 5 }, (_, i) => ({ x: 7 - i, y: 10 })), food: { x: 13, y: 10 }, direction: 'right', score: 0, status: 'ready' }
}
export function placeFood(snake: Point[]): Point | null {
  const free: Point[] = []
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (!snake.some(p => p.x === x && p.y === y)) free.push({ x, y })
  }
  return free.length ? free[Math.floor(Math.random() * free.length)] : null
}
export function canTurn(from: Direction, to: Direction) {
  return vectors[from].x + vectors[to].x !== 0 || vectors[from].y + vectors[to].y !== 0
}
export function advance(game: Game, direction: Direction): Game {
  if (game.status !== 'playing') return game
  const movement = vectors[direction]
  const head = { x: game.snake[0].x + movement.x, y: game.snake[0].y + movement.y }
  const eating = samePoint(head, game.food)
  const body = eating ? game.snake : game.snake.slice(0, -1)
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || body.some(p => samePoint(p, head))) return { ...game, status: 'over' }
  const snake = [head, ...game.snake]
  if (!eating) snake.pop()
  const food = eating ? placeFood(snake) : game.food
  return { ...game, snake, food: food ?? game.food, score: game.score + (eating ? 10 : 0), direction, status: food ? 'playing' : 'won' }
}
