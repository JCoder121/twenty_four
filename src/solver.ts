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
