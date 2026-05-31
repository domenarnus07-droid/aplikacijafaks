import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { registrirajToast } from './toast.js'
import Dashboard        from './pages/Dashboard.jsx'
import Zapiski          from './pages/Zapiski.jsx'
import Urnik            from './pages/Urnik.jsx'
import Naloge           from './pages/Naloge.jsx'
import Nastavitve       from './pages/Nastavitve.jsx'
import Ocene            from './pages/Ocene.jsx'
import Statistike       from './pages/Statistike.jsx'
import GlobalniKviz     from './pages/GlobalniKviz.jsx'
import Dosezki          from './pages/Dosezki.jsx'
import Semester         from './pages/Semester.jsx'
import GlobalnoIskanje  from './components/GlobalnoIskanje.jsx'
import PomodoroTimer    from './components/PomodoroTimer.jsx'
import SplashScreen     from './components/SplashScreen.jsx'
import TipkovneBliznjice from './components/TipkovneBliznjice.jsx'
import HitroZajemanje   from './components/HitroZajemanje.jsx'
import PwaNamestitev    from './components/PwaNamestitev.jsx'
import TedeniskiPregled from './components/TedeniskiPregled.jsx'
import GlobalniAI      from './components/GlobalniAI.jsx'
import PwaUpdate       from './components/PwaUpdate.jsx'
import { odkleniDosezek, DOSEZKI } from './dosezki.js'
import { preveriPovezavo } from './api.js'
import Projekti          from './pages/Projekti.jsx'
import Izpiti            from './pages/Izpiti.jsx'
import MiselniVzorec     from './pages/MiselniVzorec.jsx'
import Koledar           from './pages/Koledar.jsx'
import StudyMusic        from './components/StudyMusic.jsx'
import HitraSeja         from './components/HitraSeja.jsx'
import ZivaUra           from './components/ZivaUra.jsx'
import Bralnik           from './pages/Bralnik.jsx'
import Navade            from './pages/Navade.jsx'
import Prijava           from './pages/Prijava.jsx'

export const AppKontekst = createContext(null)
export function useApp() { return useContext(AppKontekst) }

export const PREDMETI_PRIVZETI = [
  { id: 'matematika',  ime: 'Matematika',  ikona: '📐', barva: '#2563EB' },
  { id: 'fizika',      ime: 'Fizika',      ikona: '⚛️',  barva: '#22C55E' },
  { id: 'anglescina',  ime: 'Angleščina',  ikona: '🌍', barva: '#F59E0B' },
  { id: 'informatika', ime: 'Informatika', ikona: '💻', barva: '#EF4444' },
  { id: 'kemija',      ime: 'Kemija',      ikona: '🔬', barva: '#8B5CF6' },
]

