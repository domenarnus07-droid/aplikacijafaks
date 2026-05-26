import { useState, useRef } from 'react'
import { prikaziObvestilo } from '../toast.js'
import { useApp, PREDMETI_PRIVZETI } from '../App.jsx'
import {
  pridobiZapiske, pridobiNaloge, pridobiUrnik,
  ustvariZapisek, ustvariNalogo,
} from '../api.js'

// ── Upravljanje predmetov ─────────────────────────────────────────────────────
function PredmetiUpravljanje({ predmeti, onShrani }) {
  const [noviIme,   setNoviIme]   = useState('')
  const [noviIkona, setNoviIkona] = useState('📚')
  const [noviBarva, setNoviBarva] = useState('#2563EB')
  const [uredi,     setUredi]     = useState(null)  // id ki se ureja

  function dodaj() {
    if (!noviIme.trim()) { prikaziObvestilo('Vnesi ime predmeta', 'napaka'); return }
    const id = noviIme.trim().toLowerCase()
      .replace(/[čšžćđ]/g, c => ({ č:'c',š:'s',ž:'z',ć:'c',đ:'d' }[c] || c))
      .replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
    onShrani([...predmeti, { id, ime: noviIme.trim(), ikona: noviIkona, barva: noviBarva }])
    setNoviIme(''); setNoviIkona('📚'); setNoviBarva('#2563EB')
    prikaziObvestilo('Predmet dodan', 'uspeh')
  }

  function izbrisi(id) {
    if (!confirm('Izbriši ta predmet?')) return
    onShrani(predmeti.filter(p => p.id !== id))
    prikaziObvestilo('Predmet izbrisan', 'uspeh')
  }

  function shraniUredi(id, ime, ikona, barva) {
    onShrani(predmeti.map(p => p.id === id ? { ...p, ime, ikona, barva } : p))
    setUredi(null)
    prikaziObvestilo('Predmet posodobljen', 'uspeh')
  }

  function ponastavi() {
    if (!confirm('Ponastavi predmete na privzete (IPT seznam)?')) return
    onShrani(PREDMETI_PRIVZETI)
    prikaziObvestilo('Predmeti ponastavljeni', 'info')
  }

  return (
    <div>
      {/* Obstoječi predmeti */}
      {predmeti.map(p => (
        <div key={p.id} style={{ borderBottom: '1px solid var(--rob)' }}>
          {uredi === p.id
            ? <UrejanjeVrstice p={p} onShrani={shraniUredi} onPreklic={() => setUredi(null)} />
            : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px' }}>
                <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center' }}>{p.ikona}</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem' }}>{p.ime}</span>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: p.barva, flexShrink: 0,
                  border: '2px solid var(--rob)',
                }} />
                <button className="gumb-ikona" onClick={() => setUredi(p.id)} title="Uredi">
                  <i className="ti ti-edit" />
                </button>
                <button className="gumb-ikona rdeca" onClick={() => izbrisi(p.id)} title="Izbriši">
                  <i className="ti ti-trash" />
                </button>
              </div>
            )
          }
        </div>
      ))}

      {/* Dodaj novega */}
      <div style={{ padding: '16px 24px', background: 'var(--ozadje2)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--besedilo3)', marginBottom: 10 }}>
          Dodaj nov predmet
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="vhod"
            style={{ width: 56, textAlign: 'center', fontSize: '1.2rem', padding: '8px 4px' }}
            value={noviIkona}
            onChange={e => setNoviIkona(e.target.value)}
            placeholder="📚"
            title="Emoji ikona"
          />
          <input
            className="vhod"
            style={{ flex: 1, minWidth: 120 }}
            placeholder="Ime predmeta…"
            value={noviIme}
            onChange={e => setNoviIme(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && dodaj()}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--besedilo3)' }}>Barva:</label>
            <input
              type="color"
              value={noviBarva}
              onChange={e => setNoviBarva(e.target.value)}
              style={{ width: 36, height: 36, padding: 2, borderRadius: 6, border: '1.5px solid var(--rob)', cursor: 'pointer', background: 'none' }}
            />
          </div>
          <button className="gumb gumb-primarni" style={{ padding: '9px 18px' }} onClick={dodaj}>
            <i className="ti ti-plus" /> Dodaj
          </button>
        </div>
      </div>

      {/* Ponastavi */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--rob)' }}>
        <button
          style={{ fontSize: '0.78rem', color: 'var(--besedilo3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={ponastavi}
        >
          <i className="ti ti-refresh" /> Ponastavi na privzete (IPT)
        </button>
      </div>
    </div>
  )
}

