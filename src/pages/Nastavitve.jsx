import { useState, useRef } from 'react'
import { prikaziObvestilo } from '../toast.js'
import { useApp, PREDMETI_PRIVZETI } from '../App.jsx'
import BackupUvoz from '../components/BackupUvoz.jsx'
import {
  pridobiZapiske, pridobiNaloge, pridobiUrnik,
  ustvariZapisek, ustvariNalogo,
} from '../api.js'

// ── Smart uvoz (diff) modal ───────────────────────────────────────────────────
function SmartUvozModal({ podatki, obstojeciZapiski, obstojeceNaloge, onPotrdi, onZapri }) {
  const [uvozZapiske, setUvozZapiske] = useState(true)
  const [uvozNaloge,  setUvozNaloge]  = useState(true)
  const [uvazam,      setUvazam]      = useState(false)

  // Analiza razlik
  const obsNaslovi = new Set(obstojeciZapiski.map(z => z.naslov.toLowerCase().trim()))
  const obsNaloge  = new Set(obstojeceNaloge.map(n => n.besedilo.toLowerCase().trim()))

  const novZapiski  = (podatki.zapiski || []).filter(z => !obsNaslovi.has(z.naslov?.toLowerCase().trim()))
  const dupZapiski  = (podatki.zapiski || []).filter(z => obsNaslovi.has(z.naslov?.toLowerCase().trim()))
  const novNaloge   = (podatki.naloge || []).filter(n => !obsNaloge.has(n.besedilo?.toLowerCase().trim()))
  const dupNaloge   = (podatki.naloge || []).filter(n => obsNaloge.has(n.besedilo?.toLowerCase().trim()))

  async function potrdi() {
    setUvazam(true)
    let z = 0, n = 0
    try {
      if (uvozZapiske) {
        for (const zapis of novZapiski) {
          const { _id, __v, ustvarjen, posodobljen, ...rest } = zapis
          if (await ustvariZapisek(rest)) z++
        }
      }
      if (uvozNaloge) {
        for (const naloga of novNaloge) {
          const { _id, __v, ustvarjena, ...rest } = naloga
          if (await ustvariNalogo(rest)) n++
        }
      }
      prikaziObvestilo(`Uvoženo: ${z} zapiskov, ${n} nalog`, 'uspeh')
      onPotrdi()
    } catch {
      prikaziObvestilo('Napaka pri uvozu', 'napaka')
    } finally {
      setUvazam(false)
    }
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal" style={{ maxWidth: 560, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-naslov">
          <i className="ti ti-file-diff" style={{ color: 'var(--modra)', marginRight: 8 }} />
          Pametni uvoz
        </h2>
        <div style={{ fontSize: '0.82rem', color: 'var(--besedilo3)', marginBottom: 18 }}>
          Pregled razlik med backup datoteko in obstoječimi podatki
        </div>

        {/* Zapiski diff */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
            <input type="checkbox" checked={uvozZapiske} onChange={e => setUvozZapiske(e.target.checked)}
              style={{ width: 16, height: 16 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Zapiski</span>
          </label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', padding: '3px 10px', background: 'var(--zelena)20', color: 'var(--zelena)', borderRadius: 99, fontWeight: 600 }}>
              +{novZapiski.length} novih
            </span>
            {dupZapiski.length > 0 && (
              <span style={{ fontSize: '0.78rem', padding: '3px 10px', background: 'var(--besedilo3)20', color: 'var(--besedilo3)', borderRadius: 99 }}>
                {dupZapiski.length} že obstaja (preskoči)
              </span>
            )}
          </div>
          {novZapiski.length > 0 && uvozZapiske && (
            <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {novZapiski.slice(0, 8).map((z, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'var(--zelena)10', borderRadius: 6, border: '1px solid var(--zelena)30', fontSize: '0.78rem' }}>
                  <i className="ti ti-plus" style={{ color: 'var(--zelena)', fontSize: '0.7rem' }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.naslov}</span>
                  {z.predmet && <span style={{ color: 'var(--besedilo3)', fontSize: '0.68rem' }}>{z.predmet}</span>}
                </div>
              ))}
              {novZapiski.length > 8 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', paddingLeft: 8 }}>in {novZapiski.length - 8} več…</div>
              )}
            </div>
          )}
        </div>

        {/* Naloge diff */}
        <div style={{ marginBottom: 20, paddingTop: 14, borderTop: '1px solid var(--rob)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
            <input type="checkbox" checked={uvozNaloge} onChange={e => setUvozNaloge(e.target.checked)}
              style={{ width: 16, height: 16 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Naloge</span>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', padding: '3px 10px', background: 'var(--zelena)20', color: 'var(--zelena)', borderRadius: 99, fontWeight: 600 }}>
              +{novNaloge.length} novih
            </span>
            {dupNaloge.length > 0 && (
              <span style={{ fontSize: '0.78rem', padding: '3px 10px', background: 'var(--besedilo3)20', color: 'var(--besedilo3)', borderRadius: 99 }}>
                {dupNaloge.length} že obstaja (preskoči)
              </span>
            )}
          </div>
        </div>

        {/* Backup info */}
        {podatki.datum && (
          <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginBottom: 14 }}>
            <i className="ti ti-clock" /> Backup iz {new Date(podatki.datum).toLocaleDateString('sl-SI', { dateStyle: 'long' })}
          </div>
        )}

        {novZapiski.length + novNaloge.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--besedilo3)', fontSize: '0.88rem', marginBottom: 14 }}>
            <i className="ti ti-circle-check" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 6 }} />
            Vsi podatki v backupu že obstajajo.
          </div>
        ) : null}

        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
          <button
            className="gumb gumb-primarni"
            onClick={potrdi}
            disabled={uvazam || ((!uvozZapiske || novZapiski.length === 0) && (!uvozNaloge || novNaloge.length === 0))}
          >
            {uvazam
              ? <><div className="nalagalnik" style={{ width: 14, height: 14, borderWidth: 2 }} /> Uvažam…</>
              : <><i className="ti ti-upload" /> Uvozi {(uvozZapiske ? novZapiski.length : 0) + (uvozNaloge ? novNaloge.length : 0)} elementov</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [backupOdprt, setBackupOdprt] = useState(false)
  const [aiPonudnik, setAiPonudnik] = useState(() => localStorage.getItem('studyos-ai-ponudnik') || 'groq')
  // Vsak ponudnik ima lasten ključ — shranjen pod studyos-ai-kljuc-{ponudnik}
  const [aiKljuci,  setAiKljuci]  = useState(() => ({
    groq:      localStorage.getItem('studyos-ai-kljuc-groq')      || '',
    gemini:    localStorage.getItem('studyos-ai-kljuc-gemini')    || '',
    anthropic: localStorage.getItem('studyos-ai-kljuc-anthropic') || '',
  }))
  const [aiShranjen, setAiShranjen] = useState(false)
  const [ollamaUrl,  setOllamaUrl]  = useState(() => localStorage.getItem('studyos-ollama-url') || 'http://localhost:11434')
  const [ollamaModel,setOllamaModel]= useState(() => localStorage.getItem('studyos-ollama-model') || 'llama3.2')

  // Ključ za trenutni ponudnik
  const aiKljuc = aiKljuci[aiPonudnik] || ''
  function setAiKljuc(val) {
    setAiKljuci(prev => ({ ...prev, [aiPonudnik]: val }))
  }
  const [uvazam,        setUvazam]        = useState(false)
  const [smartUvozPodatki, setSmartUvozPodatki] = useState(null)
  const [obstojeciData, setObstojeciData] = useState({ zapiski: [], naloge: [] })
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
    // Shrani aktivni ponudnik
    localStorage.setItem('studyos-ai-ponudnik', aiPonudnik)
    // Shrani ključ za VSAK ponudnik posebej (ne le aktivnega)
    Object.entries(aiKljuci).forEach(([ponudnik, kljuc]) => {
      if (kljuc.trim()) localStorage.setItem(`studyos-ai-kljuc-${ponudnik}`, kljuc.trim())
    })
    // Ohrani staro studyos-ai-kljuc za združljivost
    localStorage.setItem('studyos-ai-kljuc', aiKljuci[aiPonudnik]?.trim() || '')
    localStorage.setItem('studyos-ollama-url', ollamaUrl.trim())
    localStorage.setItem('studyos-ollama-model', ollamaModel.trim())
    setAiShranjen(true)
    prikaziObvestilo(`${aiPonudnik === 'groq' ? 'Groq' : aiPonudnik === 'gemini' ? 'Gemini' : 'Anthropic'} ključ shranjen ✓`, 'uspeh')
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
    setUvazam(true)
    try {
      const podatki = JSON.parse(await file.text())
      // Naloži obstoječe podatke za primerjavo (diff)
      const [zs, ns] = await Promise.all([pridobiZapiske(), pridobiNaloge()])
      setObstojeciData({ zapiski: zs, naloge: ns })
      setSmartUvozPodatki(podatki)
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
        <Sekcija naslov="🤖  AI asistent">

          {/* Izbirnik ponudnika */}
          <Vrstica opis="AI ponudnik" podnapis="Izberi ponudnika — Groq in Gemini sta popolnoma brezplačna">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              {[
                { id: 'groq',      ikona: '⚡', ime: 'Groq',           opis: 'Zastonj · 14.400 klicev/dan · Llama 3.1',   barva: '#f97316', priporocen: true },
                { id: 'gemini',    ikona: '🌟', ime: 'Google Gemini',   opis: 'Zastonj · 1.500 klicev/dan · Gemini Flash',  barva: '#4285f4' },
                { id: 'ollama',    ikona: '🦙', ime: 'Ollama (lokalno)', opis: 'Zastonj · Brez interneta · Llama, Mistral…', barva: '#22c55e' },
                { id: 'anthropic', ikona: '🔶', ime: 'Anthropic Claude', opis: 'Plačljiv · $5 brezplačnih kreditov ob vpisu', barva: '#d97706' },
              ].map(p => (
                <label key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  border: `2px solid ${aiPonudnik === p.id ? p.barva : 'var(--rob)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: aiPonudnik === p.id ? `${p.barva}12` : 'var(--ozadje1)',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="ponudnik" value={p.id}
                    checked={aiPonudnik === p.id}
                    onChange={() => { setAiPonudnik(p.id); localStorage.setItem('studyos-ai-ponudnik', p.id) }}
                    style={{ accentColor: p.barva }} />
                  <span style={{ fontSize: '1.3rem' }}>{p.ikona}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.ime}
                      {p.priporocen && <span style={{ fontSize: '0.65rem', background: p.barva, color: '#fff', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>PRIPOROČENO</span>}
                      {p.id !== 'ollama' && aiKljuci[p.id] && <span style={{ fontSize: '0.65rem', background: 'var(--zelena)', color: '#fff', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>✓ NASTAVLJEN</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', marginTop: 1 }}>{p.opis}</div>
                  </div>
                </label>
              ))}
            </div>
          </Vrstica>

          {/* API ključ (razen za Ollama) */}
          {aiPonudnik !== 'ollama' && (
            <Vrstica
              opis="API ključ"
              podnapis={
                aiPonudnik === 'groq'    ? <>Zastonj na <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: 'var(--modra)' }}>console.groq.com</a> → API Keys → Create API Key</> :
                aiPonudnik === 'gemini'  ? <>Zastonj na <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--modra)' }}>aistudio.google.com</a> → Get API Key</> :
                <>Plačljiv na <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--modra)' }}>console.anthropic.com</a> → API Keys</>
              }
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="vhod"
                  type="password"
                  style={{ width: 240, fontSize: '0.9rem', fontFamily: 'var(--mono)' }}
                  value={aiKljuc}
                  onChange={e => setAiKljuc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && shraniAiKljuc()}
                  placeholder={
                    aiPonudnik === 'groq'    ? 'gsk_…' :
                    aiPonudnik === 'gemini'  ? 'AIza…' :
                    'sk-ant-…'
                  }
                />
                <button className="gumb gumb-primarni" style={{ padding: '10px 20px' }} onClick={shraniAiKljuc}>
                  {aiShranjen ? '✓' : 'Shrani'}
                </button>
              </div>
            </Vrstica>
          )}

          {/* Ollama nastavitve */}
          {aiPonudnik === 'ollama' && (
            <Vrstica opis="Ollama nastavitve" podnapis="Potrebuješ nameščen Ollama — brezplačno na ollama.com">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--besedilo3)', width: 60 }}>URL</span>
                  <input className="vhod" style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'var(--mono)' }}
                    value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} placeholder="http://localhost:11434" />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--besedilo3)', width: 60 }}>Model</span>
                  <input className="vhod" style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'var(--mono)' }}
                    value={ollamaModel} onChange={e => setOllamaModel(e.target.value)} placeholder="llama3.2" />
                </div>
                <button className="gumb gumb-primarni" style={{ padding: '8px 20px', alignSelf: 'flex-start' }} onClick={shraniAiKljuc}>
                  {aiShranjen ? '✓ Shranjeno' : 'Shrani'}
                </button>
              </div>
            </Vrstica>
          )}

          {/* Status */}
          {(aiKljuc || aiPonudnik === 'ollama') && (
            <Vrstica opis="Status" podnapis="">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--zelena)' }}>
                <i className="ti ti-circle-check" />
                {aiPonudnik === 'ollama' ? 'Ollama konfiguriran' : 'Ključ nastavljen'}
                {aiPonudnik !== 'ollama' && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rdeca)', fontSize: '0.78rem' }}
                    onClick={() => {
                      localStorage.removeItem(`studyos-ai-kljuc-${aiPonudnik}`)
                      localStorage.removeItem('studyos-ai-kljuc')
                      setAiKljuc('')
                      prikaziObvestilo('Ključ izbrisan', 'info')
                    }}>
                    <i className="ti ti-trash" /> Izbriši
                  </button>
                )}
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
          <Vrstica opis="Uvozi podatke" podnapis="Pametni uvoz z diff prikazom — vidi kaj se bo uvozilo">
            <input ref={uvozInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={uvozi} />
            <button className="gumb gumb-sekundarni" style={{ padding: '10px 20px' }}
              onClick={() => uvozInputRef.current?.click()} disabled={uvazam}>
              {uvazam
                ? <><div className="nalagalnik" style={{ width: 16, height: 16, borderWidth: 2 }} /> Nalagam…</>
                : <><i className="ti ti-file-diff" /> Pametni uvoz</>}
            </button>
          </Vrstica>
        </Sekcija>

        {/* Backup & uvoz */}
        <Sekcija naslov="💾 Backup & Uvoz">
          <Vrstica opis="Varnostna kopija podatkov" podnapis="Izvozi ali uvozi vse zapiske, naloge, ocene in nastavitve kot JSON datoteko.">
            <button className="gumb gumb-sekundarni" style={{ padding: '10px 20px' }} onClick={() => setBackupOdprt(true)}>
              <i className="ti ti-database-export" /> Backup & Uvoz
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

      {/* Smart uvoz modal */}
      {smartUvozPodatki && (
        <SmartUvozModal
          podatki={smartUvozPodatki}
          obstojeciZapiski={obstojeciData.zapiski}
          obstojeceNaloge={obstojeciData.naloge}
          onPotrdi={() => setSmartUvozPodatki(null)}
          onZapri={() => setSmartUvozPodatki(null)}
        />
      )}

      {backupOdprt && <BackupUvoz onZapri={() => setBackupOdprt(false)} />}
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
