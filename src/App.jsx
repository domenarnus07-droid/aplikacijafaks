import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { registrirajToast } from './toast.js'
import Dashboard        from './pages/Dashboard.jsx'
import Zapiski          from './pages/Zapiski.jsx'
import Urnik            from './pages/Urnik.jsx'
import Naloge           from './pages/Naloge.jsx'
import Nastavitve       from './pages/Nastavitve.jsx'
import Ocene            from './pages/Ocene.jsx'
import Statistike       from './pages/Statistike.jsx'
import GlobalnoIskanje  from './components/GlobalnoIskanje.jsx'
import PomodoroTimer    from './components/PomodoroTimer.jsx'
import SplashScreen     from './components/SplashScreen.jsx'
import TipkovneBliznjice from './components/TipkovneBliznjice.jsx'
import HitroZajemanje   from './components/HitroZajemanje.jsx'

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
  nastavitve: { oznaka: 'Nastavitve', ikona: 'ti-settings',         komponenta: Nastavitve },
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ stran, setStran, temno, setTemno, nalogeBadge,
                   aktivniPredmet, setAktivniPredmet, predmeti,
                   onKlikPredmet, onIskanje, mobilniMenuOdprt, setMobilniMenuOdprt,
                   vseTagi, aktivniTag, setAktivniTag }) {
  return (
    <>
      {mobilniMenuOdprt && (
        <div className="mobilni-overlay" onClick={() => setMobilniMenuOdprt(false)} />
      )}

      <aside className={`sidebar ${mobilniMenuOdprt ? 'mobilni-odprt' : ''}`}>
        <div className="sidebar-logotip">
          <div className="sidebar-logotip-ikona">🎓</div>
          <span className="sidebar-logotip-besedilo">Study<span className="sidebar-logotip-pika">OS</span></span>
          <button className="sidebar-zapri-mobilni" onClick={() => setMobilniMenuOdprt(false)}>
            <i className="ti ti-x" />
          </button>
        </div>

        <button className="sidebar-iskanje-gumb" onClick={onIskanje} title="Ctrl+K">
          <i className="ti ti-search" /><span>Iskanje…</span><kbd>Ctrl+K</kbd>
        </button>

        <div className="sidebar-sekcija">
          <div className="sidebar-sekcija-naslov">Navigacija</div>
          {['pregled', 'zapiski', 'urnik', 'naloge', 'ocene', 'statistike'].map(k => (
            <button key={k} className={`nav-element ${stran === k ? 'aktiven' : ''}`}
              onClick={() => { setStran(k); setMobilniMenuOdprt(false) }}>
              <i className={`nav-ikona ti ${STRANI[k].ikona}`} />
              {STRANI[k].oznaka}
              {k === 'naloge' && nalogeBadge > 0 && <span className="znacka">{nalogeBadge}</span>}
            </button>
          ))}
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
          <button className={`nav-element ${stran === 'nastavitve' ? 'aktiven' : ''}`}
            onClick={() => { setStran('nastavitve'); setMobilniMenuOdprt(false) }}>
            <i className={`nav-ikona ti ${STRANI.nastavitve.ikona}`} />{STRANI.nastavitve.oznaka}
          </button>
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

export default function App() {
  const [splash,          setSplash]          = useState(true)
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
  const [vseTagi,         setVseTagi]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyos-tagi-cache') || '[]') } catch { return [] }
  })
  const [barvaAkcent,     setBarvaAkcent]     = useState(() =>
    localStorage.getItem('studyos-barva-akcent') || '#2563EB'
  )

  useEffect(() => {
    document.body.classList.toggle('temno', temno)
    localStorage.setItem('studyos-tema', temno ? 'temno' : 'svetlo')
  }, [temno])

  useEffect(() => {
    document.title = `${STRANI[stran]?.oznaka ?? 'Pregled'} · StudyOS`
  }, [stran])

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
            aktivniTag={aktivniTag}
            setAktivniTag={setAktivniTag}
          />

          <main className={`glavna-vsebina ${brezOdmika ? 'brez-odmika' : ''}`}>
            <Komponenta />
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
      </AppKontekst.Provider>
    </ToastPonudnik>
  )
}
