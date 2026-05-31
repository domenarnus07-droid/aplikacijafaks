import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  pridobiZapiske, pridobiNaloge, pridobiUrnik, preklopiOpravljenost, aiRazgovor
} from '../api.js'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'

const DNEVI = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja']

function pozdrav() {
  const ura = new Date().getHours()
  const ime = localStorage.getItem('studyos-ime') || 'Študent'
  if (ura < 12) return `Dobro jutro, ${ime}! ☀️`
  if (ura < 18) return `Dober dan, ${ime}! 👋`
  return `Dober večer, ${ime}! 🌙`
}

function slovenskiDatum() {
  const d = new Date()
  const meseci = ['januar','februar','marec','april','maj','junij',
                  'julij','avgust','september','oktober','november','december']
  return `${DNEVI[d.getDay() === 0 ? 6 : d.getDay() - 1]}, ${d.getDate()}. ${meseci[d.getMonth()]} ${d.getFullYear()}`
}

// ── Widget config ─────────────────────────────────────────────────────────────
const WIDGETI_PRIVZETI = {
  rok: true, nadaljuj: true, cilji: true, pomo_graf: true,
  urnik: true, naloge: true, statistike: true, aktivnost: true,
  fokus_seznam: true, napredek_predmetov: true, navade: true,
}
const WIDGET_IMENA = {
  rok: '⏰ Naslednji rok', nadaljuj: '📝 Nadaljuj zapisek', cilji: '🎯 Cilji + Opomba',
  pomo_graf: '🍅 Fokus timer graf', urnik: '📅 Današnji urnik', naloge: '✅ Aktivne naloge',
  statistike: '📊 Statistike po predmetih', aktivnost: '🟩 Aktivnost heatmap',
  fokus_seznam: '📋 Danes naredim', napredek_predmetov: '🔵 Napredek predmetov',
  navade: '✅ Dnevne navade',
}

function beriWidgete() {
  try {
    const s = localStorage.getItem('studyos-dash-config')
    if (s) return { ...WIDGETI_PRIVZETI, ...JSON.parse(s) }
  } catch {}
  return { ...WIDGETI_PRIVZETI }
}
function hraniWidgete(w) {
  try { localStorage.setItem('studyos-dash-config', JSON.stringify(w)) } catch {}
}

// ── Streak ────────────────────────────────────────────────────────────────────
function izracunajStreak() {
  try {
    const arr = JSON.parse(localStorage.getItem('studyos-aktivni-dnevi') || '[]')
    const dnevi = new Set(arr)
    let streak = 0
    const danes = new Date()
    for (let i = 0; i < 366; i++) {
      const d = new Date(danes)
      d.setDate(danes.getDate() - i)
      const str = d.toISOString().slice(0, 10)
      if (dnevi.has(str)) streak++
      else break
    }
    return streak
  } catch { return 0 }
}

function belezidanes() {
  try {
    const danes = new Date().toISOString().slice(0, 10)
    const arr = JSON.parse(localStorage.getItem('studyos-aktivni-dnevi') || '[]')
    if (!arr.includes(danes)) {
      const zdaj = new Date()
      const filtriran = arr.filter(d => (zdaj - new Date(d)) / 86400000 <= 365)
      filtriran.push(danes)
      localStorage.setItem('studyos-aktivni-dnevi', JSON.stringify(filtriran))
    }
  } catch {}
}

