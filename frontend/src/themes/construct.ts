import type { Card } from '../../../src/cards'
import { formatCard } from '../../../src/cards'
import type { Theme, ThemeSounds } from '../types'
import './construct.css'

// ---- glyph pool: half-width katakana + digits ----------------------------

const GLYPHS: string[] = []
for (let c = 0xff66; c <= 0xff9d; c++) GLYPHS.push(String.fromCharCode(c))
for (let d = 0; d <= 9; d++) GLYPHS.push(String(d))

function randomGlyph(): string {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0]
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---- background rain canvas ----------------------------------------------

interface RainHandle {
  startFlurry(): void
  endFlurry(): void
  destroy(): void
}

const FONT_SIZE = 16

function createRain(layer: HTMLElement): RainHandle {
  const canvas = document.createElement('canvas')
  canvas.className = 'rain'
  canvas.style.opacity = '0.5'
  layer.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const reduced = prefersReducedMotion()

  let cols: number[] = []
  let speeds: number[] = []
  let colCount = 0
  let flurry = false
  let running = false
  let raf = 0
  let resizeTimer = 0

  function layout(): void {
    canvas.width = layer.clientWidth
    canvas.height = layer.clientHeight
    colCount = Math.max(1, Math.floor(canvas.width / FONT_SIZE))
    cols = Array.from({ length: colCount }, () => Math.random() * -40)
    speeds = Array.from({ length: colCount }, () => 0.05 + Math.random() * 0.11)
    if (ctx) {
      ctx.font = `${FONT_SIZE}px monospace`
      ctx.textBaseline = 'top'
    }
  }

  function drawStatic(): void {
    if (!ctx) return
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const rows = Math.floor(canvas.height / FONT_SIZE)
    for (let i = 0; i < colCount; i++) {
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.05) {
          ctx.fillStyle = Math.random() < 0.25 ? '#00b32d' : '#054d19'
          ctx.fillText(randomGlyph(), i * FONT_SIZE, r * FONT_SIZE)
        }
      }
    }
  }

  function frame(): void {
    if (ctx) {
      const trailAlpha = flurry ? 0.035 : 0.06
      ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const speedMul = flurry ? 2.2 : 1
      const resetChance = flurry ? 0.06 : 0.015
      for (let i = 0; i < colCount; i++) {
        const x = i * FONT_SIZE
        const y = cols[i] * FONT_SIZE
        ctx.fillStyle = '#00b32d'
        ctx.fillText(randomGlyph(), x, y - FONT_SIZE)
        ctx.fillStyle = '#00ff41'
        ctx.fillText(randomGlyph(), x, y)
        cols[i] += speeds[i] * speedMul
        if (y > canvas.height && Math.random() < resetChance) cols[i] = Math.random() * -10
      }
    }
    if (running) raf = requestAnimationFrame(frame)
  }

  function startLoop(): void {
    if (reduced || running) return
    running = true
    raf = requestAnimationFrame(frame)
  }
  function stopLoop(): void {
    running = false
    cancelAnimationFrame(raf)
  }

  function onVisibility(): void {
    if (document.hidden) stopLoop()
    else startLoop()
  }
  function onResize(): void {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      layout()
      if (reduced) drawStatic()
    }, 120)
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('resize', onResize)

  layout()
  if (reduced) drawStatic()
  else startLoop()

  return {
    startFlurry() {
      if (reduced) return
      flurry = true
      canvas.style.opacity = '0.85'
    },
    endFlurry() {
      if (reduced) return
      flurry = false
      canvas.style.opacity = '0.5'
    },
    destroy() {
      stopLoop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeTimer)
      canvas.remove()
    },
  }
}

let rain: RainHandle | null = null

// ---- cards -----------------------------------------------------------------

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

function churnText(final: string, progress: number): string {
  const chars = Array.from(final)
  const lockCount = Math.floor(chars.length * progress)
  return chars.map((c, i) => (i < lockCount ? c : randomGlyph())).join('')
}

function scheduleShimmer(el: HTMLElement, shimmer: HTMLElement): void {
  const delay = 1400 + Math.random() * 2200
  window.setTimeout(() => {
    if (!el.isConnected) return
    shimmer.textContent = randomGlyph()
    shimmer.classList.add('flicker')
    window.setTimeout(() => {
      shimmer.classList.remove('flicker')
    }, 180)
    scheduleShimmer(el, shimmer)
  }, delay)
}

function renderCard(card: Card): HTMLElement {
  const el = document.createElement('div')
  el.className = 'card'
  const glyph = document.createElement('div')
  glyph.className = 'card-glyph'
  const shimmer = document.createElement('span')
  shimmer.className = 'card-shimmer'
  el.append(glyph, shimmer)

  const final = formatCard(card)

  if (prefersReducedMotion()) {
    glyph.textContent = final
    el.classList.add('settled')
    scheduleShimmer(el, shimmer)
    return el
  }

  glyph.textContent = churnText(final, 0)
  const duration = 600
  const startTime = performance.now()
  const timer = window.setInterval(() => {
    if (!el.isConnected) {
      window.clearInterval(timer)
      return
    }
    const t = Math.min(1, (performance.now() - startTime) / duration)
    glyph.textContent = churnText(final, easeOutCubic(t))
    if (t >= 1) {
      window.clearInterval(timer)
      el.classList.add('settled')
      scheduleShimmer(el, shimmer)
    }
  }, 45)

  return el
}

// ---- theme -----------------------------------------------------------------

export const theme: Theme = {
  id: 'construct',
  bootLine: 'LOADING CONSTRUCT …',
  charDelayMs: 14,

  ambientStart(layer: HTMLElement): void {
    rain?.destroy()
    rain = createRain(layer)
  },
  ambientStop(): void {
    rain?.destroy()
    rain = null
  },

  renderCard,

  async revealBeat(playArea: HTMLElement, signal: AbortSignal): Promise<void> {
    if (signal.aborted) return
    const reduced = prefersReducedMotion()
    if (!reduced) {
      playArea.classList.add('flurry')
      rain?.startFlurry()
    }
    await new Promise<void>((resolve) => {
      let finished = false
      const cleanup = () => {
        if (finished) return
        finished = true
        window.clearTimeout(timer)
        signal.removeEventListener('abort', onAbort)
        if (!reduced) {
          playArea.classList.remove('flurry')
          rain?.endFlurry()
        }
        resolve()
      }
      const onAbort = () => cleanup()
      signal.addEventListener('abort', onAbort, { once: true })
      const timer = window.setTimeout(cleanup, 1500)
    })
  },

  makeSounds(ctx: AudioContext): ThemeSounds {
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    let noiseSource: AudioBufferSourceNode | null = null
    let noiseGain: GainNode | null = null

    return {
      key(): void {
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1200
        osc.type = 'sine'
        osc.frequency.setValueAtTime(700, now)
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.07)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.1)
      },
      reveal(): void {
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(420, now)
        osc.frequency.exponentialRampToValueAtTime(1900, now + 0.13)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
      },
      ambient: {
        start(): void {
          if (noiseSource) return
          const source = ctx.createBufferSource()
          source.buffer = noiseBuffer
          source.loop = true
          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.value = 900
          const gain = ctx.createGain()
          gain.gain.value = 0.018
          source.connect(filter)
          filter.connect(gain)
          gain.connect(ctx.destination)
          source.start()
          noiseSource = source
          noiseGain = gain
        },
        stop(): void {
          noiseSource?.stop()
          noiseSource?.disconnect()
          noiseSource = null
          noiseGain?.disconnect()
          noiseGain = null
        },
      },
    }
  },
}