function UrejanjeVrstice({ p, onShrani, onPreklic }) {
  const [ime,   setIme]   = useState(p.ime)
  const [ikona, setIkona] = useState(p.ikona)
  const [barva, setBarva] = useState(p.barva)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'var(--ozadje2)' }}>
      <input
        className="vhod"
        style={{ width: 50, textAlign: 'center', fontSize: '1.1rem', padding: '6px 4px' }}
        value={ikona}
        onChange={e => setIkona(e.target.value)}
      />
      <input
        className="vhod"
        style={{ flex: 1 }}
        value={ime}
        onChange={e => setIme(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onShrani(p.id, ime, ikona, barva)}
        autoFocus
      />
      <input
        type="color"
        value={barva}
        onChange={e => setBarva(e.target.value)}
        style={{ width: 34, height: 34, padding: 2, borderRadius: 6, border: '1.5px solid var(--rob)', cursor: 'pointer', background: 'none' }}
      />
      <button className="gumb gumb-primarni" style={{ padding: '7px 14px', fontSize: '0.82rem' }}
        onClick={() => onShrani(p.id, ime, ikona, barva)}>
        Shrani
      </button>
      <button className="gumb gumb-sekundarni" style={{ padding: '7px 12px', fontSize: '0.82rem' }}
        onClick={onPreklic}>
        Prekliči
      </button>
    </div>
  )
}

// ── Pomodoro nastavitve ───────────────────────────────────────────────────────
const POMO_KLJUC = 'studyos-pomo-casi'

function beriPomoCase() {
  try {
    const s = localStorage.getItem(POMO_KLJUC)
    if (s) return JSON.parse(s)
  } catch {}
  return { delo: 25, odmor: 5, dolgi: 15 }
}

function PomodoroNastavitve() {
  const [casi, setCasi] = useState(beriPomoCase)

  function set(k, v) {
    const val = Math.max(1, Math.min(120, parseInt(v) || 1))
    const novi = { ...casi, [k]: val }
    setCasi(novi)
    localStorage.setItem(POMO_KLJUC, JSON.stringify(novi))
    prikaziObvestilo('Pomodoro časi shranjeni', 'uspeh')
  }

  const vrstice = [
    { k: 'delo',  oznaka: 'Čas fokusa',        ikona: '🎯', barva: '#3B82F6' },
    { k: 'odmor', oznaka: 'Kratki odmor',       ikona: '☕', barva: '#22C55E' },
    { k: 'dolgi', oznaka: 'Dolgi odmor (vsak 4.)', ikona: '🛋️', barva: '#8B5CF6' },
  ]

  return (
    <>
      {vrstice.map(v => (
        <Vrstica
          key={v.k}
          opis={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{v.ikona} {v.oznaka}</span>}
          podnapis="Čas v minutah"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="gumb gumb-sekundarni"
              style={{ padding: '8px 12px', fontSize: '1rem', lineHeight: 1 }}
              onClick={() => set(v.k, casi[v.k] - 5)}
            >−</button>
            <input
              className="vhod"
              type="number"
              min={1} max={120}
              value={casi[v.k]}
              onChange={e => set(v.k, e.target.value)}
              style={{ width: 70, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 700, color: v.barva }}
            />
            <button
              className="gumb gumb-sekundarni"
              style={{ padding: '8px 12px', fontSize: '1rem', lineHeight: 1 }}
              onClick={() => set(v.k, casi[v.k] + 5)}
            >+</button>
            <span style={{ fontSize: '0.8rem', color: 'var(--besedilo3)' }}>min</span>
          </div>
        </Vrstica>
      ))}
    </>
  )
}

// ── Glavna stran ──────────────────────────────────────────────────────────────
const BARVE_AKCENTA = [
  { barva: '#2563EB', ime: 'Modra (privzeto)' },
  { barva: '#7C3AED', ime: 'Vijolična' },
  { barva: '#059669', ime: 'Zelena' },
  { barva: '#DC2626', ime: 'Rdeča' },
  { barva: '#D97706', ime: 'Oranžna' },
  { barva: '#DB2777', ime: 'Roza' },
  { barva: '#0891B2', ime: 'Cianova' },
]