// ── Aktivnost heatmap ─────────────────────────────────────────────────────────
function AktivnostMreza({ zapiski, naloge }) {
  const TEDNOV = 10
  const danes  = new Date(); danes.setHours(0, 0, 0, 0)

  const aktivnost = {}
  const dodaj = (dateStr) => {
    if (!dateStr) return
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
    const k = d.toISOString().slice(0, 10)
    aktivnost[k] = (aktivnost[k] || 0) + 1
  }
  zapiski.forEach(z => dodaj(z.ustvarjen))
  naloge.forEach(n  => dodaj(n.ustvarjena))

  try {
    const obiski = JSON.parse(localStorage.getItem('studyos-aktivni-dnevi') || '[]')
    obiski.forEach(d => { aktivnost[d] = (aktivnost[d] || 0) })
  } catch {}

  const max = Math.max(1, ...Object.values(aktivnost))
  const danTedna = (danes.getDay() + 6) % 7
  const zacetek  = new Date(danes)
  zacetek.setDate(danes.getDate() - danTedna - (TEDNOV - 1) * 7)

  const tedni = []
  for (let t = 0; t < TEDNOV; t++) {
    const dnevi = []
    for (let d = 0; d < 7; d++) {
      const datum = new Date(zacetek)
      datum.setDate(zacetek.getDate() + t * 7 + d)
      const kljuc     = datum.toISOString().slice(0, 10)
      const prihodnji = datum > danes
      dnevi.push({ kljuc, stevilo: prihodnji ? null : (aktivnost[kljuc] || 0), je_danes: datum.getTime() === danes.getTime() })
    }
    tedni.push(dnevi)
  }

  function barva(n) {
    if (n === null) return 'transparent'
    if (n === 0)    return 'var(--ozadje3)'
    return `rgba(37,99,235,${0.25 + Math.min(1, n / max) * 0.75})`
  }

  const KRATKO = ['P','T','S','Č','P','S','N']
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 2 }}>
          {KRATKO.map((d, i) => (
            <div key={i} style={{ height: 12, fontSize: '0.6rem', color: 'var(--besedilo3)', width: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        {tedni.map((teden, ti) => (
          <div key={ti} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {teden.map((cel, di) => (
              <div
                key={di}
                title={cel.stevilo !== null ? `${cel.kljuc}: ${cel.stevilo}` : ''}
                style={{
                  width: 12, height: 12, borderRadius: 2,
                  background: barva(cel.stevilo),
                  boxSizing: 'border-box',
                  border: cel.je_danes ? `1.5px solid var(--modra)` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.68rem', color: 'var(--besedilo3)' }}>
        <span>{TEDNOV} tednov nazaj</span>
        <span>Danes</span>
      </div>
    </div>
  )
}

// ── Odštevalnik roka ──────────────────────────────────────────────────────────
function OdstevalnikRoka({ naloga }) {
  const d     = new Date(naloga.rok)
  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const diff  = Math.round((d - danes) / 86400000)
  const barva = diff <= 0 ? 'var(--rdeca)' : diff <= 2 ? 'var(--rumena)' : 'var(--modra)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderRadius: 10,
      background: barva + '18', border: `1.5px solid ${barva}44`,
    }}>
      <i className="ti ti-clock-bolt" style={{ color: barva, fontSize: '1.2rem' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{naloga.besedilo}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginTop: 2 }}>
          {diff < 0    ? `Zamujeno za ${Math.abs(diff)} dni`
           : diff === 0 ? 'Rok je danes!'
           : diff === 1 ? 'Rok je jutri'
           : `Rok čez ${diff} dni`}
        </div>
      </div>
      <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: '1.5rem', color: barva }}>
        {diff <= 0 ? '0' : diff}
        <span style={{ fontSize: '0.65rem', fontWeight: 400, marginLeft: 2 }}>dni</span>
      </span>
    </div>
  )
}

const PRIORITETA_VRSTNI_RED = { visoka: 0, srednja: 1, nizka: 2 }
const BARVE_STAT = ['var(--modra)', 'var(--zelena)', 'var(--rumena)', 'var(--rdeca)']

// ── Cilji tega tedna ──────────────────────────────────────────────────────────
function getTeden() {
  const d = new Date(), jan1 = new Date(d.getFullYear(), 0, 1)
  const teden = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(teden).padStart(2, '00')}`
}
function beriCilje() {
  try {
    const s = localStorage.getItem('studyos-cilji')
    if (s) {
      const obj = JSON.parse(s)
      if (obj.teden === getTeden()) return obj.cilji
    }
  } catch {}
  return [{ id: 1, besedilo: '', opravljeno: false }, { id: 2, besedilo: '', opravljeno: false }, { id: 3, besedilo: '', opravljeno: false }]
}
function shraniCilje(cilji) {
  try { localStorage.setItem('studyos-cilji', JSON.stringify({ teden: getTeden(), cilji })) } catch {}
}

function tedenFokusMin() {
  try {
    const sesije = JSON.parse(localStorage.getItem('studyos-pomo-sesije') || '[]')
    const danes = new Date(); danes.setHours(0, 0, 0, 0)
    const ponedeljek = new Date(danes)
    ponedeljek.setDate(danes.getDate() - ((danes.getDay() + 6) % 7))
    return sesije
      .filter(s => s.tip === 'fokus' && new Date(s.zacetek) >= ponedeljek)
      .reduce((a, s) => a + (s.trajanje || 0), 0)
  } catch { return 0 }
}

function CiljiWidget() {
  const [cilji, setCilji] = useState(beriCilje)
  const [ciljUre, setCiljUre] = useState(() => {
    const v = localStorage.getItem('studyos-dash-cilj-ure')
    return v ? Number(v) : 10
  })
  const [urejiUre, setUrejiUre] = useState(false)
  const fokusMin = tedenFokusMin()
  const fokusUre = Math.round(fokusMin / 60 * 10) / 10
  const pct = Math.min(100, Math.round(fokusUre / ciljUre * 100))

  function preklopi(id) {
    const novi = cilji.map(c => c.id === id ? { ...c, opravljeno: !c.opravljeno } : c)
    setCilji(novi); shraniCilje(novi)
  }
  function spremeniBesedilo(id, v) {
    const novi = cilji.map(c => c.id === id ? { ...c, besedilo: v } : c)
    setCilji(novi); shraniCilje(novi)
  }
  const opravljenih = cilji.filter(c => c.besedilo.trim() && c.opravljeno).length
  const skupaj = cilji.filter(c => c.besedilo.trim()).length
  return (
    <div className="kartica" style={{ marginBottom: 0 }}>
      <div className="dash-kartica-naslov" style={{ justifyContent: 'space-between' }}>
        <span><i className="ti ti-target" style={{ color: 'var(--vijolicna)' }} /> Cilji tega tedna</span>
        {skupaj > 0 && <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--besedilo3)' }}>{opravljenih}/{skupaj}</span>}
      </div>

      {/* Fokus ure cilj */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <i className="ti ti-clock" style={{ color: '#F59E0B', fontSize: '0.8rem' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, flex: 1 }}>
            Fokus: {fokusUre}h / {' '}
            {urejiUre
              ? <input
                  type="number" min="1" max="80"
                  value={ciljUre}
                  onChange={e => { const v = Number(e.target.value); setCiljUre(v); localStorage.setItem('studyos-dash-cilj-ure', v) }}
                  onBlur={() => setUrejiUre(false)}
                  autoFocus
                  style={{ width: 44, fontSize: '0.78rem', fontWeight: 600, padding: '0 4px', border: '1px solid var(--modra)', borderRadius: 5, background: 'var(--ozadje1)', color: 'var(--besedilo1)', fontFamily: 'inherit' }}
                />
              : <span style={{ cursor: 'pointer', color: 'var(--besedilo3)', textDecoration: 'underline dotted' }} onClick={() => setUrejiUre(true)}>{ciljUre}h cilja</span>
            }
          </span>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: pct >= 100 ? 'var(--zelena)' : 'var(--besedilo3)', fontWeight: pct >= 100 ? 700 : 400 }}>
            {pct}%{pct >= 100 ? ' 🎉' : ''}
          </span>
        </div>
        <div style={{ height: 7, background: 'var(--ozadje3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--zelena)' : '#F59E0B', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {cilji.map(c => (
        <div key={c.id} className="dash-cilji-vnos">
          <button
            className={`naloga-krogec ${c.opravljeno && c.besedilo.trim() ? 'oznacen' : ''}`}
            style={{ width: 20, height: 20, flexShrink: 0 }}
            onClick={() => c.besedilo.trim() && preklopi(c.id)}
          >
            {c.opravljeno && c.besedilo.trim() && <i className="ti ti-check" style={{ fontSize: '0.62rem', color: '#fff' }} />}
          </button>
          <input
            className="vhod"
            style={{ border: 'none', background: 'transparent', padding: '2px 4px', fontSize: '0.875rem',
              textDecoration: c.opravljeno && c.besedilo.trim() ? 'line-through' : 'none',
              opacity: c.opravljeno && c.besedilo.trim() ? 0.55 : 1 }}
            placeholder={`Cilj ${c.id}…`}
            value={c.besedilo}
            onChange={e => spremeniBesedilo(c.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}

function StickyNote() {
  const [besedilo, setBesedilo] = useState(() => localStorage.getItem('studyos-sticky') || '')
  function shrani(v) {
    setBesedilo(v)
    localStorage.setItem('studyos-sticky', v)
  }
  return (
    <div className="kartica dash-sticky-kartica" style={{ marginBottom: 0 }}>
      <div className="dash-kartica-naslov">
        <i className="ti ti-note" style={{ color: '#F59E0B' }} /> Hitra opomba
      </div>
      <textarea
        className="dash-sticky-textarea"
        placeholder="Zapiši kar hočeš… shrani se samodejno."
        value={besedilo}
        onChange={e => shrani(e.target.value)}
      />
    </div>
  )
}

// ── Pomodoro tedenski graf ────────────────────────────────────────────────────
function PomodoroGraf() {
  const sesije = (() => {
    try { return JSON.parse(localStorage.getItem('studyos-pomo-sesije') || '[]') } catch { return [] }
  })()

  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const DNI_KR = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']

  const dnevi = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(danes)
    d.setDate(danes.getDate() - i)
    dnevi.push(d.toISOString().slice(0, 10))
  }

  const minutePoDnevu = {}
  dnevi.forEach(d => { minutePoDnevu[d] = 0 })
  sesije.forEach(s => {
    if (s.tip !== 'fokus') return
    const d = new Date(s.zacetek).toISOString().slice(0, 10)
    if (d in minutePoDnevu) minutePoDnevu[d] += (s.trajanje || 0)
  })

  const maxMin = Math.max(1, ...Object.values(minutePoDnevu))
  const skupajMin = Object.values(minutePoDnevu).reduce((a, b) => a + b, 0)

  return (
    <div className="kartica">
      <div className="dash-kartica-naslov" style={{ justifyContent: 'space-between' }}>
        <span><i className="ti ti-chart-bar" style={{ color: '#3B82F6' }} /> Fokus — zadnjih 7 dni</span>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--besedilo3)' }}>
          {skupajMin} min skupaj
        </span>
      </div>
      <div className="pomo-graf">
        {dnevi.map(d => {
          const min = minutePoDnevu[d] || 0
          const dayNum = new Date(d).getDay()
          const kratko = DNI_KR[dayNum === 0 ? 6 : dayNum - 1]
          const jeDanes = d === danes.toISOString().slice(0, 10)
          const h = Math.max(4, Math.round((min / maxMin) * 80))
          return (
            <div key={d} className="pomo-graf-stolpec">
              {min > 0 && <div className="pomo-graf-vrednost">{min}</div>}
              <div
                className="pomo-graf-palica"
                style={{
                  height: h,
                  background: jeDanes ? '#3B82F6' : '#3B82F6aa',
                  border: jeDanes ? '2px solid #1D4ED8' : 'none',
                }}
                title={`${d}: ${min} min fokusa`}
              />
              <div className="pomo-graf-oznaka" style={{ color: jeDanes ? 'var(--modra)' : 'var(--besedilo3)', fontWeight: jeDanes ? 700 : 400 }}>
                {kratko}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Fokus seznam za danes ─────────────────────────────────────────────────────
function FokusSeznam() {
  const danes = new Date().toISOString().slice(0, 10)
  const KLJUC = `studyos-danes-${danes}`

  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KLJUC) || '[]') } catch { return [] }
  })
  const [vhod, setVhod] = useState('')

  function shrani(novi) {
    setItems(novi)
    try { localStorage.setItem(KLJUC, JSON.stringify(novi)) } catch {}
  }

  function dodaj(e) {
    e.preventDefault()
    if (!vhod.trim()) return
    shrani([...items, { id: Date.now(), besedilo: vhod.trim(), opravljeno: false }])
    setVhod('')
  }

  function preklopi(id) { shrani(items.map(n => n.id === id ? { ...n, opravljeno: !n.opravljeno } : n)) }
  function izbrisi(id)  { shrani(items.filter(n => n.id !== id)) }

  const opravljenih = items.filter(n => n.opravljeno).length

  return (
    <div className="kartica" style={{ marginBottom: 0 }}>
      <div className="dash-kartica-naslov" style={{ justifyContent: 'space-between' }}>
        <span><i className="ti ti-list-check" style={{ color: '#22C55E' }} /> Danes naredim</span>
        {items.length > 0 && (
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--besedilo3)' }}>
            {opravljenih}/{items.length}
          </span>
        )}
      </div>
      <form onSubmit={dodaj} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          className="vhod"
          style={{ flex: 1, fontSize: '0.875rem', padding: '8px 12px' }}
          placeholder="Dodaj nalogo za danes…"
          value={vhod}
          onChange={e => setVhod(e.target.value)}
        />
        <button type="submit" className="gumb gumb-primarni" style={{ padding: '8px 14px', flexShrink: 0 }}>
          <i className="ti ti-plus" />
        </button>
      </form>
      {items.length === 0 ? (
        <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem', fontStyle: 'italic' }}>Danes ni nalog. Dodaj kaj!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '6px 0', borderBottom: '1px solid var(--rob)',
            }}>
              <button
                className={`naloga-krogec ${n.opravljeno ? 'oznacen' : ''}`}
                style={{ width: 18, height: 18, flexShrink: 0 }}
                onClick={() => preklopi(n.id)}
              >
                {n.opravljeno && <i className="ti ti-check" style={{ fontSize: '0.65rem', color: '#fff' }} />}
              </button>
              <span style={{
                fontSize: '0.875rem', flex: 1,
                textDecoration: n.opravljeno ? 'line-through' : 'none',
                opacity: n.opravljeno ? 0.5 : 1, color: 'var(--besedilo1)',
              }}>
                {n.besedilo}
              </span>
              <button
                className="gumb-ikona"
                style={{ width: 22, height: 22, color: 'var(--rdeca)' }}
                onClick={() => izbrisi(n.id)}
              >
                <i className="ti ti-x" style={{ fontSize: '0.65rem' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Napredek predmetov (SVG rings) ────────────────────────────────────────────
function NapredekPredmetov({ predmeti, zapiski, naloge }) {
  const aktivni = predmeti.filter(p =>
    zapiski.some(z => z.predmet === p.id) || naloge.some(n => n.predmet === p.id)
  )
  if (aktivni.length === 0) return null

  return (
    <div className="kartica">
      <div className="dash-kartica-naslov">
        <i className="ti ti-circle-check" style={{ color: 'var(--modra)' }} /> Napredek predmetov
      </div>
      <div className="napredek-mrezica">
        {aktivni.map(p => {
          const pN = naloge.filter(n => n.predmet === p.id)
          const pO = pN.filter(n => n.opravljeno)
          const pct = pN.length > 0 ? Math.round(pO.length / pN.length * 100) : 0
          const pZ = zapiski.filter(z => z.predmet === p.id).length
          const r = 22
          const circ = 2 * Math.PI * r
          const dash = (pct / 100) * circ
          return (
            <div key={p.id} className="napredek-ring-okvir">
              <svg width={58} height={58} viewBox="0 0 58 58">
                <circle cx={29} cy={29} r={r} fill="none" stroke="var(--ozadje3)" strokeWidth={5} />
                {pN.length > 0 && (
                  <circle
                    cx={29} cy={29} r={r} fill="none"
                    stroke={p.barva} strokeWidth={5}
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeLinecap="round"
                    transform="rotate(-90 29 29)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                )}
                <text x="29" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={p.barva}>
                  {pN.length > 0 ? `${pct}%` : pZ}
                </text>
              </svg>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center', color: 'var(--besedilo2)', marginTop: 4 }}>
                {p.ikona} {p.ime.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--besedilo3)', textAlign: 'center' }}>
                {pZ > 0 && `${pZ} zap.`}{pZ > 0 && pN.length > 0 && ' · '}{pN.length > 0 && `${pO.length}/${pN.length} nal.`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Widget konfiguracija panel ────────────────────────────────────────────────
function DashNastavi({ widgeti, onSprememba, onZapri }) {
  return (
    <div className="dash-nastavi-okvir">
      <div className="dash-nastavi-glava">
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
          <i className="ti ti-layout-grid" style={{ marginRight: 6 }} />Prikaži razdelke
        </span>
        <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
      </div>
      <div className="dash-nastavi-seznam">
        {Object.entries(WIDGET_IMENA).map(([k, ime]) => (
          <label key={k} className="dash-nastavi-vnos">
            <input
              type="checkbox"
              checked={!!widgeti[k]}
              onChange={() => onSprememba({ ...widgeti, [k]: !widgeti[k] })}
            />
            <span>{ime}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Habit Tracker ─────────────────────────────────────────────────────────────
const NAVADE_SEZNAM = [
  { id: 'ucenje',  ime: 'Učil sem se',       ikona: '📚' },
  { id: 'zapiski', ime: 'Ponovil zapiske',    ikona: '📝' },
  { id: 'naloge',  ime: 'Rešil naloge',       ikona: '✅' },
  { id: 'branje',  ime: 'Prebral gradivo',    ikona: '📖' },
  { id: 'vadba',   ime: 'Gibanje / sprehod',  ikona: '🏃' },
]

function HabitTracker() {
  const danes = new Date().toISOString().slice(0, 10)

  const [stanje, setStanje] = useState(() => {
    try {
      const vse = JSON.parse(localStorage.getItem('studyos-navade') || '{}')
      return vse[danes] || {}
    } catch { return {} }
  })

  function preklopi(id) {
    setStanje(prev => {
      const novo = { ...prev, [id]: !prev[id] }
      try {
        const vse = JSON.parse(localStorage.getItem('studyos-navade') || '{}')
        vse[danes] = novo
        // Ohrani samo zadnjih 30 dni
        const kljuci = Object.keys(vse).sort().slice(-30)
        const ocisceno = Object.fromEntries(kljuci.map(k => [k, vse[k]]))
        localStorage.setItem('studyos-navade', JSON.stringify(ocisceno))
      } catch {}
      return novo
    })
  }

  const opravljenih = NAVADE_SEZNAM.filter(n => stanje[n.id]).length
  const vseh = NAVADE_SEZNAM.length
  const odstotek = Math.round((opravljenih / vseh) * 100)

  return (
    <div className="kartica">
      <div className="dash-kartica-naslov">
        <i className="ti ti-checklist" style={{ color: 'var(--zelena)' }} />
        Dnevne navade
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
          {opravljenih}/{vseh}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--ozadje3)', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, transition: 'width 0.4s ease',
          width: `${odstotek}%`,
          background: opravljenih === vseh ? 'var(--zelena)' : 'var(--modra)',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {NAVADE_SEZNAM.map(n => {
          const done = !!stanje[n.id]
          return (
            <button
              key={n.id}
              onClick={() => preklopi(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: done
                  ? 'color-mix(in srgb, var(--zelena) 12%, var(--ozadje2))'
                  : 'var(--ozadje2)',
                textAlign: 'left', fontFamily: 'inherit',
                borderLeft: `3px solid ${done ? 'var(--zelena)' : 'var(--rob)'}`,
                transition: 'all 0.18s ease',
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{n.ikona}</span>
              <span style={{
                flex: 1, fontSize: '0.85rem', color: 'var(--besedilo1)',
                textDecoration: done ? 'line-through' : 'none',
                opacity: done ? 0.55 : 1, transition: 'all 0.18s',
              }}>
                {n.ime}
              </span>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${done ? 'var(--zelena)' : 'var(--rob)'}`,
                background: done ? 'var(--zelena)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
              }}>
                {done && <i className="ti ti-check" style={{ fontSize: '0.65rem', color: 'white' }} />}
              </div>
            </button>
          )
        })}
      </div>

      {opravljenih === vseh && (
        <div style={{
          textAlign: 'center', padding: '10px 0 2px',
          fontSize: '0.85rem', color: 'var(--zelena)', fontWeight: 600,
        }}>
          🎉 Odličen dan — vse navade opravljene!
        </div>
      )}
    </div>
  )
}

