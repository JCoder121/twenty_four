import { RANKS, SUITS, type Card } from './cards'

export type Rng = () => number

export function buildDecks(count: 1 | 2): Card[] {
  const cards: Card[] = []
  for (let i = 0; i < count; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit })
      }
    }
  }
  return cards
}

export function shuffle(cards: Card[], rng: Rng = Math.random): Card[] {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export class Deck {
  private cards: Card[]

  constructor(deckCount: 1 | 2, rng: Rng = Math.random) {
    this.cards = shuffle(buildDecks(deckCount), rng)
  }

  draw(n: number): Card[] | null {
    if (this.cards.length < n) return null
    return this.cards.splice(0, n)
  }

  remaining(): number {
    return this.cards.length
  }
}
