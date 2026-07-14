import table from '../../data/solutions.json'
import { runGame } from '../../src/game'
import type { SolutionTable } from '../../src/table'
import { DomIO } from './dom-io'
import { SoundControl } from './sound'
import { loadTheme } from './themes/registry'

const params = new URLSearchParams(location.search)
const theme = await loadTheme(params.get('theme') ?? 'uno')
document.body.dataset.theme = theme.id

const els = {
  status: document.getElementById('status')!,
  cards: document.getElementById('cards')!,
  solution: document.getElementById('solution')!,
  play: document.getElementById('play')!,
  promptQ: document.getElementById('prompt-q')!,
  promptTyped: document.getElementById('prompt-typed')!,
  hiddenInput: document.getElementById('hidden-input') as HTMLInputElement,
}
const soundControl = new SoundControl(theme, document.getElementById('sound-toggle') as HTMLButtonElement)

const io = new DomIO(theme, els, {
  sounds: () => soundControl.current(),
  onHand(hand, cardsLeft) {
    els.status.textContent = `${theme.id.toUpperCase()} // HAND ${hand} // ${cardsLeft} CARDS LEFT`
  },
})

theme.ambientStart(document.getElementById('ambient')!)

// tap anywhere refocuses the hidden input so mobile keyboards summon
document.addEventListener('pointerdown', () => els.hiddenInput.focus())

await runGame({ io, table: table as unknown as SolutionTable })

// session over -> back to boot menu
els.promptQ.textContent = 'SESSION TERMINATED — press Enter to reboot '
await new Promise<void>((resolve) => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') resolve()
  })
})
theme.ambientStop()
location.href = import.meta.env.BASE_URL
