import { describe, expect, it } from 'vitest'
import { classifyLine } from '../frontend/src/parse'

describe('classifyLine', () => {
  it('classifies hand headers', () => {
    expect(classifyLine('--- Hand 3 (40 cards left) ---')).toEqual({ kind: 'hand', hand: 3, cardsLeft: 40 })
  })

  it('parses card lines including 10 and all suits', () => {
    const r = classifyLine('Cards: 10♣ A♥ J♠ K♦')
    expect(r.kind).toBe('cards')
    if (r.kind === 'cards') {
      expect(r.cards).toEqual([
        { rank: '10', suit: '♣' },
        { rank: 'A', suit: '♥' },
        { rank: 'J', suit: '♠' },
        { rank: 'K', suit: '♦' },
      ])
    }
  })

  it('classifies solution, count, noresult, summary, blank, plain', () => {
    expect(classifyLine('Solution: (1 + 11) / (6 / 12) = 24').kind).toBe('solution')
    expect(classifyLine('3 distinct solutions').kind).toBe('count')
    expect(classifyLine('1 distinct solution').kind).toBe('count')
    expect(classifyLine('NO RESULT')).toEqual({ kind: 'noresult' })
    expect(classifyLine('Hands played: 2 | Solvable: 2 | NO RESULT: 0').kind).toBe('summary')
    expect(classifyLine('')).toEqual({ kind: 'blank' })
    expect(classifyLine('Please enter y or n.').kind).toBe('plain')
  })
})
