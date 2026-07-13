# Twenty-Four Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Terminal 24-game simulation: draw 4 cards from 1–2 decks, print an expression making 24 (plus distinct-solution count) or NO RESULT.

**Architecture:** Pure core modules (rational → solver; cards → deck; table on solver) with an interactive `game.ts` loop over injected I/O; `index.ts` is the only file touching stdin/stdout. A precomputed `data/solutions.json` (all 1,820 value multisets) is loaded at startup with live-solve fallback.

**Tech Stack:** TypeScript, Node ≥ 20, ESM (`"type": "module"`), zero runtime deps. Dev deps: `tsx`, `typescript`, `vitest`.

**Spec:** `docs/superpowers/specs/2026-07-13-twenty-four-design.md`

## Global Constraints

- Card values: A=1, 2–10 face, J=11, Q=12, K=13; suits `♠ ♥ ♦ ♣`; no jokers.
- Ops: `+ - * /` with parentheses only. No exponents/roots. Exact rational arithmetic — never compare floats to 24.
- Solvable output: one expression + `N distinct solution(s)`; unsolvable: exactly `NO RESULT`.
- Distinctness: canonical forms with `+/-` chains flattened to sorted term multisets and `*//` chains to sorted factor multisets; suits and equal-value swaps don't create new solutions.
- Core modules must not touch console/process/randomness (RNG injectable, default `Math.random`).
- All tests non-interactive (`npx vitest run`).

## Execution mapping (parallel Sonnet subagents)

