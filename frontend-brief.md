# twenty_four frontend — design + build brief

2026-07-14. Web "terminal" frontend for the 24-game simulation. Three complete
themes selectable from a boot-menu homepage. Pure visual skin: game flow is
unchanged from the CLI (ready → decks → deal → solution/NO RESULT → continue →
reshuffle → summary).

## Throughline

**One machine, three operating systems.** Every theme runs the identical
"terminal": same layout skeleton (status line / play area / prompt line), same
typed-prompt interaction, same suspense-beat pacing. A theme is a *total*
commitment to one reference — palette, type, motion, card treatment, sound all
swap together. Nothing is blended; Cyberpunk 2077 is dropped entirely.

## Shared structure (all themes)

- **Layout:** full-viewport dark screen. Top status line (hand #, cards left,
  session tally). Center play area (cards + solution). Bottom prompt line with
  blinking block cursor.
- **Input:** authentic typed prompts — user types `y`/`n`/`1`/`2` + Enter at a
  real prompt line (hidden input element so mobile keyboards summon; desktop
  keys work anywhere on the page). Invalid input reprompts, same as CLI.
- **Reveal pacing:** cards land → themed "computing" beat (~1.5s, any key
  skips) → solution types out → distinct-count line. NO RESULT gets its own
  themed treatment, never an error state.
- **Sound:** Web Audio synthesized, no assets. **Off by default**; corner
  toggle `[sound: off]`.
- **Mobile:** desktop-first; layout scales down, tap focuses the hidden input.
  No portrait redesign.
- **Engine reuse:** `runGame()` from `src/game.ts` drives everything through a
  DOM implementation of its `IO` interface. `data/solutions.json` is fetched.
  Game logic files are not modified.

## Homepage — BOOT MENU

BIOS/boot-loader fiction. Black screen, brief POST-style text
(`TWENTY_FOUR BIOS v1.0 … 1820 HANDS INDEXED … 1362 SOLVABLE`), then:

```
  SELECT OPERATING SYSTEM

  > UNO.SYS
    ESPER.OS
    CONSTRUCT
```

Arrow keys / typed number / click to choose; Enter boots (short themed boot
line, then the game). Menu itself is neutral: white-on-black system mono, no
theme colors leaked. Each entry shows a one-line descriptor on focus.

## Theme 1 — UNO.SYS (Uno Minimalista)

- **Palette:** bg `#0a0a0f`; text `#e8e8f0`; one neon per suit —
  ♠ `#22d3ee` cyan, ♥ `#ff2d78` magenta-red, ♦ `#ffb020` amber, ♣ `#34ff88`
  green. Color appears ONLY on cards and the solution line.
- **Type:** JetBrains Mono (self-hosted woff2), generous letter-spacing.
- **Cards:** the Minimalista move — a solid flat color block (filled with
  `█` rows or CSS block), suit's neon as the field, ONE small centered glyph
  in bg-color, tiny rank index in top-left corner. Radical negative space
  around the four cards.
- **Motion:** near-silence. Cards appear instantly; reveal beat is a single
  soft glow pulse; solution fades in. No background animation at all.
- **NO RESULT:** the four cards desaturate to gray blocks; small centered
  `NO RESULT`.
- **Sound:** single soft sine tick on keypress, low thump on reveal.

## Theme 2 — ESPER.OS (Blade Runner)

- **Palette:** bg `#0d0904` (black-amber glass); primary phosphor amber
  `#ffb000`; dim amber `#7a5200`; cyan `#7fd4e4` reserved for the solution
  and data readouts; scanline overlay + subtle CRT flicker + slight barrel
  vignette.
- **Type:** VT323 (self-hosted), larger size, chunky.
- **Cards:** wireframe "data plates" — box-drawn outlines with rank/suit and
  a fake specimen readout line (`ID 9♣ // VAL 09`), like ESPER photo analysis.
- **Motion:** everything types out with irregular typewriter cadence and
  occasional pause-hum; reveal beat is a horizontal scan line sweeping the
  cards ("ENHANCE"-style) before the solution prints in cyan.
- **NO RESULT:** scan completes, prints `NO RESULT — SUBJECT UNSOLVABLE` in
  dim amber, brief static flicker.
- **Sound:** low CRT hum bed, clacky key ticks, sweep tone during scan.

## Theme 3 — CONSTRUCT (The Matrix)

- **Palette:** bg pure `#000`; greens only — bright `#00ff41`, mid `#00b32d`,
  dim `#054d19`. Brightness is the entire hierarchy; zero other hues.
- **Type:** mono for UI; rain glyphs are half-width katakana + digits drawn on
  a full-screen canvas behind the UI (columns fall at varying speeds, head
  glyph brightest — classic digital rain, dimmed to stay readable).
- **Cards:** rectangles of churning rain glyphs that decelerate and resolve
  into rank + suit; while idle, card interiors keep a faint glyph shimmer.
- **Motion:** rain runs permanently (paused when tab hidden); reveal beat is a
  rain flurry across the play area; solution characters "settle" out of
  random glyphs into the final expression.
- **NO RESULT:** the four cards dissolve back into the rain; `NO RESULT`
  remains in mid-green.
- **Sound:** soft rain hiss bed, watery tick per keystroke.

## Functional plan

- `frontend/` Vite project (vanilla TS, no framework) inside the repo.
  - `frontend/index.html` — boot menu.
  - `frontend/play.html?theme=uno|esper|construct` (or hash routing) — game.
  - `frontend/src/dom-io.ts` — IO impl: prompt line, typed input, print queue.
  - `frontend/src/shell.ts` — shared layout, status line, reveal-beat
    orchestration, sound toggle.
  - `frontend/src/themes/{uno,esper,construct}.ts` + per-theme CSS — each
    implements one `Theme` interface: `renderCard`, `ambient`
    (start/stop background), `revealBeat`, `sounds`.
  - Imports engine directly from `../src/*` (pure TS, browser-safe);
    `solutions.json` fetched at boot with live-solve fallback.
- **Fonts:** JetBrains Mono + VT323 woff2 self-hosted in `frontend/public/fonts`.
- **Deploy:** GitHub Actions workflow builds Vite (`base: '/twenty_four/'`)
  and deploys to GitHub Pages → `https://jcoder121.github.io/twenty_four/`.
- **Scripts:** `npm run web` (dev server), `npm run web:build`.
- **Testing:** engine tests already cover logic; frontend gets a Playwright
  smoke pass per theme (boot → play one hand → solution or NO RESULT shown)
  run locally, not in CI, plus manual review.

## Locked decisions (from interview)

Web-terminal medium · three full themes, selectable, no blending · 2077
dropped · pure visual skin, no gameplay changes · full ambient animation ·
authentic typed prompts · theme-native card art · GitHub Pages · boot-menu
homepage · per-theme self-hosted web fonts · project self-contained (no
jeff_design manifesto) · desktop-first · names UNO.SYS / ESPER.OS / CONSTRUCT
· skippable suspense reveal · synthesized sound off by default.
