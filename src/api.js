import { prikaziObvestilo } from './toast.js'

const BASE = 'http://localhost:5000/api'

// ── localStorage keys ─────────────────────────────────────────────────────────
const KLJUCI = {
  zapiski: 'studyos-local-zapiski',
  naloge:  'studyos-local-naloge',
  urnik:   'studyos-local-urnik',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `lok-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
function beriLS(k) {
  try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] }
}
function shraniLS(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

// ── Backend availability (cached 8s) ──────────────────────────────────────────
let _backendOk = null
let _zadnjePrev = 0
async function backendOk() {
  const zdaj = Date.now()
  if (zdaj - _zadnjePrev < 8000 && _backendOk !== null) return _backendOk
  _zadnjePrev = zdaj
  try {
    const r = await fetch(`${BASE}/zdravje`, { signal: AbortSignal.timeout(1500) })
    _backendOk = r.ok
  } catch { _backendOk = false }
  return _backendOk
}
export async function preveriPovezavo() { return backendOk() }

async function apiKlic(pot, moznosti = {}) {
  const r = await fetch(`${BASE}${pot}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(5000),
    ...moznosti,
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.napaka || e.error || `HTTP ${r.status}`)
  }
  return r.json()
}

// ── ZAPISKI ───────────────────────────────────────────────────────────────────
export async function pridobiZapiske() {
  if (await backendOk()) {
    try { const d = await apiKlic('/zapiski'); shraniLS(KLJUCI.zapiski, d); return d } catch {}
  }
  const lok = beriLS(KLJUCI.zapiski)
  if (lok.length) prikaziObvestilo('Offline — prikazujem lokalne zapiske', 'info')
  return lok
}
export async function ustvariZapisek(podatki) {
  const ts = new Date().toISOString()
  const lok = { ...podatki, _id: genId(), _lokalno: true, createdAt: ts, updatedAt: ts }
  const s = beriLS(KLJUCI.zapiski); s.unshift(lok); shraniLS(KLJUCI.zapiski, s)
  if (await backendOk()) {
    try {
      const srv = await apiKlic('/zapiski', { method: 'POST', body: JSON.stringify(podatki) })
      shraniLS(KLJUCI.zapiski, beriLS(KLJUCI.zapiski).map(z => z._id === lok._id ? srv : z))
      return srv
    } catch {}
  }
  return lok
}
export async function posodobiZapisek(id, podatki) {
  const p = beriLS(KLJUCI.zapiski).map(z => z._id === id ? { ...z, ...podatki, updatedAt: new Date().toISOString() } : z)
  shraniLS(KLJUCI.zapiski, p)
  if (await backendOk()) {
    try {
      const srv = await apiKlic(`/zapiski/${id}`, { method: 'PUT', body: JSON.stringify(podatki) })
      shraniLS(KLJUCI.zapiski, beriLS(KLJUCI.zapiski).map(z => z._id === id ? srv : z)); return srv
    } catch {}
  }
  return p.find(z => z._id === id) || null
}
export async function izbrisiZapisek(id) {
  shraniLS(KLJUCI.zapiski, beriLS(KLJUCI.zapiski).filter(z => z._id !== id))
  if (await backendOk()) { try { await apiKlic(`/zapiski/${id}`, { method: 'DELETE' }) } catch {} }
  return true
}

