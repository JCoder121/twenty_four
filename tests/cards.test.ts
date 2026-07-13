import { describe, expect, it } from 'vitest'
import { RANKS, SUITS, formatCard, formatHand, valueOf, type Card } from '../src/cards'

describe('cards', () => {
  it('has 13 ranks and 4 suits', () => {
    expect(RANKS).toHaveLength(13)
    expect(SUITS).toHaveLength(4)
  })

  it('maps ranks to values A=1 .. K=13', () => {
    expect(valueOf({ rank: 'A', suit: '♠' })).toBe(1)
    expect(valueOf({ rank: '2', suit: '♥' })).toBe(2)
    expect(valueOf({ rank: '10', suit: '♦' })).toBe(10)
    expect(valueOf({ rank: 'J', suit: '♣' })).toBe(11)
    expect(valueOf({ rank: 'Q', suit: '♠' })).toBe(12)
    expect(valueOf({ rank: 'K', suit: '♠' })).toBe(13)
  })

  it('formats cards and hands', () => {
    expect(formatCard({ rank: 'A', suit: '♠' })).toBe('A♠')
    const hand: Card[] = [
      { rank: '9', suit: '♣' },
      { rank: '5', suit: '♥' },
      { rank: 'J', suit: '♠' },
      { rank: 'K', suit: '♦' },
    ]
    expect(formatHand(hand)).toBe('9♣ 5♥ J♠ K♦')
  })
})