- **Setup (main session):** Task 1.
- **Wave 1 (parallel):** Agent A → Tasks 2–3 (rational, solver + helpers). Agent B → Tasks 4–5 (cards, deck).
- **Wave 2 (parallel, after Wave 1):** Agent C → Task 6 (table + precompute + data). Agent D → Task 7 (game + index).
- **Finish (main session):** Task 8 (full verify, README, manual smoke run).
- Agents write code + tests and run their own tests; **main session verifies and commits at wave boundaries** (user's preferred workflow). Commit steps below are annotated accordingly.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`

**Interfaces:**
- Produces: npm scripts `start`, `test`, `precompute`; TS/ESM config all later tasks compile under.

- [ ] **Step 1: Write config files**

`package.json`:
```json
{
  "name": "twenty_four",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "test": "vitest run",
    "precompute": "tsx scripts/precompute.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src", "scripts", "tests"]
}
```

`.gitignore`:
```
node_modules/
```

- [ ] **Step 2: Install and verify**

Run: `npm install && npx vitest run`
Expected: install succeeds; vitest reports "no test files found" (exit code 1 is fine at this stage).

Note: `@types/node` comes in transitively via vitest; if `tsc` later complains about `node:` imports, `npm i -D @types/node`.

- [ ] **Step 3: Commit (main session)**

```bash
git add package.json tsconfig.json .gitignore package-lock.json
git commit -m "chore: scaffold TS/ESM project with tsx + vitest"
```

---

### Task 2: rational.ts — exact fractions

**Files:**
- Create: `src/rational.ts`
- Test: `tests/rational.test.ts`

**Interfaces:**
- Produces:
  - `interface Rational { n: number; d: number }` (normalized: gcd-reduced, `d > 0`)
  - `rational(n: number, d?: number): Rational` (throws on `d === 0`)
  - `fromInt(n: number): Rational`
  - `add(a, b)`, `sub(a, b)`, `mul(a, b)`: `(Rational, Rational) => Rational`
  - `div(a: Rational, b: Rational): Rational | null` (null when `b.n === 0`)
  - `equals(a: Rational, b: Rational): boolean`
  - `toString(r: Rational): string` → `"24"` or `"8/3"`

- [ ] **Step 1: Write the failing test**

`tests/rational.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rational.test.ts`
Expected: FAIL — cannot resolve `../src/rational`.

- [ ] **Step 3: Write minimal implementation**

`src/rational.ts`:
```ts
export interface Rational {
  n: number
  d: number
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export function rational(n: number, d = 1): Rational {
  if (d === 0) throw new Error('zero denominator')
  const sign = d < 0 ? -1 : 1
  const g = gcd(Math.abs(n), Math.abs(d)) || 1
  return { n: (sign * n) / g, d: (sign * d) / g }
}

export function fromInt(n: number): Rational {
  return rational(n)
}

export function add(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d + b.n * a.d, a.d * b.d)
}

export function sub(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d - b.n * a.d, a.d * b.d)
}

export function mul(a: Rational, b: Rational): Rational {
  return rational(a.n * b.n, a.d * b.d)
}

export function div(a: Rational, b: Rational): Rational | null {
  if (b.n === 0) return null
  return rational(a.n * b.d, a.d * b.n)
}

export function equals(a: Rational, b: Rational): boolean {
  return a.n === b.n && a.d === b.d
}

export function toString(r: Rational): string {
  return r.d === 1 ? `${r.n}` : `${r.n}/${r.d}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/rational.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit (main session, end of Wave 1)**

```bash
git add src/rational.ts tests/rational.test.ts
git commit -m "feat: exact rational arithmetic"
```

---

### Task 3: solver.ts — recursive reducer with canonical counting

**Files:**
- Create: `src/solver.ts`
- Test: `tests/solver.test.ts`, `tests/helpers.ts`

**Interfaces:**
- Consumes: everything from `src/rational.ts` (Task 2 signatures).
- Produces:
  - `interface Solution { expression: string; count: number }`
  - `solve(values: number[]): Solution | null` — values are 1–13; null means NO RESULT.
  - `expression` renders with spaces around operators and minimal parens, e.g. `8 / (3 - 8 / 3)`.
  - Test helper `evalExpr(s: string): Rational` in `tests/helpers.ts` (used again by Task 6 tests).

- [ ] **Step 1: Write the expression evaluator test helper**

`tests/helpers.ts` — recursive-descent parser over rationals (never float-eval expressions):
```ts
import { add, div, mul, rational, sub, type Rational } from '../src/rational'

export function evalExpr(s: string): Rational {
  let pos = 0

  function skip() {
    while (s[pos] === ' ') pos++
  }

  function parseFactor(): Rational {
    skip()
    if (s[pos] === '(') {
      pos++ // consume '('
      const v = parseSum()
      skip()
      if (s[pos] !== ')') throw new Error(`expected ) at ${pos} in "${s}"`)
      pos++ // consume ')'
      return v
    }
    const start = pos
    while (/[0-9]/.test(s[pos])) pos++
    if (start === pos) throw new Error(`expected number at ${pos} in "${s}"`)
    return rational(Number(s.slice(start, pos)))
  }

  function parseProduct(): Rational {
    let v = parseFactor()
    skip()
    while (s[pos] === '*' || s[pos] === '/') {
      const op = s[pos++]
      const r = parseFactor()
      const next = op === '*' ? mul(v, r) : div(v, r)
      if (next === null) throw new Error(`division by zero in "${s}"`)
      v = next
      skip()
    }
    return v
  }

  function parseSum(): Rational {
    let v = parseProduct()
    skip()
    while (s[pos] === '+' || s[pos] === '-') {
      const op = s[pos++]
      const r = parseProduct()
      v = op === '+' ? add(v, r) : sub(v, r)
      skip()
    }
    return v
  }

  const result = parseSum()
  skip()
  if (pos !== s.length) throw new Error(`trailing input at ${pos} in "${s}"`)
  return result
}
```

- [ ] **Step 2: Write the failing solver test**

`tests/solver.test.ts`:
```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/solver.test.ts`
Expected: FAIL — cannot resolve `../src/solver`.

- [ ] **Step 4: Write the implementation**