// ── Sticky Notes ─────────────────────────────────────────────────────────────
const STICKY_KLJUC = 'studyos-sticky-notes'
const STICKY_BARVE = ['#FEF08A','#BBF7D0','#BAE6FD','#FCA5A5','#DDD6FE','#FED7AA']

function beriSticky() { try { return JSON.parse(localStorage.getItem(STICKY_KLJUC) || '[]') } catch { return [] } }

function StickyNotes() {
  const [notes,    setNotes]    = useState(beriSticky)
  const [nov,      setNov]      = useState('')
  const [novBarva, setNovBarva] = useState(STICKY_BARVE[0])
  const [urediId,  setUrediId]  = useState(null)
  const [urediTxt, setUrediTxt] = useState('')

  function shrani(seznam) { setNotes(seznam); try { localStorage.setItem(STICKY_KLJUC, JSON.stringify(seznam)) } catch {} }

  function dodaj() {
    if (!nov.trim()) return
    shrani([...notes, { id: Date.now(), besedilo: nov.trim(), barva: novBarva, ustvarjen: new Date().toISOString() }])
    setNov('')
  }

  function izbrisi(id) { shrani(notes.filter(n => n.id !== id)) }

  function shraniUredi(id) {
    shrani(notes.map(n => n.id === id ? { ...n, besedilo: urediTxt } : n))
    setUrediId(null)
  }

  return (
    <div className="kartica">
      <div className="dash-kartica-naslov">
        <i className="ti ti-notes" style={{ color: '#F59E0B' }} /> Sticky Notes
      </div>

      {/* Vhod za novo */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'flex-start' }}>
        <textarea
          className="vhod"
          rows={2}
          placeholder="Dodaj opomnik…"
          value={nov}
          onChange={e => setNov(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), dodaj())}
          style={{ flex:1, resize:'none', fontSize:'0.85rem' }}
        />
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', width:80 }}>
            {STICKY_BARVE.map(b => (
              <button key={b} onClick={() => setNovBarva(b)} style={{
                width:18, height:18, borderRadius:'50%', background:b,
                border: novBarva === b ? '2px solid var(--besedilo1)' : '1.5px solid transparent',
                cursor:'pointer', padding:0,
              }} />
            ))}
          </div>
          <button className="gumb gumb-primarni" style={{ padding:'6px 10px', fontSize:'0.8rem' }} onClick={dodaj}>
            <i className="ti ti-plus" />
          </button>
        </div>
      </div>

      {/* Prikaz */}
      {notes.length === 0 ? (
        <p style={{ color:'var(--besedilo3)', fontSize:'0.82rem', fontStyle:'italic' }}>Ni opomnikov.</p>
      ) : (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {notes.map(n => (
            <div key={n.id} style={{
              background:n.barva, borderRadius:8, padding:'10px 12px',
              minWidth:120, maxWidth:200, flex:'1 1 120px',
              position:'relative', boxShadow:'2px 2px 6px rgba(0,0,0,0.12)',
            }}>
              {urediId === n.id ? (
                <>
                  <textarea autoFocus rows={3} value={urediTxt} onChange={e => setUrediTxt(e.target.value)}
                    style={{ width:'100%', background:'transparent', border:'none', resize:'none', fontSize:'0.82rem', color:'#1e293b', outline:'none', fontFamily:'inherit' }} />
                  <div style={{ display:'flex', gap:4, marginTop:4 }}>
                    <button onClick={() => shraniUredi(n.id)} style={{ fontSize:'0.7rem', background:'#00000020', border:'none', borderRadius:4, padding:'2px 8px', cursor:'pointer' }}>Shrani</button>
                    <button onClick={() => setUrediId(null)} style={{ fontSize:'0.7rem', background:'transparent', border:'none', cursor:'pointer', color:'#64748b' }}>✕</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize:'0.82rem', color:'#1e293b', margin:0, whiteSpace:'pre-wrap', lineHeight:1.4 }}>{n.besedilo}</p>
                  <div style={{ display:'flex', gap:4, marginTop:6, justifyContent:'flex-end' }}>
                    <button onClick={() => { setUrediId(n.id); setUrediTxt(n.besedilo) }} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'0.7rem', color:'#64748b' }}>
                      <i className="ti ti-edit" />
                    </button>
                    <button onClick={() => izbrisi(n.id)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'0.7rem', color:'#ef4444' }}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AI Povzetek dneva ─────────────────────────────────────────────────────────
const AI_POV_KLJUC = 'studyos-ai-povzetek-danes'

function AIPovzetekDneva({ naloge, urnik }) {
  const [besedilo, setBesedilo] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(AI_POV_KLJUC) || 'null')
      if (s && s.datum === new Date().toISOString().slice(0, 10)) return s.tekst
    } catch {}
    return null
  })
  const [nalaga, setNalaga] = useState(false)

  async function generiraj() {
    setNalaga(true)
    try {
      const danes = new Date().toISOString().slice(0, 10)
      const dnevUrnike = urnik.filter(u => {
        const dn = ['ponedeljek','torek','sreda','četrtek','petek','sobota','nedelja']
        return u.dan === dn[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
      })
      const dnevNaloge = naloge.filter(n => !n.opravljeno && n.rok && n.rok.slice(0,10) <= danes)
      const aktivneNaloge = naloge.filter(n => !n.opravljeno).slice(0, 5)

      const prompt = `Danes je ${new Date().toLocaleDateString('sl-SI', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}.

Urnik danes: ${dnevUrnike.length > 0 ? dnevUrnike.map(u => `${u.ura}:00 ${u.naslov || u.predmet}`).join(', ') : 'ni ur'}
Zamujene naloge: ${dnevNaloge.map(n => n.besedilo).join(', ') || 'ni'}
Aktivne naloge: ${aktivneNaloge.map(n => `${n.besedilo}${n.rok ? ` (rok: ${n.rok.slice(0,10)})` : ''}`).join(', ') || 'ni'}

Napiši kratek, motivacijski povzetek dneva v 3–4 stavkih. Poudari kaj je nujno danes. Bodi konkreten in pozitiven.`

      const odgovor = await aiRazgovor(null, [{ role:'user', content: prompt }])
      setBesedilo(odgovor)
      try { localStorage.setItem(AI_POV_KLJUC, JSON.stringify({ datum: danes, tekst: odgovor })) } catch {}
    } catch (e) {
      setBesedilo(`Napaka: ${e.message}`)
    }
    setNalaga(false)
  }

  return (
    <div className="kartica" style={{ borderLeft:'3px solid var(--modra)' }}>
      <div className="dash-kartica-naslov" style={{ justifyContent:'space-between' }}>
        <span><i className="ti ti-sparkles" style={{ color:'var(--modra)' }} /> AI povzetek dneva</span>
        <button
          className="gumb gumb-sekundarni"
          style={{ padding:'5px 12px', fontSize:'0.78rem' }}
          onClick={generiraj}
          disabled={nalaga}
        >
          {nalaga
            ? <><div className="nalagalnik" style={{ width:12, height:12, borderWidth:2 }} /> Generiram…</>
            : <><i className="ti ti-refresh" /> {besedilo ? 'Osveži' : 'Generiraj'}</>
          }
        </button>
      </div>
      {besedilo ? (
        <p style={{ fontSize:'0.875rem', lineHeight:1.65, color:'var(--besedilo1)', margin:0 }}>{besedilo}</p>
      ) : (
        <p style={{ color:'var(--besedilo3)', fontSize:'0.85rem', fontStyle:'italic' }}>
          Klikni "Generiraj" za AI povzetek tvojega dneva na podlagi urnika in nalog.
        </p>
      )}
    </div>
  )
}

