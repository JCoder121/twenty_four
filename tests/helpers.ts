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
