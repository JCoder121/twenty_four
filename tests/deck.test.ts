import { describe, expect, it } from 'vitest'
import { formatCard } from '../src/cards'
import { Deck, buildDecks, shuffle, type Rng } from '../src/deck'

function lcg(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function countByCard(cards: { rank: string; suit: string }[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const c of cards) {
    const key = `${c.rank}${c.suit}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

describe('deck', () => {
  it('builds 52 unique cards for one deck', () => {
    const cards = buildDecks(1)
    expect(cards).toHaveLength(52)
    expect(new Set(cards.map(formatCard)).size).toBe(52)
  })

  it('builds 104 cards (each exactly twice) for two decks', () => {
    const cards = buildDecks(2)
    expect(cards).toHaveLength(104)
    const counts = countByCard(cards)
    expect(counts.size).toBe(52)
    expect([...counts.values()].every((n) => n === 2)).toBe(true)
  })

  it('shuffle preserves the multiset and is deterministic under a seeded rng', () => {
    const cards = buildDecks(1)
    const a = shuffle(cards, lcg(42))
    const b = shuffle(cards, lcg(42))
    expect(a.map(formatCard)).toEqual(b.map(formatCard))
    expect(countByCard(a)).toEqual(countByCard(cards))
    expect(cards).toHaveLength(52) // input not mutated
  })

  it('draws without replacement and reports remaining', () => {
    const deck = new Deck(1, lcg(7))
    expect(deck.remaining()).toBe(52)
    const seen = new Set<string>()
    for (let i = 0; i < 13; i++) {
      const hand = deck.draw(4)
      expect(hand).not.toBeNull()
      for (const card of hand!) {
        const key = formatCard(card)
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
    }
    expect(deck.remaining()).toBe(0)
    expect(deck.draw(4)).toBeNull()
  })
})