function beriPredmete() {
  try {
    const s = localStorage.getItem('studyos-predmeti')
    if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p }
  } catch {}
  return PREDMETI_PRIVZETI
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastPonudnik({ children }) {
  const [toasti, setToasti] = useState([])
  const dodajToast = useCallback((sporocilo, tip = 'uspeh') => {
    const id = Date.now() + Math.random()
    setToasti(prev => [...prev, { id, sporocilo, tip }])
    setTimeout(() => setToasti(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])
  useEffect(() => { registrirajToast(dodajToast); return () => registrirajToast(null) }, [dodajToast])
  const ikona = { uspeh: '✓', napaka: '✕', info: 'ℹ' }
  return (
    <>
      {children}
      <div className="toast-vsebnik">
        {toasti.map(t => (
          <div key={t.id} className={`toast ${t.tip}`}>
            <span className="toast-ikona">{ikona[t.tip] ?? '•'}</span>
            {t.sporocilo}
          </div>
        ))}
      </div>
    </>
  )
}

const STRANI = {
  pregled:    { oznaka: 'Pregled',    ikona: 'ti-layout-dashboard', komponenta: Dashboard  },
  zapiski:    { oznaka: 'Zapiski',    ikona: 'ti-notebook',         komponenta: Zapiski    },
  urnik:      { oznaka: 'Urnik',      ikona: 'ti-calendar-week',    komponenta: Urnik      },
  naloge:     { oznaka: 'Naloge',     ikona: 'ti-check',            komponenta: Naloge     },
  ocene:      { oznaka: 'Ocene',      ikona: 'ti-star',             komponenta: Ocene      },
  statistike: { oznaka: 'Statistike', ikona: 'ti-chart-bar',        komponenta: Statistike },
  kviz:       { oznaka: 'Kviz',       ikona: 'ti-cards',            komponenta: GlobalniKviz },
  semester:   { oznaka: 'Semester',   ikona: 'ti-timeline',         komponenta: Semester   },
  dosezki:    { oznaka: 'Dosežki',    ikona: 'ti-trophy',           komponenta: Dosezki    },
  nastavitve: { oznaka: 'Nastavitve', ikona: 'ti-settings',         komponenta: Nastavitve },
  projekti:   { oznaka: 'Projekti',   ikona: 'ti-users',            komponenta: Projekti   },
  izpiti:     { oznaka: 'Izpiti',     ikona: 'ti-calendar-event',   komponenta: Izpiti     },
  vzorec:     { oznaka: 'Miselni vzorci', ikona: 'ti-share',        komponenta: MiselniVzorec },
  koledar:    { oznaka: 'Koledar',    ikona: 'ti-calendar',         komponenta: Koledar    },
  bralnik:    { oznaka: 'Bralnik',   ikona: 'ti-bookmarks',        komponenta: Bralnik    },
  navade:     { oznaka: 'Navade',    ikona: 'ti-check',            komponenta: Navade     },
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ stran, setStran, temno, setTemno, nalogeBadge,
                   aktivniPredmet, setAktivniPredmet, predmeti,
                   onKlikPredmet, onIskanje, mobilniMenuOdprt, setMobilniMenuOdprt,
                   vseTagi, setVseTagi, aktivniTag, setAktivniTag, onTedenski, jeOnline, onHitraSeja,
                   nedavniZapiski, uporabnik, onOdjava }) {

  function izbrisiTag(tag, e) {
    e.stopPropagation()
    const novi = vseTagi.filter(t => t !== tag)
    setVseTagi(novi)
    try { localStorage.setItem('studyos-tagi-cache', JSON.stringify(novi)) } catch {}
    if (aktivniTag === tag) setAktivniTag(null)
  }
  return (
    <>
      {mobilniMenuOdprt && (
        <div className="mobilni-overlay" onClick={() => setMobilniMenuOdprt(false)} />
      )}

      <aside className={`sidebar ${mobilniMenuOdprt ? 'mobilni-odprt' : ''}`}>
        <div className="sidebar-logotip">
          <div className="sidebar-logotip-ikona">🎓</div>
          <span className="sidebar-logotip-besedilo">Study<span className="sidebar-logotip-pika">OS</span></span>
          <span
            className="povez-indikator"
            title={jeOnline === null ? 'Preverjanje...' : jeOnline ? 'Sinhroniziran z oblakom' : 'Lokalni način — brez strežnika'}
            style={{ background: jeOnline === null ? 'var(--meja)' : jeOnline ? '#22c55e' : '#f59e0b' }}
          />
          <button className="sidebar-zapri-mobilni" onClick={() => setMobilniMenuOdprt(false)}>
            <i className="ti ti-x" />
          </button>
        </div>

        <button className="sidebar-iskanje-gumb" onClick={onIskanje} title="Ctrl+K">
          <i className="ti ti-search" /><span>Iskanje…</span><kbd>Ctrl+K</kbd>
        </button>

        {/* Nedavno odprto */}
        {nedavniZapiski.length > 0 && (
          <div className="sidebar-sekcija" style={{ paddingTop: 6 }}>
            <div className="sidebar-sekcija-naslov">Nedavno</div>
            {nedavniZapiski.map(z => (
              <button key={z.id} className="nav-element"
                onClick={() => {
                  localStorage.setItem('studyos-zadnji-zapisek', z.id)
                  setStran('zapiski')
                  setMobilniMenuOdprt(false)
                }}
              >
                <i className="nav-ikona ti ti-note" />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{z.naslov}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hitra seja gumb */}
        <div style={{ padding: '8px 10px 0' }}>
          <button
            className="gumb gumb-primarni"
            style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.82rem' }}
            onClick={() => { onHitraSeja?.(); setMobilniMenuOdprt(false) }}
          >
            <i className="ti ti-bolt" /> Hitra seja
          </button>
        </div>

        <div className="sidebar-sekcija">
          <div className="sidebar-sekcija-naslov">Navigacija</div>
          {['pregled', 'zapiski', 'urnik', 'naloge', 'ocene', 'statistike', 'izpiti'].map(k => (
            <button key={k} className={`nav-element ${stran === k ? 'aktiven' : ''}`}
              onClick={() => { setStran(k); setMobilniMenuOdprt(false) }}>
              <i className={`nav-ikona ti ${STRANI[k].ikona}`} />
              {STRANI[k].oznaka}
              {k === 'naloge' && nalogeBadge > 0 && <span className="znacka">{nalogeBadge}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-sekcija">
          <div className="sidebar-sekcija-naslov">Orodja</div>
          {['kviz', 'semester', 'dosezki', 'projekti', 'vzorec', 'koledar', 'bralnik', 'navade'].map(k => (
            <button key={k} className={`nav-element ${stran === k ? 'aktiven' : ''}`}
              onClick={() => { setStran(k); setMobilniMenuOdprt(false) }}>
              <i className={`nav-ikona ti ${STRANI[k].ikona}`} />
              {STRANI[k].oznaka}
            </button>
          ))}
          <button className="nav-element" onClick={() => { onTedenski(); setMobilniMenuOdprt(false) }}>
            <i className="nav-ikona ti ti-calendar-week" />
            Teden. pregled
          </button>
        </div>

        <div className="sidebar-sekcija">
          <div className="sidebar-sekcija-naslov">Predmeti</div>
          {predmeti.map(p => (
            <button key={p.id} className={`predmet-element ${aktivniPredmet === p.id ? 'aktiven' : ''}`}
              onClick={() => { onKlikPredmet(p.id); setMobilniMenuOdprt(false) }}>
              <span className="predmet-ikona">{p.ikona}</span>
              <span className="predmet-ime">{p.ime}</span>
              <span className="predmet-pika" style={{ background: p.barva }} />
            </button>
          ))}
          {aktivniPredmet && (
            <button className="predmet-element" style={{ color: 'var(--rdeca)', fontSize: '0.75rem', marginTop: 4 }}
              onClick={() => setAktivniPredmet(null)}>
              <i className="ti ti-x" style={{ fontSize: '0.75rem' }} /> Počisti filter
            </button>
          )}
        </div>

        {/* Tag filter */}
        {vseTagi.length > 0 && (
          <div className="sidebar-sekcija">
            <div className="sidebar-sekcija-naslov">Tagi</div>
            {vseTagi.slice(0, 10).map(tag => (
              <button key={tag}
                className={`predmet-element ${aktivniTag === tag ? 'aktiven' : ''}`}
                onClick={() => { setAktivniTag(aktivniTag === tag ? null : tag); setMobilniMenuOdprt(false) }}>
                <span className="predmet-ikona" style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>#</span>
                <span className="predmet-ime">{tag}</span>
                <span
                  onClick={e => izbrisiTag(tag, e)}
                  title="Zbriši tag"
                  style={{
                    marginLeft: 'auto', flexShrink: 0,
                    width: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', fontSize: '0.65rem',
                    opacity: 0.4, transition: 'opacity 0.15s',
                    color: 'currentColor',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                >
                  <i className="ti ti-x" />
                </span>
              </button>
            ))}
            {aktivniTag && (
              <button className="predmet-element" style={{ color: 'var(--rdeca)', fontSize: '0.75rem', marginTop: 4 }}
                onClick={() => setAktivniTag(null)}>
                <i className="ti ti-x" style={{ fontSize: '0.75rem' }} /> Počisti tag filter
              </button>
            )}
          </div>
        )}

        <div className="sidebar-dno">
          {/* Uporabnik info */}
          {uporabnik && (
            <div style={{ marginBottom: 4 }}>
              {/* Uporabnik info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px 6px',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--modra)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '0.8rem', color: '#fff', fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {uporabnik.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {uporabnik.username}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--besedilo3)' }}>
                    {uporabnik.vloga === 'admin' ? '👑 Admin' : '👤 Uporabnik'}
                  </div>
                </div>
              </div>
              {/* Odjava gumb */}
              <button
                onClick={onOdjava}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--rob)',
                  background: 'transparent', cursor: 'pointer', color: 'var(--rdeca)',
                  fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--rdeca)15'; e.currentTarget.style.borderColor = 'var(--rdeca)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--rob)' }}
              >
                <i className="ti ti-logout" style={{ fontSize: '0.9rem' }} />
                Odjava
              </button>
            </div>
          )}
          <button className={`nav-element ${stran === 'nastavitve' ? 'aktiven' : ''}`}
            onClick={() => { setStran('nastavitve'); setMobilniMenuOdprt(false) }}>
            <i className={`nav-ikona ti ${STRANI.nastavitve.ikona}`} />{STRANI.nastavitve.oznaka}
          </button>
          <PwaNamestitev />
          <button className="tema-preklop" onClick={() => setTemno(t => !t)}>
            <i className={`ti ${temno ? 'ti-moon' : 'ti-sun'}`} />
            {temno ? 'Temni način' : 'Svetli način'}
            <label className="stikalo" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={temno} onChange={() => setTemno(t => !t)} />
              <span className="stikalo-tir" />
            </label>
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Hamburger gumb ────────────────────────────────────────────────────────────
function HamburgerGumb({ onClick }) {
  return (
    <button className="hamburger-gumb" onClick={onClick} title="Meni">
      <i className="ti ti-menu-2" />
    </button>
  )
}

function beriPrijavo() {
  try {
    const jwt      = localStorage.getItem('studyos-jwt')
    const username = localStorage.getItem('studyos-username')
    const vloga    = localStorage.getItem('studyos-vloga')
    if (username) return { username, vloga: vloga || 'uporabnik', jwt }
  } catch {}
  return null
}

export default function App() {
  const [splash,          setSplash]          = useState(true)
  const [prijavljenUporabnik, setPrijavljenUporabnik] = useState(beriPrijavo)
  const [stran,           setStran]           = useState('pregled')
  const [temno,           setTemno]           = useState(() => {
    try { return localStorage.getItem('studyos-tema') === 'temno' } catch { return false }
  })
  const [aktivniPredmet,  setAktivniPredmet]  = useState(null)
  const [nalogeBadge,     setNalogeBadge]     = useState(0)
  const [iskanjeOdprto,   setIskanjeOdprto]   = useState(false)
  const [predmeti,        setPredmeti]        = useState(beriPredmete)
  const [mobilniMenu,     setMobilniMenu]     = useState(false)
  const [bliznjiceOdprte, setBliznjiceOdprte] = useState(false)
  const [hitroZajem,      setHitroZajem]      = useState(false)
  const [aktivniTag,      setAktivniTag]      = useState(null)
  const [tedenski,        setTedenski]        = useState(false)
  const [dosezekPopup,    setDosezekPopup]    = useState(null)
  const [hitraSeja,       setHitraSeja]       = useState(false)
  const [jeOnline,        setJeOnline]        = useState(null)  // null = preverjanje
  const [vseTagi,         setVseTagi]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyos-tagi-cache') || '[]') } catch { return [] }
  })
  const [barvaAkcent,     setBarvaAkcent]     = useState(() =>
    localStorage.getItem('studyos-barva-akcent') || '#2563EB'
  )
  const [nedavniZapiski,  setNedavniZapiski]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyos-nedavni') || '[]') } catch { return [] }
  })

  useEffect(() => {
    document.body.classList.toggle('temno', temno)
    localStorage.setItem('studyos-tema', temno ? 'temno' : 'svetlo')
    // Switch highlight.js theme
    const el = document.getElementById('hljs-tema')
    if (el) el.href = temno
      ? 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark-dimmed.min.css'
      : 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css'
  }, [temno])

  useEffect(() => {
    document.title = `${STRANI[stran]?.oznaka ?? 'Pregled'} · StudyOS`
  }, [stran])

  // Preverjanje povezave z backendom
  useEffect(() => {
    let aktiven = true
    const preveri = async () => {
      const ok = await preveriPovezavo()
      if (aktiven) setJeOnline(ok)
    }
    preveri()
    const interval = setInterval(preveri, 30000)  // vsako 30s
    return () => { aktiven = false; clearInterval(interval) }
  }, [])

  // Apply accent color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--modra', barvaAkcent)
    // Derived lighter shade for backgrounds
    document.documentElement.style.setProperty('--modra-akcent', barvaAkcent)
    localStorage.setItem('studyos-barva-akcent', barvaAkcent)
  }, [barvaAkcent])

  function shraniPredmete(novi) {
    setPredmeti(novi)
    try { localStorage.setItem('studyos-predmeti', JSON.stringify(novi)) } catch {}
  }

  // ── Bližnjice ─────────────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e) {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'k') { e.preventDefault(); setIskanjeOdprto(o => !o); return }
      if (ctrl && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault(); setHitroZajem(o => !o); return
      }
      if (ctrl && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('studyos:toggle-ai'))
        return
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault(); setStran('zapiski')
        setTimeout(() => window.dispatchEvent(new CustomEvent('studyos:nov-zapisek')), 80); return
      }
      if (ctrl && e.key === 't') {
        e.preventDefault(); setStran('naloge')
        setTimeout(() => window.dispatchEvent(new CustomEvent('studyos:nova-naloga')), 80); return
      }
      if (e.key === '?' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault(); setBliznjiceOdprte(o => !o); return
      }
      if (e.key === 'Escape') { setIskanjeOdprto(false); setBliznjiceOdprte(false); setHitroZajem(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Deep link: read hash on mount ──────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#/')) {
      const [page, query] = hash.slice(2).split('?')
      if (page && STRANI[page]) setStran(page)
      if (page === 'zapiski' && query) {
        const params = new URLSearchParams(query)
        const noteId = params.get('z')
        if (noteId) localStorage.setItem('studyos-zadnji-zapisek', noteId)
      }
    }
  }, [])

  // ── Deep link: sync hash on navigation ─────────────────────────────────────
  useEffect(() => {
    if (stran) window.location.hash = `#/${stran}`
  }, [stran])

  useEffect(() => {
    const h = () => setStran('nastavitve')
    window.addEventListener('studyos:pojdi-nastavitve', h)
    return () => window.removeEventListener('studyos:pojdi-nastavitve', h)
  }, [])

  useEffect(() => {
    const h = () => {
      try { setNedavniZapiski(JSON.parse(localStorage.getItem('studyos-nedavni') || '[]')) } catch {}
    }
    window.addEventListener('studyos:nedavni-posodobljeni', h)
    return () => window.removeEventListener('studyos:nedavni-posodobljeni', h)
  }, [])

  // Dosezek listener
  useEffect(() => {
    const h = e => {
      const def = DOSEZKI.find(d => d.id === e.detail?.id)
      if (def) {
        setDosezekPopup(def)
        setTimeout(() => setDosezekPopup(null), 4000)
      }
    }
    window.addEventListener('studyos:dosezek', h)
    return () => window.removeEventListener('studyos:dosezek', h)
  }, [])

  // Dnevni opomnik za učenje
  useEffect(() => {
    function preveriDnevniOpomnik() {
      try {
        const cfg = JSON.parse(localStorage.getItem('studyos-dnevni-opomnik') || '{}')
        if (!cfg.aktiven || !cfg.ura) return
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
        const kljuc = `studyos-dnevni-${new Date().toISOString().slice(0, 10)}`
        if (localStorage.getItem(kljuc)) return
        const [h, m] = cfg.ura.split(':').map(Number)
        const zdaj = new Date()
        if (zdaj.getHours() > h || (zdaj.getHours() === h && zdaj.getMinutes() >= m)) {
          new Notification('📚 Čas za učenje!', {
            body: 'StudyOS te čaka — odpri in nadaljuj 🎓',
            icon: '/icon.svg',
          })
          localStorage.setItem(kljuc, '1')
        }
      } catch {}
    }
    preveriDnevniOpomnik()
    const interval = setInterval(preveriDnevniOpomnik, 60000)
    return () => clearInterval(interval)
  }, [])

  // Ponedeljek: opomni na tedenski pregled
  useEffect(() => {
    const danes = new Date()
    const jeNedelja = danes.getDay() === 0
    const kljuc = `studyos-pregled-opomnik-${danes.toISOString().slice(0, 10)}`
    if (jeNedelja && !localStorage.getItem(kljuc)) {
      setTimeout(() => {
        setTedenski(true)
        localStorage.setItem(kljuc, '1')
      }, 3000)
    }
  }, [])

  // Samodejni dnevni backup ob polnoči
  useEffect(() => {
    const BACKUP_KLJUC = 'studyos-zadnji-backup'

    async function narediBackup() {
      const danes = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem(BACKUP_KLJUC) === danes) return
      try {
        const { pridobiZapiske, pridobiNaloge, pridobiUrnik } = await import('./api.js')
        const [z, n, u] = await Promise.all([pridobiZapiske(), pridobiNaloge(), pridobiUrnik()])
        const podatki = {
          verzija: '2.0', datum: new Date().toISOString(),
          zapiski: z, naloge: n, urnik: u,
        }
        const blob = new Blob([JSON.stringify(podatki, null, 2)], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url
        a.download = `studyos-backup-${danes}.json`
        document.body.appendChild(a); a.click()
        document.body.removeChild(a); URL.revokeObjectURL(url)
        localStorage.setItem(BACKUP_KLJUC, danes)
      } catch {}
    }

    // Preveri ob zagonu
    narediBackup()

    // Preveri vsako uro ali je polnoč
    const interval = setInterval(() => {
      const ura = new Date().getHours()
      const min = new Date().getMinutes()
      if (ura === 0 && min < 5) narediBackup()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  function klikPredmet(id) {
    if (aktivniPredmet === id) { setAktivniPredmet(null) }
    else { setAktivniPredmet(id); if (stran !== 'naloge') setStran('zapiski') }
  }

  function izberiZapisekIzIskanja(zapisek) {
    localStorage.setItem('studyos-zadnji-zapisek', zapisek._id)
    setStran('zapiski')
  }

  const Komponenta = STRANI[stran]?.komponenta ?? Dashboard
  const brezOdmika = stran === 'zapiski'

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />
  if (!prijavljenUporabnik) return (
    <ToastPonudnik>
      <Prijava onPrijava={u => setPrijavljenUporabnik(u)} />
    </ToastPonudnik>
  )

  return (
    <ToastPonudnik>
      <AppKontekst.Provider value={{
        aktivniPredmet, setAktivniPredmet,
        nalogeBadge, setNalogeBadge,
        temno, setTemno,
        setStran, predmeti, shraniPredmete,
        aktivniTag, setAktivniTag,
        vseTagi, setVseTagi,
        barvaAkcent, setBarvaAkcent,
      }}>
        <div className="app-okvir">
          <HamburgerGumb onClick={() => setMobilniMenu(true)} />

          <Sidebar
            stran={stran} setStran={setStran}
            temno={temno} setTemno={setTemno}
            nalogeBadge={nalogeBadge}
            aktivniPredmet={aktivniPredmet}
            setAktivniPredmet={setAktivniPredmet}
            predmeti={predmeti}
            onKlikPredmet={klikPredmet}
            onIskanje={() => setIskanjeOdprto(true)}
            mobilniMenuOdprt={mobilniMenu}
            setMobilniMenuOdprt={setMobilniMenu}
            vseTagi={vseTagi}
            setVseTagi={setVseTagi}
            aktivniTag={aktivniTag}
            setAktivniTag={setAktivniTag}
            onTedenski={() => setTedenski(true)}
            jeOnline={jeOnline}
            onHitraSeja={() => setHitraSeja(true)}
            nedavniZapiski={nedavniZapiski}
            uporabnik={prijavljenUporabnik}
            onOdjava={() => {
              localStorage.removeItem('studyos-jwt')
              localStorage.removeItem('studyos-username')
              localStorage.removeItem('studyos-vloga')
              setPrijavljenUporabnik(null)
            }}
          />

          <main className={`glavna-vsebina ${brezOdmika ? 'brez-odmika' : ''}`}>
            <div key={stran} className="stran-animacija">
              <Komponenta />
            </div>
          </main>
        </div>

        {iskanjeOdprto && (
          <GlobalnoIskanje
            onZapri={() => setIskanjeOdprto(false)}
            onIzberiZapisek={izberiZapisekIzIskanja}
            onNavigiraj={(stran) => { setStran(stran); setIskanjeOdprto(false) }}
          />
        )}

        <PomodoroTimer />

        {bliznjiceOdprte && <TipkovneBliznjice onZapri={() => setBliznjiceOdprte(false)} />}

        {hitroZajem && (
          <HitroZajemanje
            onZapri={() => setHitroZajem(false)}
            onNovZapisek={nov => {
              setStran('zapiski')
              localStorage.setItem('studyos-zadnji-zapisek', nov._id)
            }}
          />
        )}

        {stran !== 'zapiski' && <ZivaUra />}
        <StudyMusic />
        <PwaUpdate />
        <GlobalniAI />

        {hitraSeja && (
          <HitraSeja
            onZapri={() => setHitraSeja(false)}
            onZacniPomo={() => {
              setHitraSeja(false)
              window.dispatchEvent(new CustomEvent('studyos:zacni-pomo'))
            }}
            onOdpriZapiske={(predmetId) => {
              setHitraSeja(false)
              if (predmetId) setAktivniPredmet(predmetId)
              setStran('zapiski')
            }}
          />
        )}

        {tedenski && <TedeniskiPregled onZapri={() => setTedenski(false)} />}

        {/* Dosežek popup */}
        {dosezekPopup && (
          <div className="dosezek-popup" onClick={() => setDosezekPopup(null)}>
            <div className="dosezek-popup-ikona">{dosezekPopup.ikona}</div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--zelena)', marginBottom: 2 }}>
                Dosežek odklenjen!
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{dosezekPopup.ime}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{dosezekPopup.opis}</div>
            </div>
          </div>
        )}
      </AppKontekst.Provider>
    </ToastPonudnik>
  )
}
