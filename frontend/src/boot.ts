export {}

const POST = [
  'TWENTY_FOUR BIOS v1.0',
  'MEM CHECK ........ OK',
  'DECKS ............ 1-2 SUPPORTED, NO JOKERS',
  'HANDS INDEXED .... 1820',
  'SOLVABLE ......... 1362 (74.8%)',
  'ARITHMETIC ....... EXACT RATIONAL',
  '',
  'SELECT OPERATING SYSTEM',
]

interface Entry {
  id: string
  label: string
  desc: string
  boot: string
}

const ENTRIES: Entry[] = [
  { id: 'uno', label: 'UNO.SYS', desc: 'minimal color fields // silence', boot: 'LOADING UNO.SYS …' },
  { id: 'esper', label: 'ESPER.OS', desc: 'amber phosphor // scan to enhance', boot: 'LOADING ESPER.OS …' },
  { id: 'construct', label: 'CONSTRUCT', desc: 'there is no card', boot: 'LOADING CONSTRUCT …' },
]

const post = document.getElementById('post')!
const menu = document.getElementById('menu')!
const bootline = document.getElementById('bootline')!
let selected = 0
let booting = false

async function typePost(): Promise<void> {
  for (const line of POST) {
    post.textContent += line + '\n'
    await new Promise((r) => setTimeout(r, 90))
  }
}

function renderMenu(): void {
  menu.replaceChildren(
    ...ENTRIES.map((e, i) => {
      const row = document.createElement('div')
      row.className = 'entry' + (i === selected ? ' selected' : '')
      row.innerHTML = `<span class="arrow">${i === selected ? '&gt;' : '&nbsp;'}</span> <span class="label">${e.label}</span> <span class="desc">${i === selected ? e.desc : ''}</span>`
      row.addEventListener('click', () => {
        selected = i
        void boot()
      })
      row.addEventListener('mouseenter', () => {
        selected = i
        renderMenu()
      })
      return row
    }),
  )
}

async function boot(): Promise<void> {
  if (booting) return
  booting = true
  const e = ENTRIES[selected]
  menu.hidden = true
  bootline.textContent = e.boot
  await new Promise((r) => setTimeout(r, 700))
  location.href = `play.html?theme=${e.id}`
}

window.addEventListener('keydown', (ev) => {
  if (menu.hidden || booting) return
  if (ev.key === 'ArrowDown') {
    selected = (selected + 1) % ENTRIES.length
    renderMenu()
  } else if (ev.key === 'ArrowUp') {
    selected = (selected + ENTRIES.length - 1) % ENTRIES.length
    renderMenu()
  } else if (ev.key === 'Enter') {
    void boot()
  } else if (/^[1-3]$/.test(ev.key)) {
    selected = Number(ev.key) - 1
    void boot()
  }
})

await typePost()
menu.hidden = false
renderMenu()
