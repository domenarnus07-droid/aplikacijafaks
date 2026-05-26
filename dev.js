// StudyOS — Terminal Launcher
import { spawn } from 'child_process'

process.env.NODE_NO_WARNINGS = '1'
process.env.FORCE_COLOR       = '3'

// ── ANSI ──────────────────────────────────────────────────────────────────────
const R  = '\x1b[0m'
const B  = '\x1b[1m'
const SV = '\x1b[90m'
const BE = '\x1b[97m'
const ZE = '\x1b[92m'
const MO = '\x1b[94m'
const CI = '\x1b[96m'
const RU = '\x1b[93m'

// ── Box banner ────────────────────────────────────────────────────────────────
function banner() {
  const datum = new Date().toLocaleDateString('sl-SI', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  const W = 52

  const pad = (txt, w) => {
    const visible = txt.replace(/\x1b\[[0-9;]*m/g, '')
    const spaces  = w - visible.length
    return txt + ' '.repeat(Math.max(0, spaces))
  }

  const vrsta   = v => `  ${SV}║${R}  ${v}  ${SV}║${R}`
  const sep     = `  ${SV}╠${'─'.repeat(W + 2)}╣${R}`
  const zgoraj  = `  ${SV}╔${'═'.repeat(W + 2)}╗${R}`
  const spodaj  = `  ${SV}╚${'═'.repeat(W + 2)}╝${R}`

  const naslov  = `${MO}${B}  STUDYOS  —  RAZVOJNI STREŽNIK${R}`
  const vrstica1 = pad(`${RU}${B}🌐  Vite ${R}     ${BE}http://localhost:${B}5173${R}`, W)
  const vrstica2 = pad(`${MO}${B}⚙️   API  ${R}     ${BE}http://localhost:${B}5000${R}`, W)
  const vrstica3 = pad(`${CI}📅  Zagnan    ${BE}${datum}${R}`, W)

  let out = '\n'
  out += `${zgoraj}\n`
  out += `${vrsta(pad(naslov, W))}\n`
  out += `${sep}\n`
  out += `${vrsta(vrstica1)}\n`
  out += `${vrsta(vrstica2)}\n`
  out += `${vrsta(vrstica3)}\n`
  out += `${spodaj}\n\n`

  process.stdout.write(out)
}

// ── Zaženi proces (tiho — brez izpisa) ───────────────────────────────────────
function zageni(ukaz) {
  const proc = spawn(ukaz, [], {
    stdio: 'ignore',
    shell: true,
    env:   { ...process.env },
  })
  proc.on('error', () => {})
  return proc
}

// ── Start ─────────────────────────────────────────────────────────────────────
banner()

const api  = zageni('node --no-deprecation server/index.js')
const vite = zageni('.\\node_modules\\.bin\\vite.cmd --clearScreen false')

// ── Ctrl+C ────────────────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  api.kill(); vite.kill()
  setTimeout(() => process.exit(0), 200)
})

process.on('uncaughtException', () => {})