`src/solver.ts`:
```ts
import { add, div, equals, fromInt, mul, sub, type Rational } from './rational'

export interface Solution {
  expression: string
  count: number
}

type Expr =
  | { type: 'num'; value: number }
  | { type: 'op'; op: '+' | '-' | '*' | '/'; left: Expr; right: Expr }

interface Item {
  value: Rational
  expr: Expr
}

const TARGET = fromInt(24)

function op(o: '+' | '-' | '*' | '/', left: Expr, right: Expr): Expr {
  return { type: 'op', op: o, left, right }
}

// --- canonicalization: flatten +/- chains and */÷ chains into sorted multisets ---

function collectSum(e: Expr, pos: string[], neg: string[], negate: boolean): void {
  if (e.type === 'op' && (e.op === '+' || e.op === '-')) {
    collectSum(e.left, pos, neg, negate)
    collectSum(e.right, pos, neg, e.op === '-' ? !negate : negate)
  } else {
    ;(negate ? neg : pos).push(canonical(e))
  }
}

function collectProduct(e: Expr, num: string[], den: string[], invert: boolean): void {
  if (e.type === 'op' && (e.op === '*' || e.op === '/')) {
    collectProduct(e.left, num, den, invert)
    collectProduct(e.right, num, den, e.op === '/' ? !invert : invert)
  } else {
    ;(invert ? den : num).push(canonical(e))
  }
}

function canonical(e: Expr): string {
  if (e.type === 'num') return String(e.value)
  if (e.op === '+' || e.op === '-') {
    const pos: string[] = []
    const neg: string[] = []
    collectSum(e, pos, neg, false)
    return `S(${pos.sort().join(',')}|${neg.sort().join(',')})`
  }
  const num: string[] = []
  const den: string[] = []
  collectProduct(e, num, den, false)
  return `P(${num.sort().join(',')}|${den.sort().join(',')})`
}

// --- rendering with minimal parentheses ---

function prec(e: Expr): number {
  if (e.type === 'num') return 3
  return e.op === '+' || e.op === '-' ? 1 : 2
}

function render(e: Expr): string {
  if (e.type === 'num') return String(e.value)
  const p = prec(e)
  const lp = prec(e.left)
  const rp = prec(e.right)
  const left = lp < p ? `(${render(e.left)})` : render(e.left)
  const needRightParens = rp < p || (rp === p && (e.op === '-' || e.op === '/'))
  const right = needRightParens ? `(${render(e.right)})` : render(e.right)
  return `${left} ${e.op} ${right}`
}

// --- search: reduce list by combining pairs until one value remains ---

function combine(a: Item, b: Item): Item[] {
  const out: Item[] = [
    { value: add(a.value, b.value), expr: op('+', a.expr, b.expr) },
    { value: mul(a.value, b.value), expr: op('*', a.expr, b.expr) },
    { value: sub(a.value, b.value), expr: op('-', a.expr, b.expr) },
    { value: sub(b.value, a.value), expr: op('-', b.expr, a.expr) },
  ]
  const dAB = div(a.value, b.value)
  if (dAB !== null) out.push({ value: dAB, expr: op('/', a.expr, b.expr) })
  const dBA = div(b.value, a.value)
  if (dBA !== null) out.push({ value: dBA, expr: op('/', b.expr, a.expr) })
  return out
}

function search(items: Item[], found: Map<string, Expr>): void {
  if (items.length === 1) {
    if (equals(items[0].value, TARGET)) {
      const item = items[0]
      const key = canonical(item.expr)
      if (!found.has(key)) found.set(key, item.expr)
    }
    return
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const rest = items.filter((_, k) => k !== i && k !== j)
      for (const candidate of combine(items[i], items[j])) {
        search([...rest, candidate], found)
      }
    }
  }
}

export function solve(values: number[]): Solution | null {
  const items: Item[] = values.map((v) => ({
    value: fromInt(v),
    expr: { type: 'num', value: v },
  }))
  const found = new Map<string, Expr>()
  search(items, found)
  if (found.size === 0) return null
  const rendered = [...found.values()].map(render)
  rendered.sort((a, b) => a.length - b.length || a.localeCompare(b))
  return { expression: rendered[0], count: found.size }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/solver.test.ts tests/rational.test.ts`
Expected: PASS. If `13,13,13,13` or `1,1,1,8` assertions fail, do NOT change the assertion to match output — the canonicalization or search has a bug; debug it (superpowers:systematic-debugging).

- [ ] **Step 6: Commit (main session, end of Wave 1)**

```bash
git add src/solver.ts tests/solver.test.ts tests/helpers.ts
git commit -m "feat: 24 solver with canonical distinct-solution counting"
```

---

### Task 4: cards.ts — ranks, values, formatting

**Files:**
- Create: `src/cards.ts`
- Test: `tests/cards.test.ts`

**Interfaces:**
- Produces:
  - `const RANKS: readonly ['A','2','3','4','5','6','7','8','9','10','J','Q','K']`
  - `const SUITS: readonly ['♠','♥','♦','♣']`
  - `type Rank`, `type Suit`, `interface Card { rank: Rank; suit: Suit }`
  - `valueOf(card: Card): number` → 1–13
  - `formatCard(card: Card): string` → `"A♠"`
  - `formatHand(cards: Card[]): string` → `"9♣ 5♥ J♠ K♦"`

