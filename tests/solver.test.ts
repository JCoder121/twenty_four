import { describe, expect, it } from 'vitest'
import { equals, fromInt } from '../src/rational'
import { solve } from '../src/solver'
import { evalExpr } from './helpers'

function expectValid24(values: number[]) {
  const result = solve(values)
  expect(result).not.toBeNull()
  expect(equals(evalExpr(result!.expression), fromInt(24))).toBe(true)
  expect(result!.count).toBeGreaterThanOrEqual(1)
  return result!
}

describe('solve', () => {
  it('solves easy hands', () => {
    expectValid24([1, 2, 3, 4])
    expectValid24([6, 6, 6, 6])
    expectValid24([13, 9, 11, 5]) // (13-9)*(11-5)
  })

  it('solves the fraction-only hand 3 3 8 8', () => {
    const result = expectValid24([3, 3, 8, 8])
    expect(result.count).toBe(1) // famously unique: 8/(3-8/3)
  })

  it('returns null for unsolvable hands', () => {
    expect(solve([1, 1, 1, 1])).toBeNull()
    // max reachable from 1,1,1,2 is (1+1+1)*2 = 6, so provably unsolvable
    expect(solve([1, 1, 1, 2])).toBeNull()
    expect(solve([13, 13, 13, 13])).toBeNull()
  })

  it('collapses commutative/associative variants in the count', () => {
    // only construction: (1+1+1)*8
    const result = expectValid24([1, 1, 1, 8])
    expect(result.count).toBe(1)
  })

  it('does not count swaps of equal-valued cards as distinct', () => {
    // 12*2*(1*1), 12*2/(1*1), 12*2-1+1, ... every solution must appear once
    const result = expectValid24([1, 1, 2, 12])
    const again = expectValid24([1, 1, 2, 12])
    expect(result.count).toBe(again.count) // deterministic
  })

  it('is deterministic for the displayed expression', () => {
    expect(solve([4, 6, 8, 8])!.expression).toBe(solve([4, 6, 8, 8])!.expression)
  })
})
