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