export default function Nastavitve() {
  const { temno, setTemno, predmeti, shraniPredmete, barvaAkcent, setBarvaAkcent } = useApp()

  const [ime,       setIme]       = useState(() => localStorage.getItem('studyos-ime') || '')
  const [shranjeno, setShranjeno] = useState(false)
  const [aiKljuc,   setAiKljuc]   = useState(() => localStorage.getItem('studyos-ai-kljuc') || '')
  const [aiShranjen, setAiShranjen] = useState(false)
  const [uvazam,    setUvazam]    = useState(false)
  const [obvestilaDovoljenja, setObvestilaDovoljenja] = useState(
    () => typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const uvozInputRef = useRef(null)

  function shraniIme() {
    localStorage.setItem('studyos-ime', ime.trim())
    setShranjeno(true)
    prikaziObvestilo('Ime shranjeno', 'uspeh')
    setTimeout(() => setShranjeno(false), 2500)
  }

  function shraniAiKljuc() {
    localStorage.setItem('studyos-ai-kljuc', aiKljuc.trim())
    setAiShranjen(true)
    prikaziObvestilo('AI API ključ shranjen', 'uspeh')
    setTimeout(() => setAiShranjen(false), 2500)
  }

  function ponastavi() {
    if (!confirm('Res želiš ponastaviti vse lokalne nastavitve? Podatki v bazi ostanejo.')) return
    localStorage.removeItem('studyos-ime')
    localStorage.removeItem('studyos-tema')
    localStorage.removeItem('studyos-zadnji-zapisek')
    localStorage.removeItem('studyos-privzeti-predmet')
    setIme(''); setTemno(false)
    prikaziObvestilo('Nastavitve ponastavljene', 'info')
  }

  async function izvozi() {
    try {
      prikaziObvestilo('Pripravljam backup…', 'info')
      const [z, n, u] = await Promise.all([pridobiZapiske(), pridobiNaloge(), pridobiUrnik()])
      const podatki = { verzija: '2.0', datum: new Date().toISOString(), zapiski: z, naloge: n, urnik: u }
      const blob = new Blob([JSON.stringify(podatki, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `studyos-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      prikaziObvestilo(`Backup izvožen (${z.length} zapiskov, ${n.length} nalog)`, 'uspeh')
    } catch { prikaziObvestilo('Napaka pri izvozu', 'napaka') }
  }

  async function zaprosiObvestila() {
    if (typeof Notification === 'undefined') {
      prikaziObvestilo('Brskalnik ne podpira obvestil', 'napaka'); return
    }
    const perm = await Notification.requestPermission()
    setObvestilaDovoljenja(perm)
    if (perm === 'granted') {
      prikaziObvestilo('Brskalniška obvestila dovoljena! 🔔', 'uspeh')
      new Notification('StudyOS 🎓', { body: 'Obvestila so aktivirana! Obvestili te bomo o rokih nalog.' })
    } else {
      prikaziObvestilo('Obvestila niso dovoljena', 'napaka')
    }
  }

  async function uvozi(e) {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    if (!confirm(`Uvozi podatke iz "${file.name}"?`)) return
    setUvazam(true)
    try {
      const podatki = JSON.parse(await file.text())
      let z = 0, n = 0
      for (const zapis of (podatki.zapiski || [])) {
        const { _id, __v, ustvarjen, posodobljen, ...rest } = zapis
        if (await ustvariZapisek(rest)) z++
      }
      for (const naloga of (podatki.naloge || [])) {
        const { _id, __v, ustvarjena, ...rest } = naloga
        if (await ustvariNalogo(rest)) n++
      }
      prikaziObvestilo(`Uvoženo: ${z} zapiskov, ${n} nalog`, 'uspeh')
    } catch { prikaziObvestilo('Napaka — napačna datoteka?', 'napaka') }
    finally { setUvazam(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>

      <div style={{ width: '100%', maxWidth: 720, marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Nastavitve</h1>
        <p style={{ color: 'var(--besedilo3)', fontSize: '0.9rem', marginTop: 4 }}>
          Prilagodi StudyOS po svojih željah
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Profil */}
        <Sekcija naslov="👤  Profil">
          <Vrstica opis="Ime" podnapis="Prikazano v pozdravu na nadzorni plošči">
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="vhod"
                style={{ width: 200, fontSize: '0.95rem', padding: '10px 14px' }}
                value={ime}
                onChange={e => setIme(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && shraniIme()}
                placeholder="Tvoje ime…"
              />
              <button className="gumb gumb-primarni" style={{ padding: '10px 20px' }} onClick={shraniIme}>
                {shranjeno ? '✓' : 'Shrani'}
              </button>
            </div>
          </Vrstica>
        </Sekcija>

        {/* AI asistent */}
        <Sekcija naslov="🤖  AI asistent — Anthropic Claude">
          <Vrstica
            opis="Anthropic API ključ"
            podnapis="Potreben za ✨ Povzemi funkcijo v zapiskih. Ključ se shrani lokalno."
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="vhod"
                type="password"
                style={{ width: 240, fontSize: '0.9rem', fontFamily: 'var(--mono)' }}
                value={aiKljuc}
                onChange={e => setAiKljuc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && shraniAiKljuc()}
                placeholder="sk-ant-…"
              />
              <button className="gumb gumb-primarni" style={{ padding: '10px 20px' }} onClick={shraniAiKljuc}>
                {aiShranjen ? '✓ Shranjeno' : 'Shrani'}
              </button>
            </div>
          </Vrstica>
          {aiKljuc && (
            <Vrstica opis="Status" podnapis="Ključ je shranjen v brskalniku">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--zelena)' }}>
                <i className="ti ti-circle-check" /> Ključ nastavljen
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rdeca)', fontSize: '0.78rem' }}
                  onClick={() => { localStorage.removeItem('studyos-ai-kljuc'); setAiKljuc(''); prikaziObvestilo('AI ključ izbrisan', 'info') }}
                >
                  <i className="ti ti-trash" /> Izbriši
                </button>
              </div>
            </Vrstica>
          )}
        </Sekcija>

        {/* Predmeti */}
        <Sekcija naslov="📚  Predmeti — upravljaj sam">
          <PredmetiUpravljanje predmeti={predmeti} onShrani={shraniPredmete} />
        </Sekcija>

        {/* Pomodoro */}
        <Sekcija naslov="⏱️  Pomodoro timer — časi">
          <PomodoroNastavitve />
        </Sekcija>

        {/* Obvestila */}
        <Sekcija naslov="🔔  Brskalniška obvestila">
          <Vrstica
            opis="Obvestila o rokih"
            podnapis="Dobi obvestilo dan pred rokom oddaje naloge"
          >
            {obvestilaDovoljenja === 'granted' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.85rem', color: 'var(--zelena)', fontWeight: 600,
                }}>
                  <i className="ti ti-circle-check" /> Dovoljeno
                </span>
                <button
                  className="gumb gumb-sekundarni"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  onClick={() => {
                    new Notification('StudyOS 🎓', { body: 'To je testno obvestilo!' })
                    prikaziObvestilo('Testno obvestilo poslano', 'info')
                  }}
                >
                  <i className="ti ti-bell" /> Testiraj
                </button>
              </div>
            ) : obvestilaDovoljenja === 'denied' ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--rdeca)' }}>
                <i className="ti ti-ban" /> Zavrnjeno — dovoli v nastavitvah brskalnika
              </div>
            ) : (
              <button
                className="gumb gumb-primarni"
                style={{ padding: '10px 20px' }}
                onClick={zaprosiObvestila}
              >
                <i className="ti ti-bell" /> Dovoli obvestila
              </button>
            )}
          </Vrstica>
        </Sekcija>

        {/* Videz */}
        <Sekcija naslov="🎨  Videz">
          <Vrstica opis="Barvna tema" podnapis="Preklopi med svetlim in temnim načinom">
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={`gumb ${!temno ? 'gumb-primarni' : 'gumb-sekundarni'}`} style={{ padding: '10px 24px' }} onClick={() => setTemno(false)}>
                <i className="ti ti-sun" /> Svetli
              </button>
              <button className={`gumb ${temno ? 'gumb-primarni' : 'gumb-sekundarni'}`} style={{ padding: '10px 24px' }} onClick={() => setTemno(true)}>
                <i className="ti ti-moon" /> Temni
              </button>
            </div>
          </Vrstica>
          <Vrstica opis="Barva akcenta" podnapis="Barva gumbov, poudarkov in aktivnih elementov">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {BARVE_AKCENTA.map(({ barva, ime }) => (
                <button
                  key={barva}
                  title={ime}
                  onClick={() => setBarvaAkcent(barva)}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: barva, cursor: 'pointer',
                    border: barvaAkcent === barva ? '3px solid var(--besedilo1)' : '2px solid transparent',
                    boxShadow: barvaAkcent === barva ? `0 0 0 1px ${barva}` : 'none',
                    transition: 'border 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
              <input
                type="color"
                value={barvaAkcent}
                onChange={e => setBarvaAkcent(e.target.value)}
                title="Barva po meri"
                style={{
                  width: 38, height: 30, padding: 2, borderRadius: 8,
                  border: '1.5px solid var(--rob)', cursor: 'pointer', background: 'none',
                }}
              />
              <button
                className="gumb gumb-sekundarni"
                style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                onClick={() => setBarvaAkcent('#2563EB')}
                title="Ponastavi na privzeto modro"
              >
                <i className="ti ti-refresh" /> Privzeto
              </button>
            </div>
          </Vrstica>
        </Sekcija>

        {/* Backup */}
        <Sekcija naslov="💾  Backup in obnova">
          <Vrstica opis="Izvozi podatke" podnapis="Zapiski, naloge in urnik kot JSON">
            <button className="gumb gumb-primarni" style={{ padding: '10px 20px' }} onClick={izvozi}>
              <i className="ti ti-download" /> Izvozi
            </button>
          </Vrstica>
          <Vrstica opis="Uvozi podatke" podnapis="Uvozi iz .json backup datoteke">
            <input ref={uvozInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={uvozi} />
            <button className="gumb gumb-sekundarni" style={{ padding: '10px 20px' }}
              onClick={() => uvozInputRef.current?.click()} disabled={uvazam}>
              {uvazam
                ? <><div className="nalagalnik" style={{ width: 16, height: 16, borderWidth: 2 }} /> Uvažam…</>
                : <><i className="ti ti-upload" /> Uvozi</>}
            </button>
          </Vrstica>
        </Sekcija>

        {/* Nevarne operacije */}
        <Sekcija naslov="⚠️  Ponastavi">
          <Vrstica opis="Ponastavi lokalne nastavitve" podnapis="Zbriše ime, temo in lokalne nastavitve. Baza ostane.">
            <button className="gumb gumb-nevarno" style={{ padding: '10px 20px', border: '1.5px solid var(--rdeca)', borderRadius: 8 }} onClick={ponastavi}>
              <i className="ti ti-refresh" /> Ponastavi
            </button>
          </Vrstica>
        </Sekcija>

        {/* O aplikaciji */}
        <div style={{
          background: 'var(--ozadje1)', border: '1.5px solid var(--rob)', borderRadius: 16,
          padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, background: 'var(--modra)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                🎓
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                StudyOS <span style={{ color: 'var(--modra)', fontFamily: 'var(--mono)', fontSize: '0.9rem' }}>v2.0</span>
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--besedilo3)' }}>Osebni delovni prostor za študente FERI</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', fontSize: '0.75rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
            {['React', 'Vite', 'Node.js', 'Express', 'MongoDB'].map(t => (
              <span key={t} style={{ background: 'var(--ozadje2)', padding: '2px 10px', borderRadius: 99, border: '1px solid var(--rob)' }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Pomožni komponenti ─────────────────────────────────────────────────────── */
function Sekcija({ naslov, children }) {
  return (
    <div style={{ background: 'var(--ozadje1)', border: '1.5px solid var(--rob)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--besedilo3)', background: 'var(--ozadje2)', borderBottom: '1.5px solid var(--rob)' }}>
        {naslov}
      </div>
      {children}
    </div>
  )
}

function Vrstica({ opis, podnapis, children }) {
  return (
    <div className="_nastavitve-vrstica" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 24px', borderBottom: '1px solid var(--rob)', gap: 20,
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--besedilo1)', marginBottom: 3 }}>{opis}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--besedilo3)' }}>{podnapis}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}
