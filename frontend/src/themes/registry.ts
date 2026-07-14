import type { Theme } from '../types'

const loaders: Record<string, () => Promise<{ theme: Theme }>> = {
  uno: () => import('./uno'),
  esper: () => import('./esper'),
  construct: () => import('./construct'),
}

export const THEME_IDS = Object.keys(loaders) as Array<'uno' | 'esper' | 'construct'>

export async function loadTheme(id: string): Promise<Theme> {
  const load = loaders[id] ?? loaders.uno
  return (await load()).theme
}
