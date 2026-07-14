import type { Card, Rank, Suit } from '../../src/cards'

export type Classified =
  | { kind: 'blank' }
  | { kind: 'hand'; hand: number; cardsLeft: number }
  | { kind: 'cards'; cards: Card[] }
  | { kind: 'solution'; text: string }
  | { kind: 'count'; text: string }
  | { kind: 'noresult' }
  | { kind: 'summary'; text: string }
  | { kind: 'plain'; text: string }

const CARD_RE = /(10|[A2-9JQK])([♠♥♦♣])/g

export function classifyLine(line: string): Classified {
  if (line === '') return { kind: 'blank' }
  const hand = line.match(/^--- Hand (\d+) \((\d+) cards left\) ---$/)
  if (hand) return { kind: 'hand', hand: Number(hand[1]), cardsLeft: Number(hand[2]) }
  if (line.startsWith('Cards: ')) {
    const cards: Card[] = []
    for (const m of line.matchAll(CARD_RE)) {
      cards.push({ rank: m[1] as Rank, suit: m[2] as Suit })
    }
    if (cards.length === 4) return { kind: 'cards', cards }
  }
  if (line.startsWith('Solution: ')) return { kind: 'solution', text: line }
  if (/^\d+ distinct solutions?$/.test(line)) return { kind: 'count', text: line }
  if (line === 'NO RESULT') return { kind: 'noresult' }
  if (line.startsWith('Hands played: ')) return { kind: 'summary', text: line }
  return { kind: 'plain', text: line }
}
