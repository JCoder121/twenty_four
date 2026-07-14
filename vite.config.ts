import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Vitest runs with mode 'test' and needs the repo root (engine tests live in
// tests/); dev/build serve the frontend/ directory.
export default defineConfig(({ mode }) => {
  if (mode === 'test') {
    return {
      test: {
        root: fileURLToPath(new URL('.', import.meta.url)),
      },
    }
  }
  return {
    root: 'frontend',
    base: '/twenty_four/',
    resolve: {
      alias: {
        'node:fs': fileURLToPath(new URL('frontend/src/node-fs-stub.ts', import.meta.url)),
      },
    },
    build: {
      target: 'es2022',
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: fileURLToPath(new URL('frontend/index.html', import.meta.url)),
          play: fileURLToPath(new URL('frontend/play.html', import.meta.url)),
        },
      },
    },
  }
})
