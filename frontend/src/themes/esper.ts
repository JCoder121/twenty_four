import type { Card } from '../../../src/cards'
import { formatCard, valueOf } from '../../../src/cards'
import type { Theme, ThemeSounds } from '../types'
import './esper.css'

let ambientLayer: HTMLElement | null = null
let scanlinesEl: HTMLElement | null = null
let vignetteEl: HTMLElement | null = null
let serial = 0

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const theme: Theme = {
  id: 'esper',
  bootLine: 'LOADING ESPER.OS … CALIBRATING PHOTO ANALYSIS UNIT',
  charDelayMs: 24,

  ambientStart(layer: HTMLElement): void {
    ambientLayer = layer
    vignetteEl = document.createElement('div')
    vignetteEl.className = 'esper-vignette'
    scanlinesEl = document.createElement('div')
    scanlinesEl.className = 'esper-scanlines'
    layer.appendChild(vignetteEl)
    layer.appendChild(scanlinesEl)
  },

  ambientStop(): void {
    vignetteEl?.remove()
    scanlinesEl?.remove()
    vignetteEl = null
    scanlinesEl = null
    ambientLayer = null
  },

  renderCard(card: Card): HTMLElement {
    serial = (serial % 4) + 1
    const el = document.createElement('div')
    el.className = 'card'

    const serialEl = document.createElement('div')
    serialEl.className = 'card-serial'
    serialEl.textContent = `SPEC 0${serial}`

    const face = document.createElement('div')
    face.className = 'card-face'
    face.textContent = formatCard(card)

    const readout = document.createElement('div')
    readout.className = 'card-readout'
    readout.textContent = `ID ${formatCard(card)} // VAL ${String(valueOf(card)).padStart(2, '0')}`

    el.append(serialEl, face, readout)
    return el
  },

  async revealBeat(playArea: HTMLElement, signal: AbortSignal): Promise<void> {
    const reduced = reducedMotion()

    const label = document.createElement('div')
    label.className = 'esper-scan-label'
    label.textContent = 'ENHANCE'
    playArea.appendChild(label)

    const cleanup = () => {
      label.remove()
      beam?.remove()
    }

    let beam: HTMLElement | null = null

    if (reduced) {
      label.classList.add('reduced')
      return new Promise<void>((resolve) => {
        const t = setTimeout(() => { cleanup(); resolve() }, 400)
        signal.addEventListener('abort', () => { clearTimeout(t); cleanup(); resolve() }, { once: true })
      })
    }

    beam = document.createElement('div')
    beam.className = 'esper-scan-beam'
    playArea.appendChild(beam)

    const height = playArea.getBoundingClientRect().height

    return new Promise<void>((resolve) => {
      const anim = beam!.animate(
        [
          { transform: 'translateY(-20px)', opacity: 0 },
          { transform: 'translateY(0px)', opacity: 1, offset: 0.1 },
          { transform: `translateY(${Math.max(height - 20, 40)}px)`, opacity: 1, offset: 0.9 },
          { transform: `translateY(${height + 20}px)`, opacity: 0 },
        ],
        { duration: 1500, easing: 'linear', fill: 'forwards' },
      )
      const finish = () => { cleanup(); resolve() }
      anim.addEventListener('finish', finish)
      signal.addEventListener('abort', () => { anim.cancel(); finish() }, { once: true })
    })
  },

  makeSounds(ctx: AudioContext): ThemeSounds {
    let humOsc: OscillatorNode | null = null
    let humGain: GainNode | null = null
    let noiseSource: AudioBufferSourceNode | null = null
    let noiseGain: GainNode | null = null

    function start(): void {
      if (humOsc) return
      humOsc = ctx.createOscillator()
      humOsc.type = 'sine'
      humOsc.frequency.value = 55
      humGain = ctx.createGain()
      humGain.gain.value = 0.018
      humOsc.connect(humGain).connect(ctx.destination)
      humOsc.start()

      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      noiseSource = ctx.createBufferSource()
      noiseSource.buffer = buffer
      noiseSource.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1800
      noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.004
      noiseSource.connect(filter).connect(noiseGain).connect(ctx.destination)
      noiseSource.start()
    }

    function stop(): void {
      humOsc?.stop()
      humOsc?.disconnect()
      humOsc = null
      humGain?.disconnect()
      humGain = null
      noiseSource?.stop()
      noiseSource?.disconnect()
      noiseSource = null
      noiseGain?.disconnect()
      noiseGain = null
    }

    function key(): void {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 1700 + Math.random() * 500
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.025, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.04)
    }

    function reveal(): void {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.4)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.5)
    }

    return { key, reveal, ambient: { start, stop } }
  },
}
