import type { Card } from '../../../src/cards'
import { formatCard } from '../../../src/cards'
import type { Theme, ThemeSounds } from '../types'
import './uno.css'

export const theme: Theme = {
  id: 'uno',
  bootLine: 'LOADING UNO.SYS …',
  charDelayMs: 0,
  ambientStart() {},
  ambientStop() {},
  renderCard(card: Card): HTMLElement {
    const el = document.createElement('div')
    el.className = 'card'
    el.textContent = formatCard(card)
    return el
  },
  async revealBeat(_area: HTMLElement, signal: AbortSignal): Promise<void> {
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 1500)
      signal.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
    })
  },
  makeSounds(): ThemeSounds {
    return { key() {}, reveal() {} }
  },
}
