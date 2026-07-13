import { formatHand, valueOf } from './cards'
import { Deck, type Rng } from './deck'
import { lookup, type SolutionTable } from './table'

export interface IO {
  prompt(question: string): Promise<string>
  print(line: string): void
}

export interface GameDeps {
  io: IO
  rng?: Rng
  table?: SolutionTable | null
}

async function askYesNo(io: IO, question: string): Promise<boolean> {
  for (;;) {
    const answer = (await io.prompt(`${question} (y/n) `)).trim().toLowerCase()
    if (answer === 'y') return true
    if (answer === 'n') return false
    io.print('Please enter y or n.')
  }
}

async function askDeckCount(io: IO): Promise<1 | 2> {
  for (;;) {
    const answer = (await io.prompt('How many decks? (1/2) ')).trim()
    if (answer === '1') return 1
    if (answer === '2') return 2
    io.print('Please enter 1 or 2.')
  }
}

export async function runGame({ io, rng = Math.random, table = null }: GameDeps): Promise<void> {
  if (!(await askYesNo(io, 'Ready to start game?'))) return
  const deckCount = await askDeckCount(io)

  let deck = new Deck(deckCount, rng)
  let hands = 0
  let solvable = 0
  let noResult = 0

  for (;;) {
    if (deck.remaining() < 4) {
      if (await askYesNo(io, 'Deck exhausted. Reshuffle?')) {
        deck = new Deck(deckCount, rng)
      } else {
        break
      }
    }

    const cards = deck.draw(4)!
    hands++
    io.print('')
    io.print(`--- Hand ${hands} (${deck.remaining()} cards left) ---`)
    io.print(`Cards: ${formatHand(cards)}`)

    const result = lookup(cards.map(valueOf), table)
    if (result !== null) {
      solvable++
      io.print(`Solution: ${result.expression} = 24`)
      io.print(`${result.count} distinct solution${result.count === 1 ? '' : 's'}`)
    } else {
      noResult++
      io.print('NO RESULT')
    }

    if (!(await askYesNo(io, 'Continue?'))) break
  }

  if (hands > 0) {
    io.print('')
    io.print(`Hands played: ${hands} | Solvable: ${solvable} | NO RESULT: ${noResult}`)
  }
}
