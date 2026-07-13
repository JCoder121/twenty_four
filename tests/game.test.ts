import { describe, expect, it } from 'vitest'
import { runGame, type IO } from '../src/game'
import type { Rng } from '../src/deck'

function lcg(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function makeIO(inputs: string[]) {
  const transcript: string[] = []
  const io: IO = {
    prompt: async (question) => {
      transcript.push(question)
      return inputs.shift() ?? 'n'
    },
    print: (line) => {
      transcript.push(line)
    },
  }
  return { io, transcript }
}

const text = (t: string[]) => t.join('\n')

describe('runGame', () => {
  it('exits immediately when not ready', async () => {
    const { io, transcript } = makeIO(['n'])
    await runGame({ io, rng: lcg(1) })
    expect(text(transcript)).not.toContain('How many decks?')
    expect(text(transcript)).not.toContain('Hand 1')
  })

  it('plays one hand and prints a solution or NO RESULT, then a summary', async () => {
    const { io, transcript } = makeIO(['y', '1', 'n'])
    await runGame({ io, rng: lcg(42) })
    const t = text(transcript)
    expect(t).toContain('--- Hand 1 (48 cards left) ---')
    expect(t).toContain('Cards: ')
    expect(t.includes('Solution: ') || t.includes('NO RESULT')).toBe(true)
    expect(t).toContain('Hands played: 1 |')
  })

  it('reprompts on invalid input', async () => {
    const { io, transcript } = makeIO(['maybe', 'y', '3', 'x', '2', 'n'])
    await runGame({ io, rng: lcg(3) })
    const t = text(transcript)
    expect(t).toContain('Please enter y or n.')
    expect(t).toContain('Please enter 1 or 2.')
    expect(t).toContain('--- Hand 1 (100 cards left) ---') // 2 decks chosen
  })

  it('plays through exhaustion and reshuffles on y', async () => {
    // 1 deck = 13 hands; continue past all of them, reshuffle once, play one more, quit
    const inputs = ['y', '1', ...Array(13).fill('y'), 'y', 'n']
    const { io, transcript } = makeIO(inputs)
    await runGame({ io, rng: lcg(9) })
    const t = text(transcript)
    expect(t).toContain('Deck exhausted. Reshuffle?')
    expect(t).toContain('--- Hand 14 (48 cards left) ---')
    expect(t).toContain('Hands played: 14 |')
  })

  it('summary splits solvable vs NO RESULT and they sum to hands played', async () => {
    const inputs = ['y', '1', ...Array(12).fill('y'), 'n']
    const { io, transcript } = makeIO(inputs)
    await runGame({ io, rng: lcg(11) })
    const summary = transcript.find((line) => line.startsWith('Hands played: 13'))
    expect(summary).toBeDefined()
    const m = summary!.match(/Hands played: (\d+) \| Solvable: (\d+) \| NO RESULT: (\d+)/)!
    expect(Number(m[2]) + Number(m[3])).toBe(Number(m[1]))
  })
})