// ── NALOGE ────────────────────────────────────────────────────────────────────
export async function pridobiNaloge() {
  if (await backendOk()) {
    try { const d = await apiKlic('/naloge'); shraniLS(KLJUCI.naloge, d); return d } catch {}
  }
  const lok = beriLS(KLJUCI.naloge)
  if (lok.length) prikaziObvestilo('Offline — prikazujem lokalne naloge', 'info')
  return lok
}
export async function ustvariNalogo(podatki) {
  const ts = new Date().toISOString()
  const lok = { ...podatki, _id: genId(), _lokalno: true, createdAt: ts, updatedAt: ts }
  const s = beriLS(KLJUCI.naloge); s.unshift(lok); shraniLS(KLJUCI.naloge, s)
  if (await backendOk()) {
    try {
      const srv = await apiKlic('/naloge', { method: 'POST', body: JSON.stringify(podatki) })
      shraniLS(KLJUCI.naloge, beriLS(KLJUCI.naloge).map(n => n._id === lok._id ? srv : n)); return srv
    } catch {}
  }
  return lok
}
export async function preklopiOpravljenost(id, opravljeno) {
  const p = beriLS(KLJUCI.naloge).map(n => n._id === id ? { ...n, opravljeno, updatedAt: new Date().toISOString() } : n)
  shraniLS(KLJUCI.naloge, p)
  if (await backendOk()) {
    try {
      const srv = await apiKlic(`/naloge/${id}`, { method: 'PUT', body: JSON.stringify({ opravljeno }) })
      shraniLS(KLJUCI.naloge, beriLS(KLJUCI.naloge).map(n => n._id === id ? srv : n)); return srv
    } catch {}
  }
  return p.find(n => n._id === id) || null
}
export async function posodobiNalogo(id, podatki) {
  const p = beriLS(KLJUCI.naloge).map(n => n._id === id ? { ...n, ...podatki, updatedAt: new Date().toISOString() } : n)
  shraniLS(KLJUCI.naloge, p)
  if (await backendOk()) {
    try {
      const srv = await apiKlic(`/naloge/${id}`, { method: 'PUT', body: JSON.stringify(podatki) })
      shraniLS(KLJUCI.naloge, beriLS(KLJUCI.naloge).map(n => n._id === id ? srv : n)); return srv
    } catch {}
  }
  return p.find(n => n._id === id) || null
}
export async function izbrisiNalogo(id) {
  shraniLS(KLJUCI.naloge, beriLS(KLJUCI.naloge).filter(n => n._id !== id))
  if (await backendOk()) { try { await apiKlic(`/naloge/${id}`, { method: 'DELETE' }) } catch {} }
  return true
}

// ── URNIK ─────────────────────────────────────────────────────────────────────
export async function pridobiUrnik() {
  if (await backendOk()) {
    try { const d = await apiKlic('/urnik'); shraniLS(KLJUCI.urnik, d); return d } catch {}
  }
  return beriLS(KLJUCI.urnik)
}
export async function ustvariUrniskiVnos(podatki) {
  const ts = new Date().toISOString()
  const lok = { ...podatki, _id: genId(), _lokalno: true, createdAt: ts, updatedAt: ts }
  const s = beriLS(KLJUCI.urnik); s.push(lok); shraniLS(KLJUCI.urnik, s)
  if (await backendOk()) {
    try {
      const srv = await apiKlic('/urnik', { method: 'POST', body: JSON.stringify(podatki) })
      shraniLS(KLJUCI.urnik, beriLS(KLJUCI.urnik).map(u => u._id === lok._id ? srv : u)); return srv
    } catch {}
  }
  return lok
}
export async function posodobiUrniskiVnos(id, podatki) {
  const p = beriLS(KLJUCI.urnik).map(u => u._id === id ? { ...u, ...podatki, updatedAt: new Date().toISOString() } : u)
  shraniLS(KLJUCI.urnik, p)
  if (await backendOk()) {
    try {
      const srv = await apiKlic(`/urnik/${id}`, { method: 'PUT', body: JSON.stringify(podatki) })
      shraniLS(KLJUCI.urnik, beriLS(KLJUCI.urnik).map(u => u._id === id ? srv : u)); return srv
    } catch {}
  }
  return p.find(u => u._id === id) || null
}
export async function izbrisiUrniskiVnos(id) {
  shraniLS(KLJUCI.urnik, beriLS(KLJUCI.urnik).filter(u => u._id !== id))
  if (await backendOk()) { try { await apiKlic(`/urnik/${id}`, { method: 'DELETE' }) } catch {} }
  return true
}

// ════════════════════════════════════════════════════════════════════════════
// AI — podpora za več ponudnikov
// ════════════════════════════════════════════════════════════════════════════

function getPonudnik() { return localStorage.getItem('studyos-ai-ponudnik') || 'groq' }
function getKljuc() {
  const ponudnik = getPonudnik()
  // Najprej išči ključ specifičen za ponudnika, nato fallback na stari splošni ključ
  return localStorage.getItem(`studyos-ai-kljuc-${ponudnik}`)
      || localStorage.getItem('studyos-ai-kljuc')
      || ''
}

