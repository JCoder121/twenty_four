// Browser stand-in for node:fs, aliased in vite.config.ts. The engine's
// table.ts only calls readFileSync inside loadTable(), which the frontend
// never invokes (solutions.json is bundled as a JSON import instead).
export function readFileSync(): never {
  throw new Error('fs is not available in the browser')
}
