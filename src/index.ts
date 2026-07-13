import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { runGame } from './game'
import { loadTable } from './table'
import type { IO } from './game'

// Buffer lines ourselves: readline drops 'line' events that fire while no
// question is pending, which loses answers when stdin is piped. EOF answers
// 'n' so scripted runs and Ctrl-D exit cleanly.
const rl = createInterface({ input: process.stdin })
const pending: string[] = []
const waiters: Array<(line: string) => void> = []
let closed = false

rl.on('line', (line) => {
  const waiter = waiters.shift()
  if (waiter) waiter(line)
  else pending.push(line)
})
rl.on('close', () => {
  closed = true
  while (waiters.length) waiters.shift()!('n')
})

const io: IO = {
  prompt: (question) => {
    process.stdout.write(question)
    if (pending.length) return Promise.resolve(pending.shift()!)
    if (closed) return Promise.resolve('n')
    return new Promise((resolve) => waiters.push(resolve))
  },
  print: (line) => console.log(line),
}

const tablePath = fileURLToPath(new URL('../data/solutions.json', import.meta.url))
const table = loadTable(tablePath)
if (table === null) {
  console.warn('Note: data/solutions.json not found or unreadable — solving hands live.')
}

try {
  await runGame({ io, table })
} finally {
  rl.close()
}
