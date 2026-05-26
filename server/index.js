import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './db.js'
import zapiski  from './routes/zapiski.js'
import naloge   from './routes/naloge.js'
import urnik    from './routes/urnik.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.use('/api/zapiski', zapiski)
app.use('/api/naloge',  naloge)
app.use('/api/urnik',   urnik)

app.get('/api/zdravje', (_req, res) => res.json({ status: 'ok' }))

// ── AI proxy: forwarda zahteve na Anthropic API, da se izogne CORS ────────────
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
        messages: [{
          role: 'user',
          content: `Povzemi ta zapisek v 3–5 kratkih točkah (•). Odgovori samo v slovenščini. Ne dodajaj uvoda ali zaključka.\n\n${vsebina}`,
        }],
      }),
    })
    if (!odg.ok) {
      const e = await odg.json().catch(() => ({}))
      return res.status(odg.status).json({ napaka: e.error?.message || 'Napaka Anthropic API' })
    }
    const data = await odg.json()
    res.json({ povzetek: data.content?.[0]?.text || '' })
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ napaka: 'Notranja napaka strežnika' })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 StudyOS API deluje na http://localhost:${PORT}`)
  })
})
