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
  (1,820 hands, 1,362 solvable)

Card values: A=1, J=11, Q=12, K=13. Future: ASCII-art frontend (out of scope for now).
