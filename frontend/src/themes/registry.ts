import type { Theme } from '../types'
import { theme as construct } from './construct'
import { theme as esper } from './esper'
import { theme as uno } from './uno'

// Static imports on purpose: dynamic theme imports created a circular
// chunk dependency with the play bundle's top-level await in production
// builds (play awaits theme chunk; theme chunk statically depends on the
// play chunk for cards.ts) — a silent deadlock. All themes together are
// ~10KB, so eager loading costs nothing.
const themes: Record<string, Theme> = { uno, esper, construct }

export const THEME_IDS = Object.keys(themes) as Array<'uno' | 'esper' | 'construct'>

export async function loadTheme(id: string): Promise<Theme> {
  return themes[id] ?? themes.uno
}
