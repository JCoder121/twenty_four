import { mkdirSync, writeFileSync } from 'node:fs'
import { solve, type Solution } from '../src/solver'
import { multisetKey } from '../src/table'

const table: Record<string, Solution | null> = {}
for (let a = 1; a <= 13; a++) {
  for (let b = a; b <= 13; b++) {
    for (let c = b; c <= 13; c++) {
      for (let d = c; d <= 13; d++) {
        table[multisetKey([a, b, c, d])] = solve([a, b, c, d])
      }
    }
  }
}

const entries = Object.keys(table).length
const solvable = Object.values(table).filter((v) => v !== null).length
mkdirSync('data', { recursive: true })
writeFileSync('data/solutions.json', JSON.stringify(table, null, 2) + '\n')
console.log(`Wrote ${entries} entries (${solvable} solvable) to data/solutions.json`)
