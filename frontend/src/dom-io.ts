import type { IO } from '../../src/game'
import type { Theme } from './types'
import { classifyLine } from './parse'

export interface ShellEls {
  status: HTMLElement
  cards: HTMLElement
  solution: HTMLElement
  play: HTMLElement
  promptQ: HTMLElement
  promptTyped: HTMLElement
  hiddenInput: HTMLInputElement
}

export interface ShellHooks {
  /** current sounds or null when muted */
  sounds(): { key(): void; reveal(): void } | null
  /** update the session tally shown in #status */
  onHand(hand: number, cardsLeft: number): void
}

type Job = () => Promise<void>

export class DomIO implements IO {
  private queue: Job[] = []
  private pumping = false
  private sawCardsThisHand = false

  constructor(
    private theme: Theme,
    private els: ShellEls,
    private hooks: ShellHooks,
  ) {}

  print(line: string): void {
    this.enqueue(() => this.renderLine(line))
  }

  prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.enqueue(async () => {
        const answer = await this.readLine(question)
        resolve(answer)
      })
    })
  }

  private enqueue(job: Job): void {
    this.queue.push(job)
    if (!this.pumping) void this.pump()
  }

  private async pump(): Promise<void> {
    this.pumping = true
    while (this.queue.length > 0) {
      await this.queue.shift()!()
    }
    this.pumping = false
  }

  private async renderLine(line: string): Promise<void> {
    const c = classifyLine(line)
    switch (c.kind) {
      case 'blank':
        return
      case 'hand':
        this.hooks.onHand(c.hand, c.cardsLeft)
        this.els.cards.replaceChildren()
        this.els.solution.replaceChildren()
        this.els.play.classList.remove('state-noresult')
        this.sawCardsThisHand = false
        return
      case 'cards': {
        for (const card of c.cards) this.els.cards.appendChild(this.theme.renderCard(card))
        this.sawCardsThisHand = true
        return
      }
      case 'solution':
      case 'noresult': {
        if (this.sawCardsThisHand) await this.revealBeat()
        if (c.kind === 'noresult') {
          this.els.play.classList.add('state-noresult')
          await this.typeInto(this.els.solution, 'NO RESULT')
        } else {
          await this.typeInto(this.els.solution, c.text.replace(/^Solution: /, ''))
        }
        this.hooks.sounds()?.reveal()
        return
      }
      case 'count': {
        const sub = document.createElement('div')
        sub.className = 'count'
        this.els.solution.appendChild(sub)
        await this.typeInto(sub, c.text)
        return
      }
      case 'summary': {
        this.els.cards.replaceChildren()
        this.els.play.classList.remove('state-noresult')
        this.els.solution.replaceChildren()
        await this.typeInto(this.els.solution, c.text)
        return
      }
      case 'plain': {
        const note = document.createElement('div')
        note.className = 'note'
        this.els.solution.appendChild(note)
        await this.typeInto(note, c.text)
        return
      }
    }
  }

  private async revealBeat(): Promise<void> {
    const controller = new AbortController()
    const skip = () => controller.abort()
    window.addEventListener('keydown', skip, { once: true })
    try {
      await this.theme.revealBeat(this.els.play, controller.signal)
    } finally {
      window.removeEventListener('keydown', skip)
    }
  }

  private async typeInto(el: HTMLElement, text: string): Promise<void> {
    if (this.theme.charDelayMs <= 0) {
      el.textContent = (el.textContent ?? '') + text
      return
    }
    for (const ch of text) {
      el.textContent = (el.textContent ?? '') + ch
      await sleep(this.theme.charDelayMs * (0.6 + Math.random() * 0.8))
    }
  }

  private readLine(question: string): Promise<string> {
    this.els.promptQ.textContent = question
    this.els.promptTyped.textContent = ''
    this.els.hiddenInput.value = ''
    this.els.hiddenInput.focus()
    return new Promise((resolve) => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const value = this.els.promptTyped.textContent ?? ''
          window.removeEventListener('keydown', onKey)
          this.els.promptQ.textContent = ''
          this.els.promptTyped.textContent = ''
          resolve(value)
        } else if (e.key === 'Backspace') {
          this.els.promptTyped.textContent = (this.els.promptTyped.textContent ?? '').slice(0, -1)
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          this.els.promptTyped.textContent = (this.els.promptTyped.textContent ?? '') + e.key
          this.hooks.sounds()?.key()
        }
      }
      window.addEventListener('keydown', onKey)
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
