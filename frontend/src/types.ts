import type { Card } from '../../src/cards'

export interface ThemeSounds {
  /** short tick per accepted keystroke */
  key(): void
  /** played once when the solution/NO RESULT finishes rendering */
  reveal(): void
  /** optional continuous bed (CRT hum, rain hiss); called on toggle on/off */
  ambient?: { start(): void; stop(): void }
}

export interface Theme {
  id: 'uno' | 'esper' | 'construct'
  /** shown by the boot menu while "booting" this system */
  bootLine: string
  /** per-character delay for typewritten lines; 0 = lines appear instantly */
  charDelayMs: number
  /** mount persistent background (canvas rain, scanline overlay). May be a no-op. */
  ambientStart(layer: HTMLElement): void
  ambientStop(): void
  /** one dealt card -> element appended to the cards row */
  renderCard(card: Card): HTMLElement
  /**
   * Themed suspense beat between cards landing and the solution rendering.
   * Resolve early (and clean up) if signal aborts — any keypress skips.
   * Target ~1500ms unaborted.
   */
  revealBeat(playArea: HTMLElement, signal: AbortSignal): Promise<void>
  /** build sound hooks from a running AudioContext (only called when sound is on) */
  makeSounds(ctx: AudioContext): ThemeSounds
}
