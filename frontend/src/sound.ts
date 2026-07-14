import type { Theme, ThemeSounds } from './types'

export class SoundControl {
  private ctx: AudioContext | null = null
  private sounds: ThemeSounds | null = null
  private on = false

  constructor(
    private theme: Theme,
    private button: HTMLButtonElement,
  ) {
    button.addEventListener('click', () => this.toggle())
    this.render()
  }

  current(): ThemeSounds | null {
    return this.on ? this.sounds : null
  }

  private toggle(): void {
    this.on = !this.on
    if (this.on && !this.ctx) {
      this.ctx = new AudioContext()
      this.sounds = this.theme.makeSounds(this.ctx)
    }
    if (this.on) this.sounds?.ambient?.start()
    else this.sounds?.ambient?.stop()
    this.render()
  }

  private render(): void {
    this.button.textContent = this.on ? '[sound: on]' : '[sound: off]'
  }
}
