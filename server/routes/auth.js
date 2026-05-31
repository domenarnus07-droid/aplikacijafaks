import { Router } from 'express'
import User from '../models/User.js'
import { ustvariZeton, preveriZeton } from '../middleware/auth.js'

const r = Router()

function veljavenEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim()) }

// POST /api/auth/registracija — samo email uporabniki
r.post('/registracija', async (req, res) => {
  try {
    const { username, geslo } = req.body
    if (!username?.trim() || !geslo)
      return res.status(400).json({ napaka: 'E-mail in geslo sta obvezna' })
    if (!veljavenEmail(username))
      return res.status(400).json({ napaka: 'Vnesi veljaven e-mail naslov (npr. ime@domena.com)' })
    if (geslo.length < 4)
      return res.status(400).json({ napaka: 'Geslo mora imeti vsaj 4 znake' })
    const obstaja = await User.findOne({ username: username.toLowerCase().trim() })
    if (obstaja)
      return res.status(409).json({ napaka: 'Ta e-mail je že registriran' })
    const user = await User.create({ username: username.trim(), geslo })
    const zeton = ustvariZeton({ id: user._id, username: user.username, vloga: user.vloga })
    res.status(201).json({ zeton, username: user.username, vloga: user.vloga })
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

// POST /api/auth/prijava — admin z "admin", ostali z emailom
r.post('/prijava', async (req, res) => {
  try {
    const { username, geslo } = req.body
    if (!username || !geslo)
      return res.status(400).json({ napaka: 'Vnesi uporabniško ime in geslo' })
    const user = await User.findOne({ username: username.toLowerCase().trim() })
    if (!user || !(await user.preveriGeslo(geslo)))
      return res.status(401).json({ napaka: 'Napačno uporabniško ime ali geslo' })
    const zeton = ustvariZeton({ id: user._id, username: user.username, vloga: user.vloga })
    res.json({ zeton, username: user.username, vloga: user.vloga })
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

// GET /api/auth/jaz
r.get('/jaz', preveriZeton, (req, res) => {
  res.json({ username: req.uporabnik.username, vloga: req.uporabnik.vloga })
})

// GET /api/auth/uporabniki — samo admin
r.get('/uporabniki', preveriZeton, async (req, res) => {
  if (req.uporabnik.vloga !== 'admin') return res.status(403).json({ napaka: 'Samo admin' })
  const seznam = await User.find({}, 'username vloga ustvarjen').lean()
  res.json(seznam)
})

// DELETE /api/auth/uporabniki/:id — samo admin
r.delete('/uporabniki/:id', preveriZeton, async (req, res) => {
  if (req.uporabnik.vloga !== 'admin') return res.status(403).json({ napaka: 'Samo admin' })
  if (req.params.id === req.uporabnik.id) return res.status(400).json({ napaka: 'Ne moreš zbrisati sebe' })
  await User.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default r
