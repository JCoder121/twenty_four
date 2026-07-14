import type { Card, Suit } from '../../../src/cards'
import type { Theme, ThemeSounds } from '../types'
import './uno.css'

const SUIT_CLASS: Record<Suit, string> = {
  '♠': 'spade',
  '♥': 'heart',
  '♦': 'diamond',
  '♣': 'club',
}

const PULSE_MS = 1500

export const theme: Theme = {
  id: 'uno',
  bootLine: 'LOADING UNO.SYS …',
  charDelayMs: 0,
  // Silent system: no persistent background layer.
  ambientStart() {},
  ambientStop() {},

  renderCard(card: Card): HTMLElement {
    const el = document.createElement('div')
    el.className = `card card--${SUIT_CLASS[card.suit]}`
    el.setAttribute('data-suit', card.suit)

    const rank = document.createElement('span')
    rank.className = 'rank'
    rank.textContent = card.rank

    const pip = document.createElement('span')
    pip.className = 'pip'
    pip.textContent = card.suit
    pip.setAttribute('aria-hidden', 'true')

    el.append(rank, pip)
    el.setAttribute('aria-label', `${card.rank} of ${card.suit}`)
    return el
  },

  async revealBeat(playArea: HTMLElement, signal: AbortSignal): Promise<void> {
    const cards = Array.from(playArea.querySelectorAll<HTMLElement>('.card'))
    cards.forEach((c) => c.classList.add('pulse'))
    await new Promise<void>((resolve) => {
      const cleanup = () => {
        cards.forEach((c) => c.classList.remove('pulse'))
        resolve()
      }
      const t = setTimeout(cleanup, PULSE_MS)
      signal.addEventListener('abort', () => { clearTimeout(t); cleanup() }, { once: true })
    })
  },

  makeSounds(ctx: AudioContext): ThemeSounds {
    const tone = (freq: number, durationMs: number, peakGain: number) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.006)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + durationMs / 1000 + 0.03)
    }
    return {
      key: () => tone(1200, 30, 0.04),
      reveal: () => tone(90, 120, 0.14),
    }
  },
}
