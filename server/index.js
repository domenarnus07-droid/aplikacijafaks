import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { connectDB } from './db.js'
import zapiski  from './routes/zapiski.js'
import naloge   from './routes/naloge.js'
import urnik    from './routes/urnik.js'
import auth     from './routes/auth.js'
import User     from './models/User.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// ── Zdravje (vedno vrne OK — server teče) ────────────────────────────────────
app.get('/api/zdravje', (_req, res) => res.json({ status: 'ok' }))

// ── API poti ──────────────────────────────────────────────────────────────────
app.use('/api/auth',    auth)
app.use('/api/zapiski', zapiski)
app.use('/api/naloge',  naloge)
app.use('/api/urnik',   urnik)

// ── AI proxy ──────────────────────────────────────────────────────────────────
app.post('/api/ai/povzemi', async (req, res) => {
  const { vsebina, kljuc } = req.body
  if (!vsebina || !kljuc) return res.status(400).json({ napaka: 'Manjka vsebina ali API ključ' })
  try {
    const odg = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         kljuc,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: `Povzemi ta zapisek v 3–5 kratkih točkah (•). Odgovori samo v slovenščini.\n\n${vsebina}` }],
      }),
    })
    if (!odg.ok) { const e = await odg.json().catch(() => ({})); return res.status(odg.status).json({ napaka: e.error?.message || 'Napaka AI' }) }
    const data = await odg.json()
    res.json({ povzetek: data.content?.[0]?.text || '' })
  } catch (err) { res.status(500).json({ napaka: err.message }) }
})

app.post('/api/ai/razgovor', async (req, res) => {
  const { vsebina, sporocila, kljuc } = req.body
  if (!kljuc) return res.status(400).json({ napaka: 'Manjka API ključ' })
  try {
    const sistemsko = vsebina
      ? `Si asistent za učenje. Pomagaš študentu.\n\nZapisek:\n---\n${vsebina.slice(0, 4000)}\n---\n\nOdgovarjaj v slovenščini.`
      : 'Si asistent za učenje. Odgovarjaj v slovenščini, kratko in jasno.'
    const odg = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': kljuc, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: sistemsko, messages: (sporocila || []).slice(-10) }),
    })
    if (!odg.ok) { const e = await odg.json().catch(() => ({})); return res.status(odg.status).json({ napaka: e.error?.message || 'Napaka AI' }) }
    const data = await odg.json()
    res.json({ odgovor: data.content?.[0]?.text || '' })
  } catch (err) { res.status(500).json({ napaka: err.message }) }
})

// ── Statične datoteke (built React app) ──────────────────────────────────────
if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))
} else {
  app.get('/', (_req, res) => res.send('<h2>StudyOS: najprej zaženi <code>npm run build</code></h2>'))
}

// ── Napake ────────────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ napaka: 'Notranja napaka strežnika' })
})

// ── Prepreči crash ob neobravnavanih napakah ──────────────────────────────────
process.on('uncaughtException',  err => console.warn('⚠️  Neobravnavana napaka:', err.message))
process.on('unhandledRejection', err => console.warn('⚠️  Neobravnavana zavrnitev:', err?.message || err))

// ── ZAŽENI STREŽNIK TAKOJ — MongoDB se poveže v ozadju ───────────────────────
app.listen(PORT, () => {
  console.log(`🚀 StudyOS: http://localhost:${PORT}`)
})

// MongoDB v ozadju + seed admin
connectDB().then(async (ok) => {
  if (!ok) return
  try {
    const obstaja = await User.findOne({ username: 'admin' })
    if (!obstaja) {
      await User.create({ username: 'admin', geslo: 'domen123', vloga: 'admin' })
      console.log('✅ Admin ustvarjen (admin / domen123)')
    }
  } catch {}
}).catch(() => {})