- [ ] **Step 1: Write the failing test**

`tests/cards.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cards.test.ts`
Expected: FAIL — cannot resolve `../src/cards`.

- [ ] **Step 3: Write minimal implementation**

`src/cards.ts`:
```ts
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export const SUITS = ['♠', '♥', '♦', '♣'] as const

export type Rank = (typeof RANKS)[number]
export type Suit = (typeof SUITS)[number]

export interface Card {
  rank: Rank
  suit: Suit
}

export function valueOf(card: Card): number {
  return RANKS.indexOf(card.rank) + 1
}

export function formatCard(card: Card): string {
  return `${card.rank}${card.suit}`
}

export function formatHand(cards: Card[]): string {
  return cards.map(formatCard).join(' ')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cards.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit (main session, end of Wave 1)**

```bash
git add src/cards.ts tests/cards.test.ts
git commit -m "feat: card types, values, formatting"
```

---

### Task 5: deck.ts — build, shuffle, draw without replacement

**Files:**
- Create: `src/deck.ts`
- Test: `tests/deck.test.ts`

**Interfaces:**
- Consumes: `Card`, `RANKS`, `SUITS` from `src/cards.ts`.
- Produces:
  - `type Rng = () => number`
  - `buildDecks(count: 1 | 2): Card[]` — 52 or 104 cards
  - `shuffle(cards: Card[], rng?: Rng): Card[]` — Fisher–Yates, returns new array
  - `class Deck { constructor(deckCount: 1 | 2, rng?: Rng); draw(n: number): Card[] | null; remaining(): number }` — `draw` returns null when fewer than `n` remain (deck unchanged in that case)

- [ ] **Step 1: Write the failing test**

`tests/deck.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/deck.test.ts`
Expected: FAIL — cannot resolve `../src/deck`.

- [ ] **Step 3: Write minimal implementation**

`src/deck.ts`:
```ts
import { RANKS, SUITS, type Card } from './cards'

export type Rng = () => number

export function buildDecks(count: 1 | 2): Card[] {
  const cards: Card[] = []
  for (let i = 0; i < count; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit })
      }
    }
  }
  return cards
}

