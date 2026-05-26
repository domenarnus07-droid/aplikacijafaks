import { prikaziObvestilo } from './toast.js'

const BASE = 'http://localhost:5000/api'

// ── Offline cache ─────────────────────────────────────────────────────────────
const CACHE = {
  '/zapiski': 'studyos-cache-zapiski',
  '/naloge':  'studyos-cache-naloge',
  '/urnik':   'studyos-cache-urnik',
}

function shraniCache(pot, podatki) {
  const k = CACHE[pot]
  if (k) try { localStorage.setItem(k, JSON.stringify(podatki)) } catch {}
}

function beriCache(pot) {
  const k = CACHE[pot]
  if (!k) return null
  try {
    const s = localStorage.getItem(k)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

// ── Osnovna zahteva ───────────────────────────────────────────────────────────
async function zahteva(pot, moznosti = {}) {
  const odg = await fetch(`${BASE}${pot}`, {
    headers: { 'Content-Type': 'application/json' },
    ...moznosti,
  })
  if (!odg.ok) {
    const telo = await odg.json().catch(() => ({}))
    throw new Error(telo.napaka || `HTTP ${odg.status}`)
  }
  return odg.json()
}

// ── Zapiski ───────────────────────────────────────────────────────────────────
export async function pridobiZapiske() {
  try {
    const data = await zahteva('/zapiski')
    shraniCache('/zapiski', data)
    return data
  } catch {
    const cache = beriCache('/zapiski')
    if (cache) { prikaziObvestilo('Offline — prikazujem shranjene zapiske', 'info'); return cache }
    prikaziObvestilo('Napaka pri nalaganju zapiskov', 'napaka')
    return []
  }
}

export async function ustvariZapisek(podatki) {
  try { return await zahteva('/zapiski', { method: 'POST', body: JSON.stringify(podatki) }) }
  catch { prikaziObvestilo('Napaka pri ustvarjanju zapiseka', 'napaka'); return null }
}

export async function posodobiZapisek(id, podatki) {
  try { return await zahteva(`/zapiski/${id}`, { method: 'PUT', body: JSON.stringify(podatki) }) }
  catch { prikaziObvestilo('Napaka pri shranjevanju zapiseka', 'napaka'); return null }
}

export async function izbrisiZapisek(id) {
  try { await zahteva(`/zapiski/${id}`, { method: 'DELETE' }); return true }
  catch { prikaziObvestilo('Napaka pri brisanju zapiseka', 'napaka'); return false }
}

// ── Naloge ────────────────────────────────────────────────────────────────────
export async function pridobiNaloge() {
  try {
    const data = await zahteva('/naloge')
    shraniCache('/naloge', data)
    return data
  } catch {
    const cache = beriCache('/naloge')
    if (cache) { prikaziObvestilo('Offline — prikazujem shranjene naloge', 'info'); return cache }
    prikaziObvestilo('Napaka pri nalaganju nalog', 'napaka')
    return []
  }
}

export async function ustvariNalogo(podatki) {
  try { return await zahteva('/naloge', { method: 'POST', body: JSON.stringify(podatki) }) }
  catch { prikaziObvestilo('Napaka pri dodajanju naloge', 'napaka'); return null }
}

export async function preklopiOpravljenost(id, opravljeno) {
  try { return await zahteva(`/naloge/${id}`, { method: 'PUT', body: JSON.stringify({ opravljeno }) }) }
  catch { prikaziObvestilo('Napaka pri posodabljanju naloge', 'napaka'); return null }
}

export async function posodobiNalogo(id, podatki) {
  try { return await zahteva(`/naloge/${id}`, { method: 'PUT', body: JSON.stringify(podatki) }) }
  catch { prikaziObvestilo('Napaka pri posodabljanju naloge', 'napaka'); return null }
}

export async function izbrisiNalogo(id) {
  try { await zahteva(`/naloge/${id}`, { method: 'DELETE' }); return true }
  catch { prikaziObvestilo('Napaka pri brisanju naloge', 'napaka'); return false }
}

// ── AI povzetek ───────────────────────────────────────────────────────────────
export async function povzemiZapisek(vsebina) {
  const kljuc = localStorage.getItem('studyos-ai-kljuc')
  if (!kljuc) throw new Error('Ni AI API ključa — nastavi ga v Nastavitvah')
  const odg = await fetch(`${BASE}/ai/povzemi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vsebina, kljuc }),
  })
  if (!odg.ok) {
    const d = await odg.json().catch(() => ({}))
    throw new Error(d.napaka || `HTTP ${odg.status}`)
  }
  const data = await odg.json()
  return data.povzetek || ''
}

// ── Urnik ─────────────────────────────────────────────────────────────────────
export async function pridobiUrnik() {
  try {
    const data = await zahteva('/urnik')
    shraniCache('/urnik', data)
    return data
  } catch {
    const cache = beriCache('/urnik')
    if (cache) { prikaziObvestilo('Offline — prikazujem shranjeni urnik', 'info'); return cache }
    prikaziObvestilo('Napaka pri nalaganju urnika', 'napaka')
    return []
  }
}

export async function ustvariUrniskiVnos(podatki) {
  try { return await zahteva('/urnik', { method: 'POST', body: JSON.stringify(podatki) }) }
  catch { prikaziObvestilo('Napaka pri dodajanju urniške ure', 'napaka'); return null }
}

export async function posodobiUrniskiVnos(id, podatki) {
  try { return await zahteva(`/urnik/${id}`, { method: 'PUT', body: JSON.stringify(podatki) }) }
  catch { prikaziObvestilo('Napaka pri posodabljanju urnika', 'napaka'); return null }
}

export async function izbrisiUrniskiVnos(id) {
  try { await zahteva(`/urnik/${id}`, { method: 'DELETE' }); return true }
  catch { prikaziObvestilo('Napaka pri brisanju urniške ure', 'napaka'); return false }
}
