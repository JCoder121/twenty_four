import { describe, expect, it } from 'vitest'
import { solve } from '../src/solver'
import { loadTable, lookup, multisetKey } from '../src/table'

describe('table', () => {
  it('builds sorted multiset keys', () => {
    expect(multisetKey([13, 1, 5, 5])).toBe('1,5,5,13')
    expect(multisetKey([2, 10, 3, 1])).toBe('1,2,3,10')
  })

  it('returns null for a missing file instead of throwing', () => {
    expect(loadTable('data/does-not-exist.json')).toBeNull()
  })

  it('falls back to live solve when table is null', () => {
    expect(lookup([1, 1, 1, 1], null)).toBeNull()
    expect(lookup([3, 3, 8, 8], null)).toEqual(solve([3, 3, 8, 8]))
  })

  it('prefers the table when the key is present', () => {
    const fake = { '1,1,1,1': { expression: 'stub', count: 99 } }
    expect(lookup([1, 1, 1, 1], fake)).toEqual({ expression: 'stub', count: 99 })
  })

  it('generated table matches live solve on spot checks', () => {
    const table = loadTable('data/solutions.json')
    expect(table).not.toBeNull()
    expect(Object.keys(table!)).toHaveLength(1820)
    expect(table!['1,1,1,1']).toBeNull()
    expect(table!['3,3,8,8']).toEqual(solve([3, 3, 8, 8]))
    expect(table!['1,5,5,5']).toEqual(solve([1, 5, 5, 5]))
  })
})