// ── Glavna stran ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { aktivniPredmet, setStran, predmeti } = useApp()
  const [zapiski,  setZapiski]  = useState([])
  const [naloge,   setNaloge]   = useState([])
  const [dogodki,  setDogodki]  = useState([])
  const [nalaga,   setNalaga]   = useState(true)
  const [widgeti,  setWidgeti]  = useState(beriWidgete)
  const [nastaviOdprt, setNastaviOdprt] = useState(false)

  useEffect(() => { belezidanes() }, [])

  useEffect(() => {
    Promise.all([pridobiZapiske(), pridobiNaloge(), pridobiUrnik()])
      .then(([z, n, u]) => { setZapiski(z); setNaloge(n); setDogodki(u) })
      .finally(() => setNalaga(false))
  }, [])

  // Brskalniška obvestila za roke
  useEffect(() => {
    if (!naloge.length) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const danes = new Date(); danes.setHours(0, 0, 0, 0)
    naloge
      .filter(n => !n.opravljeno && n.rok)
      .forEach(n => {
        const rok = new Date(n.rok); rok.setHours(0, 0, 0, 0)
        const diff = Math.round((rok - danes) / 86400000)
        const kljuc = `studyos-obv-${n._id}-${danes.toISOString().slice(0, 10)}`
        if (localStorage.getItem(kljuc)) return
        if (diff === 0 || diff === 1) {
          localStorage.setItem(kljuc, '1')
          const kdaj = diff === 0 ? 'danes' : 'jutri'
          new Notification('📚 Rok za nalogo!', { body: `"${n.besedilo}" — rok je ${kdaj}!` })
        }
      })
  }, [naloge])

  function shraniWidgete(w) { setWidgeti(w); hraniWidgete(w) }

  async function preklopi(naloga) {
    const pos = await preklopiOpravljenost(naloga._id, !naloga.opravljeno)
    if (pos) setNaloge(ns => ns.map(n => n._id === pos._id ? pos : n))
  }

  if (nalaga) return <div className="nalagalnik" />

  const streak = izracunajStreak()
  const skupajZapiskov  = zapiski.length
  const opravljenih     = naloge.filter(n => n.opravljeno).length
  const neopravljenih   = naloge.filter(n => !n.opravljeno).length
  const danesDan        = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const danasnjiDogodki = dogodki.filter(d => d.dan === danesDan)
  const aktivniPredmeti = [...new Set(dogodki.map(d => d.predmet).filter(Boolean))].length

  const aktivneNaloge = naloge
    .filter(n => !n.opravljeno)
    .sort((a, b) => PRIORITETA_VRSTNI_RED[a.prioriteta] - PRIORITETA_VRSTNI_RED[b.prioriteta])
    .slice(0, 6)

  const zadnjiZapisekId = localStorage.getItem('studyos-zadnji-zapisek')
  const zadnjiZapisek   = zapiski.find(z => z._id === zadnjiZapisekId) || zapiski[0]

  const naslednjRok = naloge
    .filter(n => !n.opravljeno && n.rok)
    .map(n => ({ ...n, msRok: new Date(n.rok).getTime() }))
    .sort((a, b) => a.msRok - b.msRok)[0]

  const predmetStatistike = predmeti
    .map(p => ({
      ...p,
      zapiskov: zapiski.filter(z => z.predmet === p.id).length,
      nalog:    naloge.filter(n => n.predmet === p.id && !n.opravljeno).length,
      ur:       dogodki.filter(d => d.predmet === p.id).length,
    }))
    .filter(p => p.zapiskov > 0 || p.nalog > 0 || p.ur > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Glava */}
      <div className="stran-glava" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
              {pozdrav()}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--mono)',
                background: 'var(--ozadje2)', border: '1px solid var(--rob)',
                borderRadius: 99, padding: '3px 12px', color: 'var(--besedilo3)',
              }}>
                <i className="ti ti-calendar" style={{ marginRight: 5 }} />
                {slovenskiDatum()}
              </span>
            </div>
          </div>
          <button
            className={`gumb-ikona ${nastaviOdprt ? 'aktiven' : ''}`}
            onClick={() => setNastaviOdprt(o => !o)}
            title="Prilagodi razdelke"
            style={{ width: 36, height: 36, marginTop: 4 }}
          >
            <i className="ti ti-layout-grid" />
          </button>
        </div>
        {nastaviOdprt && (
          <DashNastavi
            widgeti={widgeti}
            onSprememba={shraniWidgete}
            onZapri={() => setNastaviOdprt(false)}
          />
        )}
      </div>

      {/* Stat kartice */}
      <div className="stat-mrezica">
        {[
          { oznaka: 'Zapiski',         vrednost: skupajZapiskov,  pod: 'vsi predmeti',    ikona: 'ti-notebook'    },
          { oznaka: 'Opravljeno',      vrednost: opravljenih,     pod: `od ${naloge.length} nalog`, ikona: 'ti-circle-check' },
          { oznaka: 'Predmeti',        vrednost: aktivniPredmeti, pod: 'ta teden v urniku', ikona: 'ti-calendar-week' },
          { oznaka: 'V čakalni vrsti', vrednost: neopravljenih,   pod: 'aktivnih nalog',  ikona: 'ti-clock'       },
        ].map((s, i) => (
          <div key={i} className="stat-kartica" style={{ '--barva-vrha': BARVE_STAT[i] }}>
            <style>{`.stat-kartica:nth-child(${i+1})::before { background: ${BARVE_STAT[i]}; } .stat-kartica:nth-child(${i+1})::after { background: ${BARVE_STAT[i]}; }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="stat-oznaka" style={{ marginBottom: 0 }}>{s.oznaka}</span>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${BARVE_STAT[i]}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${s.ikona}`} style={{ color: BARVE_STAT[i], fontSize: '1rem' }} />
              </div>
            </div>
            <span className="stat-vrednost" style={{ color: BARVE_STAT[i] }}>{s.vrednost}</span>
            <span className="stat-podnapis">{s.pod}</span>
          </div>
        ))}
      </div>

      {/* ── Vrstica 1: Streak + Navade ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="dash-streak" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          {/* Zgoraj: število + plamen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
            <div className="dash-streak-stevilka">{streak}</div>
            <div className="dash-streak-info" style={{ flex: 1 }}>
              <div className="dash-streak-naslov">
                {streak === 0 ? 'Začni streak!' : streak === 1 ? '1 dan streak' : `${streak} dni streak`}
              </div>
              <div className="dash-streak-opis">
                {streak === 0 ? 'Odpri aplikacijo vsak dan' :
                 streak < 7  ? `${7 - streak} dni do tedenskega streaka` :
                 streak < 30 ? `${30 - streak} dni do mesečnega streaka` :
                 'Odlično! Vztrajaj! 💪'}
              </div>
            </div>
            <div className="dash-streak-plamen">
              {streak === 0 ? '💤' : streak < 7 ? '🔥' : streak < 30 ? '🔥🔥' : '🏆'}
            </div>
          </div>

          {/* 7-dnevni pregled */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--besedilo3)', marginBottom: 8 }}>
              Zadnjih 7 dni
            </div>
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0)
                const k = d.toISOString().slice(0, 10)
                const aktiven = (() => { try { return JSON.parse(localStorage.getItem('studyos-aktivni-dnevi') || '[]').includes(k) } catch { return false } })()
                const jeDanes = i === 6
                const dnKratko = ['P','T','S','Č','P','S','N'][(d.getDay() + 6) % 7]
                return (
                  <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', borderRadius: 8,
                      background: aktiven ? 'var(--rumena)' : jeDanes ? 'var(--rumena)22' : 'var(--ozadje3)',
                      border: jeDanes ? '2px solid var(--rumena)' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem',
                    }}>
                      {aktiven && <i className="ti ti-check" style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 900 }} />}
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--besedilo3)', fontWeight: jeDanes ? 700 : 400 }}>{dnKratko}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Napredek bar do naslednjega mejnika */}
          {streak > 0 && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--besedilo3)', marginBottom: 4 }}>
                <span>Napredek do {streak < 7 ? '7' : streak < 30 ? '30' : '100'} dni</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--rumena)' }}>
                  {streak}/{streak < 7 ? 7 : streak < 30 ? 30 : 100}
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--ozadje3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg, var(--rumena), #f97316)',
                  width: `${Math.min(100, (streak / (streak < 7 ? 7 : streak < 30 ? 30 : 100)) * 100)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}
        </div>
        {widgeti.navade
          ? <HabitTracker />
          : <div />
        }
      </div>

      {/* ── Vrstica 2: Rok / Hitri dostop + Nadaljuj zapisek ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {widgeti.rok && naslednjRok ? (
          <div className="kartica">
            <div className="dash-kartica-naslov">
              <i className="ti ti-alarm" style={{ color: 'var(--rdeca)' }} /> Naslednji rok
            </div>
            <OdstevalnikRoka naloga={naslednjRok} />
          </div>
        ) : (
          <div className="kartica">
            <div className="dash-kartica-naslov">
              <i className="ti ti-bolt" style={{ color: 'var(--rumena)' }} /> Hitri dostop
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { ikona: 'ti-notebook',       barva: '#3B82F6', ime: 'Nov zapisek',  stran: 'zapiski'    },
                { ikona: 'ti-check',          barva: '#22C55E', ime: 'Nova naloga',  stran: 'naloge'     },
                { ikona: 'ti-calendar-event', barva: '#8B5CF6', ime: 'Nov izpit',    stran: 'izpiti'     },
                { ikona: 'ti-clock',          barva: '#F59E0B', ime: 'Fokus timer',  stran: null, onClick: () => window.dispatchEvent(new CustomEvent('studyos:zacni-pomo')) },
              ].map((a, i) => (
                <button key={i}
                  onClick={() => a.onClick ? a.onClick() : setStran(a.stran)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    border: `1.5px solid ${a.barva}30`,
                    background: `${a.barva}0d`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${a.barva}20`; e.currentTarget.style.borderColor = `${a.barva}60` }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${a.barva}0d`; e.currentTarget.style.borderColor = `${a.barva}30` }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.barva}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${a.ikona}`} style={{ color: a.barva, fontSize: '0.9rem' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--besedilo1)', textAlign: 'left' }}>{a.ime}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {widgeti.nadaljuj && zadnjiZapisek ? (
          <div className="kartica dash-nadaljuj" style={{ cursor: 'pointer' }} onClick={() => setStran('zapiski')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: zadnjiZapisek.barvaOzadja || 'var(--modra-svetla)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--modra)', fontSize: '1.1rem', flexShrink: 0 }}>
                <i className="ti ti-notebook" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{zadnjiZapisek.naslov}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', marginTop: 2 }}>Nadaljuj tam, kjer si ostal</div>
              </div>
            </div>
            <i className="ti ti-arrow-right" style={{ color: 'var(--modra)', fontSize: '1.1rem', flexShrink: 0 }} />
          </div>
        ) : <div />}
      </div>

      {/* ── Vrstica 3: Urnik + Naloge ── */}
      {(widgeti.urnik || widgeti.naloge) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {widgeti.urnik && (
            <div className="kartica">
              <div className="dash-kartica-naslov">
                <i className="ti ti-calendar-today" style={{ color: 'var(--modra)' }} /> Današnje ure
              </div>
              {danasnjiDogodki.length === 0 ? (
                <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem' }}>
                  {danesDan <= 4 ? 'Danes ni predavanj.' : 'Vikend — uživaj! 🎉'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...danasnjiDogodki].sort((a, b) => a.ura - b.ura).map(d => (
                    <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: d.barva + '18', borderLeft: `3px solid ${d.barva}` }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--besedilo3)', minWidth: 38 }}>{d.ura}:00</span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.naslov}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {widgeti.naloge && (
            <div className="kartica">
              <div className="dash-kartica-naslov">
                <i className="ti ti-list-check" style={{ color: 'var(--modra)' }} /> Aktivne naloge
              </div>
              {aktivneNaloge.length === 0 ? (
                <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem' }}>Vse naloge so opravljene! 🎉</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {aktivneNaloge.map(n => (
                    <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: '1px solid var(--rob)' }}>
                      <button className={`naloga-krogec ${n.opravljeno ? 'oznacen' : ''}`} style={{ width: 18, height: 18 }} onClick={() => preklopi(n)}>
                        {n.opravljeno && <i className="ti ti-check" style={{ fontSize: '0.65rem', color: '#fff' }} />}
                      </button>
                      <span className={`prioriteta-pika prioriteta-${n.prioriteta}`} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--besedilo1)', flex: 1 }}>{n.besedilo}</span>
                      {n.rok && <span style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>{new Date(n.rok).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Vrstica 4: Cilji + Fokus seznam ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {widgeti.cilji && <CiljiWidget />}
        {widgeti.fokus_seznam && <FokusSeznam />}
      </div>

      {/* ── Vrstica 5: Statistike + Napredek ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {widgeti.statistike && predmetStatistike.length > 0 && (
          <div className="kartica">
            <div className="dash-kartica-naslov">
              <i className="ti ti-chart-bar" style={{ color: 'var(--modra)' }} /> Statistike po predmetih
            </div>
            <div className="predmet-stat-seznam">
              {predmetStatistike.map(p => (
                <div key={p.id} className="predmet-stat-vrstica">
                  <div className="predmet-stat-ikona" style={{ background: p.barva + '22' }}>{p.ikona}</div>
                  <span className="predmet-stat-ime">{p.ime}</span>
                  <div className="predmet-stat-numeri">
                    {p.zapiskov > 0 && <span className="predmet-stat-n" title="Zapiski"><i className="ti ti-notebook" style={{ fontSize: '0.7rem' }} /> {p.zapiskov}</span>}
                    {p.nalog > 0 && <span className="predmet-stat-n" title="Naloge"><i className="ti ti-check" style={{ fontSize: '0.7rem' }} /> {p.nalog}</span>}
                    {p.ur > 0 && <span className="predmet-stat-n" title="Ure"><i className="ti ti-calendar" style={{ fontSize: '0.7rem' }} /> {p.ur}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {widgeti.napredek_predmetov && <NapredekPredmetov predmeti={predmeti} zapiski={zapiski} naloge={naloge} />}
      </div>

      {/* ── Vrstica 6: Pomodoro graf — polna širina ── */}
      {widgeti.pomo_graf && <PomodoroGraf />}

      {/* ── Vrstica 7: Aktivnost heatmap — polna širina ── */}
      {widgeti.aktivnost && (
        <div className="kartica">
          <div className="dash-kartica-naslov">
            <i className="ti ti-activity" style={{ color: 'var(--modra)' }} /> Aktivnost — zadnjih 10 tednov
          </div>
          <AktivnostMreza zapiski={zapiski} naloge={naloge} />
        </div>
      )}

      {/* ── Vrstica 8: Sticky + AI povzetek ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <StickyNotes />
        <AIPovzetekDneva naloge={naloge} urnik={dogodki} />
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
