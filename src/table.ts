import { readFileSync } from 'node:fs'
import { solve, type Solution } from './solver'

export type SolutionTable = Record<string, Solution | null>

export function multisetKey(values: number[]): string {
  return [...values].sort((a, b) => a - b).join(',')
}

export function loadTable(path: string): SolutionTable | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as SolutionTable
  } catch {
    return null
  }
}

export function lookup(values: number[], table: SolutionTable | null): Solution | null {
  const key = multisetKey(values)
  if (table !== null && key in table) return table[key]
  return solve(values)
}