export function shuffle(cards: Card[], rng: Rng = Math.random): Card[] {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export class Deck {
  private cards: Card[]

  constructor(deckCount: 1 | 2, rng: Rng = Math.random) {
    this.cards = shuffle(buildDecks(deckCount), rng)
  }

  draw(n: number): Card[] | null {
    if (this.cards.length < n) return null
    return this.cards.splice(0, n)
  }

  remaining(): number {
    return this.cards.length
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/deck.test.ts tests/cards.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (main session, end of Wave 1)**

```bash
git add src/deck.ts tests/deck.test.ts
git commit -m "feat: deck build/shuffle/draw without replacement"
```

---

### Task 6: table.ts + precompute script + data/solutions.json

**Files:**
- Create: `src/table.ts`, `scripts/precompute.ts`, `data/solutions.json` (generated)
- Test: `tests/table.test.ts`

**Interfaces:**
- Consumes: `solve`, `Solution` from `src/solver.ts` (Task 3).
- Produces:
  - `type SolutionTable = Record<string, Solution | null>`
  - `multisetKey(values: number[]): string` — sorted ascending, comma-joined: `"1,5,5,13"`
  - `loadTable(path: string): SolutionTable | null` — null on missing/unparsable file (never throws)
  - `lookup(values: number[], table: SolutionTable | null): Solution | null` — table hit or live `solve` fallback
  - `data/solutions.json`: pretty-printed JSON object, 1,820 keys, each `{"expression": string, "count": number}` or `null`

- [ ] **Step 1: Write the failing test**

`tests/table.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/table.test.ts`
Expected: FAIL — cannot resolve `../src/table`.

- [ ] **Step 3: Write table implementation**

`src/table.ts`:
```ts
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
```

- [ ] **Step 4: Write precompute script and generate the data**

`scripts/precompute.ts`:
```ts
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
```

Run: `npm run precompute`
Expected: `Wrote 1820 entries (1362 solvable) to data/solutions.json` — the 1362 is the well-known count of solvable 24-game multisets; if it differs by a little, report the number rather than forcing it, but investigate if it's far off (< 1300 or > 1400).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/table.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit (main session, end of Wave 2)**

```bash
git add src/table.ts scripts/precompute.ts data/solutions.json tests/table.test.ts
git commit -m "feat: precomputed solutions table with live-solve fallback"
```

---

### Task 7: game.ts + index.ts — interactive loop

**Files:**
- Create: `src/game.ts`, `src/index.ts`
- Test: `tests/game.test.ts`

**Interfaces:**
- Consumes: `Deck`, `Rng` (Task 5); `formatHand`, `valueOf` (Task 4); `lookup`, `loadTable`, `SolutionTable` (Task 6).
- Produces:
  - `interface IO { prompt(question: string): Promise<string>; print(line: string): void }`
  - `runGame(deps: { io: IO; rng?: Rng; table?: SolutionTable | null }): Promise<void>`
  - `src/index.ts` — the ONLY file using `process`/`readline`; wires stdin/stdout + loads `data/solutions.json`.

- [ ] **Step 1: Write the failing test**

`tests/game.test.ts`:
```ts
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
    const [, solvable, noResult] = summary!.match(/Solvable: (\d+) \| NO RESULT: (\d+)/)!.map(Number).slice(0) as unknown as [
      unknown,
      number,
      number,
    ]
    expect(Number(solvable) + Number(noResult)).toBe(13)
  })
})
```

Note on the last test: extracting two numbers from the summary line — if the regex gymnastics fight you, simplify to:
```ts
const m = summary!.match(/Hands played: (\d+) \| Solvable: (\d+) \| NO RESULT: (\d+)/)!
expect(Number(m[2]) + Number(m[3])).toBe(Number(m[1]))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game.test.ts`
Expected: FAIL — cannot resolve `../src/game`.

- [ ] **Step 3: Write game implementation**

`src/game.ts`:
```ts
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
```

`src/index.ts`:
```ts
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { runGame } from './game'
import { loadTable } from './table'
import type { IO } from './game'

const rl = createInterface({ input: process.stdin, output: process.stdout })
const io: IO = {
  prompt: (question) => rl.question(question),
  print: (line) => console.log(line),
}

const tablePath = fileURLToPath(new URL('../data/solutions.json', import.meta.url))
const table = loadTable(tablePath)
if (table === null) {
  console.warn('Note: data/solutions.json not found or unreadable — solving hands live.')
}

try {
  await runGame({ io, table })
} finally {
  rl.close()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game.test.ts`
Expected: PASS (5 tests). The exhaustion test depends only on hand counting, not shuffle order, so it is seed-stable.

- [ ] **Step 5: Commit (main session, end of Wave 2)**

```bash
git add src/game.ts src/index.ts tests/game.test.ts
git commit -m "feat: interactive game loop with injected I/O"
```

---

### Task 8: Final verification + README (main session)

**Files:**
- Create: `README.md`

- [ ] **Step 1: Full test suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass, no type errors.

- [ ] **Step 2: Manual smoke run (scripted stdin)**

Run: `printf 'y\n1\ny\nn\n' | npm start`
Expected: two hands print with cards + solution/NO RESULT, then summary `Hands played: 2 | ...`. Also verify `printf 'n\n' | npm start` exits silently.

- [ ] **Step 3: Write README**

`README.md`:
```markdown
# twenty_four

Terminal 24-game simulation. Draw 4 cards (no replacement) from 1–2 standard
decks; the program prints an arithmetic expression making 24 — using + - * /
and parentheses, exact rational arithmetic — or NO RESULT.

## Run

    npm install
    npm start

## Test

    npm test

## Regenerate the reference table

    npm run precompute   # rewrites data/solutions.json (all 1,820 hands)

## Layout

- `src/rational.ts` — exact fractions
- `src/solver.ts` — recursive-reducer solver + distinct-solution counting
- `src/cards.ts`, `src/deck.ts` — cards, shuffle, draw
- `src/table.ts` — precomputed-table lookup with live-solve fallback
- `src/game.ts` — interactive loop (injected I/O); `src/index.ts` — CLI entry
- `data/solutions.json` — reference: every 4-value multiset → solution/count or null

Card values: A=1, J=11, Q=12, K=13. Future: ASCII-art frontend (out of scope for now).
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README"
```