// ── Anthropic (plačljiv, najbolj zmogljiv) ────────────────────────────────────
async function anthropicKlic(sistemsko, sporocila, kljuc, maxTokens = 1024) {
  const telo = { model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, messages: sporocila }
  if (sistemsko) telo.system = sistemsko
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': kljuc,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(telo),
  })
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Anthropic ${r.status}`) }
  return (await r.json()).content?.[0]?.text || ''
}

// ── Groq (ZASTONJ — 14.400 klicev/dan) ───────────────────────────────────────
async function groqKlic(sistemsko, sporocila, kljuc, maxTokens = 1024) {
  const messages = []
  if (sistemsko) messages.push({ role: 'system', content: sistemsko })
  messages.push(...sporocila.filter(s => s.role === 'user' || s.role === 'assistant'))
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${kljuc}` },
    body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages, max_tokens: maxTokens }),
  })
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Groq ${r.status}`) }
  return (await r.json()).choices?.[0]?.message?.content || ''
}

// ── Google Gemini (ZASTONJ — 1.500 klicev/dan) ───────────────────────────────
async function geminiKlic(sistemsko, sporocila, kljuc, maxTokens = 1024) {
  const contents = sporocila
    .filter(s => s.role === 'user' || s.role === 'assistant')
    .map(s => ({ role: s.role === 'assistant' ? 'model' : 'user', parts: [{ text: s.content }] }))
  const telo = { contents, generationConfig: { maxOutputTokens: maxTokens } }
  if (sistemsko) telo.systemInstruction = { parts: [{ text: sistemsko }] }
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${kljuc}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(telo) }
  )
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini ${r.status}`) }
  return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Ollama (LOKALNO — brez interneta) ─────────────────────────────────────────
async function ollamaKlic(sistemsko, sporocila) {
  const ollamaUrl = localStorage.getItem('studyos-ollama-url') || 'http://localhost:11434'
  const model = localStorage.getItem('studyos-ollama-model') || 'llama3.2'
  const messages = []
  if (sistemsko) messages.push({ role: 'system', content: sistemsko })
  messages.push(...sporocila.filter(s => s.role === 'user' || s.role === 'assistant'))
  const r = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  })
  if (!r.ok) throw new Error(`Ollama ${r.status} — ali je Ollama zagnan?`)
  return (await r.json()).message?.content || ''
}

// ── Centralni AI klic ─────────────────────────────────────────────────────────
async function aiKlic(sistemsko, sporocila, maxTokens = 1024) {
  const ponudnik = getPonudnik()
  const kljuc    = getKljuc()

  if (ponudnik === 'ollama') return await ollamaKlic(sistemsko, sporocila)
  if (!kljuc) throw new Error('Ni AI API ključa — nastavi ga v Nastavitvah')

  switch (ponudnik) {
    case 'groq':     return await groqKlic(sistemsko, sporocila, kljuc, maxTokens)
    case 'gemini':   return await geminiKlic(sistemsko, sporocila, kljuc, maxTokens)
    default:         return await anthropicKlic(sistemsko, sporocila, kljuc, maxTokens)
  }
}

// ── Javne AI funkcije ─────────────────────────────────────────────────────────
export async function aiRazgovor(vsebina, sporocila) {
  const sistemsko = vsebina
    ? `Si asistent za učenje. Pomagaš študentu pri razumevanju snovi.\n\nZapisek:\n---\n${vsebina.slice(0, 4000)}\n---\n\nOdgovarjaj v slovenščini, kratko in jasno.`
    : 'Si asistent za učenje za slovenskega študenta. Odgovarjaj v slovenščini, kratko in jasno.'
  return await aiKlic(sistemsko, (sporocila || []).slice(-12))
}

export async function povzemiZapisek(vsebina) {
  return await aiKlic(
    'Povzemi ta zapisek v 3–5 kratkih točkah (•). Odgovori samo v slovenščini. Ne dodajaj uvoda ali zaključka.',
    [{ role: 'user', content: vsebina }],
    512
  )
}

export async function generirajFlashcards(vsebina) {
  const prompt = `Iz spodnje vsebine zapiska ustvari 5–10 flashcard kartic v formatu:

Q: [kratko vprašanje]
A: [jasen, jedrnat odgovor]

Odgovarjaj samo v slovenščini. Vrni SAMO kartice, brez uvoda.

Vsebina zapiska:
${vsebina.slice(0, 3000)}`
  return await aiKlic('', [{ role: 'user', content: prompt }], 1024)
}
