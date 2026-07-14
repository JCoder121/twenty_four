# twenty_four

*A deterministic simulator for the 24 card game — deals real hands, then instantly shows the arithmetic that saves them, or proves nothing can.*

```
$ npm start
Ready to start game? (y/n) y
How many decks? (1/2) 1

--- Hand 1 (48 cards left) ---
Cards: 2♦ 8♠ 9♥ 10♠
Solution: 2 * (8 + 9) - 10 = 24
2 distinct solutions
Continue? (y/n) y

--- Hand 2 (44 cards left) ---
Cards: Q♠ J♣ 6♣ A♠
Solution: (1 + 11) / (6 / 12) = 24
1 distinct solution
Continue? (y/n) n

Hands played: 2 | Solvable: 2 | NO RESULT: 0
```

## Play online

**https://jcoder121.github.io/twenty_four/** — a boot menu offering three
complete themes: `UNO.SYS` (flat neon minimalism), `ESPER.OS` (Blade Runner
amber CRT), `CONSTRUCT` (digital rain). Typed prompts, just like the CLI.
Sound is synthesized and off by default.

## What is the 24 game?

Draw 4 cards and make exactly **24** using each card once with `+ - * /` and
parentheses. Card values: A=1, J=11, Q=12, K=13. No exponents, no roots. Some
hands (like four aces) are impossible — the simulator prints `NO RESULT` and
means it: the solver searches every expression with exact rational arithmetic,
so a `NO RESULT` is a proof, not a shrug.

## Run the simulation

```bash
npm install
npm start
```

Cards are dealt without replacement from 1 or 2 shuffled decks (your choice at
startup, 13 or 26 hands per shoe). When the shoe runs out you can reshuffle or
quit; quitting prints a session summary.

Other commands:

```bash
npm test              # 29 unit tests (solver, deck, game loop)
npm run precompute    # regenerate data/solutions.json from scratch
```

## Results

The precomputed table [`data/solutions.json`](data/solutions.json) covers every
possible hand — all 1,820 value combinations — with one solution and the count
of genuinely distinct solutions (commutative/associative rearrangements
collapsed). Headline numbers:

| Stat | Value |
|---|---|
| Possible hands (4-value combinations of 1–13) | 1,820 |
| Solvable | 1,362 (74.8%) |
| NO RESULT | 458 (25.2%) |
| Hands with exactly one solution ("forced" hands) | 396 |
| Median distinct solutions per solvable hand | 2 |
| Most solvable hand | `A A J K` — 22 distinct solutions |
| Chance a dealt hand is NO RESULT (1 deck, draw-weighted) | 19.5% |
| Chance a dealt hand is NO RESULT (2 decks) | 20.2% |

Two decks add **zero** new combinations — one deck already holds 4 copies of
every rank, enough for any hand. Two decks only shift the odds: four-of-a-kind
becomes ~4× more likely, and since duplicate-heavy hands skew unsolvable, the
shoe gets slightly harder.

## Surprising findings

Most players hunt the classic final products — 3×8, 4×6, 2×12. That strategy
provably fails on **~11% of solvable hands**. Among the 396 forced hands (one
solution, no alternatives), three tricks are outright required:

**Divide by a fraction to multiply up** (47 hands forced):

```
7 7 7 12  →  (7 + 7) / (7 / 12) = 24        14 ÷ 7/12
3 3 8 8   →  8 / (3 - 8 / 3) = 24           the famous one
1 5 5 5   →  5 * (5 - 1 / 5) = 24
2 2 13 13 →  13 * (2 - 2 / 13) = 24         passes through 24/13
```

**Overshoot far past 24, then divide back down** (42 hands forced):

```
1 7 13 13   →  (13 * 13 - 1) / 7 = 24       peaks at 169
6 12 12 13  →  (12 * 13 - 12) / 6 = 24      peaks at 156
1 6 11 13   →  (1 + 11 * 13) / 6 = 24       143 is useless until +1
4 4 10 10   →  (10 * 10 - 4) / 4 = 24       96 / 4
```

**Go negative** (62 hands forced):

```
1 2 5 5   →  1 - 2 + 5 * 5 = 24
1 2 6 13  →  2 * 6 - (1 - 13) = 24
```

And one anti-finding: the flashy negative×negative trick, e.g.
`(1 - 5) * (1 - 7) = 24`, is **never required** — every hand it solves also
has a positive-arithmetic solution.

## How it works

- **Solver** (`src/solver.ts`): recursive reducer — repeatedly combine any two
  values with any operator until one remains; a hit is recorded when it equals
  24 exactly. Arithmetic is exact rationals (`src/rational.ts`), never floats.
- **Distinct-solution counting**: each solution's expression tree is
  canonicalized (`+/-` chains flatten to sorted term multisets, `*//` chains to
  sorted factor multisets), so `a+b` vs `b+a` and `(a+b)+c` vs `a+(b+c)`
  count once.
- **Table** (`src/table.ts`): the game looks hands up in `data/solutions.json`
  and falls back to solving live if the file is missing.
- **Game loop** (`src/game.ts`): pure logic over an injected I/O interface;
  `src/index.ts` is the only file touching stdin/stdout. A future ASCII-art
  frontend can swap in without touching game logic.

## License

MIT
