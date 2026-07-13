import { describe, expect, it } from 'vitest'
import { add, div, equals, fromInt, mul, rational, sub, toString } from '../src/rational'

describe('rational', () => {
  it('normalizes sign and gcd', () => {
    expect(rational(4, -8)).toEqual({ n: -1, d: 2 })
    expect(rational(-3, -9)).toEqual({ n: 1, d: 3 })
    expect(rational(0, 5)).toEqual({ n: 0, d: 1 })
  })

  it('throws on zero denominator', () => {
    expect(() => rational(1, 0)).toThrow()
  })

  it('adds, subtracts, multiplies', () => {
    expect(add(rational(1, 3), rational(1, 6))).toEqual({ n: 1, d: 2 })
    expect(sub(fromInt(3), rational(8, 3))).toEqual({ n: 1, d: 3 })
    expect(mul(rational(2, 3), rational(3, 4))).toEqual({ n: 1, d: 2 })
  })

  it('divides, returning null for division by zero', () => {
    expect(div(fromInt(8), rational(1, 3))).toEqual({ n: 24, d: 1 })
    expect(div(fromInt(8), fromInt(0))).toBeNull()
  })

  it('solves the classic 3 3 8 8 chain exactly', () => {
    const inner = div(fromInt(8), fromInt(3))!            // 8/3
    const diff = sub(fromInt(3), inner)                   // 1/3
    const result = div(fromInt(8), diff)!                 // 24
    expect(equals(result, fromInt(24))).toBe(true)
  })

  it('formats', () => {
    expect(toString(fromInt(24))).toBe('24')
    expect(toString(rational(8, 3))).toBe('8/3')
  })
})
