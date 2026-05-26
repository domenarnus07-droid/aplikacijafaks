import { useState, useEffect, useRef } from 'react'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'

const POMO_KLJUC  = 'studyos-pomo-casi'
const SESIJE_KLJUC = 'studyos-pomo-sesije'

function beriCase() {
  try {
    const s = localStorage.getItem(POMO_KLJUC)
    if (s) return JSON.parse(s)
  } catch {}
  return { delo: 25, odmor: 5, dolgi: 15 }
}

function beriSesije() {
  try { return JSON.parse(localStorage.getItem(SESIJE_KLJUC) || '[]') } catch { return [] }
}

function shraniSesijo(tip, trajanje) {
  try {
    const sesije = beriSesije()
    sesije.unshift({ tip, zacetek: new Date().toISOString(), trajanje })
    localStorage.setItem(SESIJE_KLJUC, JSON.stringify(sesije.slice(0, 30)))
  } catch {}
}

const BARVE = { delo: '#3B82F6', odmor: '#22C55E', dolgi: '#8B5CF6' }
const IMENA = { delo: 'Fokus', odmor: 'Kratki odmor', dolgi: 'Dolgi odmor' }

const R     = 44
const OBSEG = 2 * Math.PI * R

function formatCas(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })
}

function zazvoni(frekvence = [523, 659, 784], trajanje = 0.6) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    frekvence.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const start = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.25, start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, start + trajanje)
      osc.start(start); osc.stop(start + trajanje + 0.05)
    })
    setTimeout(() => ctx.close(), (frekvence.length * 0.12 + trajanje + 0.2) * 1000)
  } catch {}
}

function shraniSesijoZPredmetom(tip, trajanje, predmet) {
  try {
    const sesije = beriSesije()
    sesije.unshift({ tip, zacetek: new Date().toISOString(), trajanje, predmet: predmet || null })
    localStorage.setItem(SESIJE_KLJUC, JSON.stringify(sesije.slice(0, 30)))
  } catch {}
}

export default function PomodoroTimer() {
  const { predmeti = [] } = useApp()
  const [odprt,         setOdprt]        = useState(false)
  const [faza,          setFaza]         = useState('delo')
  const [casi,          setCasi]         = useState(beriCase)
  const [cas,           setCas]          = useState(() => beriCase().delo * 60)
  const [tece,          setTece]         = useState(false)
  const [skupaj,        setSkupaj]       = useState(0)
  const [pokaziZgod,    setPokazZgod]    = useState(false)
  const [sesije,        setSesije]       = useState(beriSesije)
  const [zvoki,         setZvoki]        = useState(() => localStorage.getItem('studyos-zvoki') !== 'off')
  const [aktivniPredmet, setAktivniPredmet] = useState(() => localStorage.getItem('studyos-pomo-predmet') || '')

  const aktivniPredmetRef = useRef(aktivniPredmet)
  aktivniPredmetRef.current = aktivniPredmet

  const intervalRef = useRef(null)
  const fazeRef     = useRef(faza)
  const skupajRef   = useRef(skupaj)
  const casiRef     = useRef(casi)
  const zvokiRef    = useRef(zvoki)
  fazeRef.current   = faza
  skupajRef.current = skupaj
  casiRef.current   = casi
  zvokiRef.current  = zvoki

  // Poslušaj za zunanji start (Hitra seja)
  useEffect(() => {
    const h = () => {
      window.dispatchEvent(new CustomEvent('studyos:fab-odprt', { detail: 'timer' }))
      setOdprt(true); setTece(true)
    }
    window.addEventListener('studyos:zacni-pomo', h)
    return () => window.removeEventListener('studyos:zacni-pomo', h)
  }, [])

  // Mutual exclusion — zapri ta panel, ko se odpre drug FAB
  useEffect(() => {
    const h = e => { if (e.detail !== 'timer') setOdprt(false) }
    window.addEventListener('studyos:fab-odprt', h)
    return () => window.removeEventListener('studyos:fab-odprt', h)
  }, [])

  // Posodobi čase ob spremembi iz Nastavitve
  useEffect(() => {
    const handler = () => {
      const novi = beriCase()
      setCasi(novi)
      setTece(false)
      setCas(novi[fazeRef.current] * 60)
    }
    window.addEventListener('storage', handler)
    const id = setInterval(() => {
      const novi = beriCase()
      if (JSON.stringify(novi) !== JSON.stringify(casiRef.current)) {
        setCasi(novi)
        if (!intervalRef.current) setCas(novi[fazeRef.current] * 60)
      }
    }, 1000)
    return () => { window.removeEventListener('storage', handler); clearInterval(id) }
  }, [])

  useEffect(() => {
    if (!tece) { clearInterval(intervalRef.current); intervalRef.current = null; return }
    intervalRef.current = setInterval(() => {
      setCas(c => {
        if (c > 1) return c - 1
        clearInterval(intervalRef.current); intervalRef.current = null
        setTece(false)
        const f  = fazeRef.current
        const cs = casiRef.current
        if (f === 'delo') {
          const novi = skupajRef.current + 1
          setSkupaj(novi)
          shraniSesijoZPredmetom('fokus', cs.delo, aktivniPredmetRef.current)
          setSesije(beriSesije())
          const nasl = novi % 4 === 0 ? 'dolgi' : 'odmor'
          setFaza(nasl); setCas(cs[nasl] * 60)
          if (zvokiRef.current) zazvoni([523, 659, 784])
          prikaziObvestilo(`Fokus zaključen! ${IMENA[nasl]} — zdaj!`, 'uspeh')
          // Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('🍅 Fokus timer — Fokus zaključen!', {
              body: `${IMENA[nasl]} čas! (${cs[nasl]} min)`,
            })
          }
        } else {
          shraniSesijoZPredmetom('odmor', cs[f], aktivniPredmetRef.current)
          setSesije(beriSesije())
          setFaza('delo'); setCas(cs.delo * 60)
          if (zvokiRef.current) zazvoni([784, 659, 523])
          prikaziObvestilo('Odmor zaključen. Nazaj na fokus!', 'info')
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('☕ Odmor zaključen!', { body: `Fokus čas: ${cs.delo} min` })
          }
        }
        return 0
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [tece])

  function zamenjaj(k) { setTece(false); setFaza(k); setCas(casi[k] * 60) }
  function ponastavi()  { setTece(false); setCas(casi[faza] * 60) }

  const mm       = String(Math.floor(cas / 60)).padStart(2, '0')
  const ss       = String(cas % 60).padStart(2, '0')
  const napredek = 1 - cas / (casi[faza] * 60)
  const barva    = BARVE[faza]
  const dash     = `${Math.max(0, napredek) * OBSEG} ${OBSEG}`

  return (
    <>
      {/* Plavajoči gumb */}
      <button
        className={`pomo-gumb ${tece ? 'tece' : ''}`}
        style={{ '--pomo': barva }}
        onClick={() => {
          if (!odprt) window.dispatchEvent(new CustomEvent('studyos:fab-odprt', { detail: 'timer' }))
          setOdprt(o => !o)
        }}
        title="Fokus timer"
      >
        {tece
          ? <span className="pomo-gumb-cas">{mm}:{ss}</span>
          : <i className="ti ti-clock" />
        }
      </button>

      {/* Plošča */}
      {odprt && (
        <div className="pomo-ploska" style={{ '--pomo': barva }}>

          {/* Faze */}
          <div className="pomo-faze">
            {Object.keys(BARVE).map(k => (
              <button
                key={k}
                className={`pomo-faza-gumb ${faza === k ? 'aktiven' : ''}`}
                style={faza === k ? { background: BARVE[k], color: '#fff', borderColor: BARVE[k] } : {}}
                onClick={() => zamenjaj(k)}
              >
                {IMENA[k]}
              </button>
            ))}
          </div>

          {/* SVG krog */}
          <div className="pomo-krog-okvir">
            <svg viewBox="0 0 100 100" width="148" height="148">
              <circle cx="50" cy="50" r={R} fill="none" stroke="var(--rob)" strokeWidth="5" />
              <circle
                cx="50" cy="50" r={R}
                fill="none"
                stroke={barva}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={dash}
                strokeDashoffset={OBSEG / 4}
                style={{ transition: tece ? 'stroke-dasharray 0.9s linear' : 'none' }}
              />
            </svg>
            <div className="pomo-krog-tekst">
              <span className="pomo-cas">{mm}:{ss}</span>
              <span className="pomo-faza-ime">{IMENA[faza]}</span>
            </div>
          </div>

          {/* Čas v minutah */}
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--besedilo3)', marginTop: -6 }}>
            {casi[faza]} min · nastavi v <button
              style={{ background: 'none', border: 'none', color: 'var(--modra)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, textDecoration: 'underline' }}
              onClick={() => { setOdprt(false); window.dispatchEvent(new CustomEvent('studyos:pojdi-nastavitve')) }}
            >Nastavitvah</button>
          </div>

          {/* Predmet selector */}
          {predmeti.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
              <i className="ti ti-book" style={{ color: 'var(--besedilo3)', fontSize: '0.8rem', flexShrink: 0 }} />
              <select
                className="vhod izbira"
                style={{ flex: 1, fontSize: '0.78rem', padding: '5px 8px' }}
                value={aktivniPredmet}
                onChange={e => { setAktivniPredmet(e.target.value); localStorage.setItem('studyos-pomo-predmet', e.target.value) }}
                disabled={tece}
                title={tece ? 'Ustavi timer za spremembo predmeta' : 'Izberi predmet za to sejo'}
              >
                <option value="">Brez predmeta</option>
                {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
              </select>
            </div>
          )}

          {/* Zvok toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <button
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.78rem', color: zvoki ? 'var(--zelena)' : 'var(--besedilo3)', display:'flex', alignItems:'center', gap:4 }}
              onClick={() => { const n = !zvoki; setZvoki(n); localStorage.setItem('studyos-zvoki', n ? 'on' : 'off') }}
              title="Preklopi zvoke"
            >
              <i className={`ti ti-${zvoki ? 'volume' : 'volume-off'}`} /> {zvoki ? 'Zvok vkl.' : 'Zvok izkl.'}
            </button>
          </div>

          {/* Kontrole */}
          <div className="pomo-kontrole">
            <button
              className="gumb gumb-primarni"
              style={{ flex: 1, justifyContent: 'center', background: barva, borderColor: barva }}
              onClick={() => setTece(t => !t)}
            >
              <i className={`ti ${tece ? 'ti-player-pause' : 'ti-player-play'}`} />
              {tece ? 'Pavza' : 'Start'}
            </button>
            <button className="gumb gumb-sekundarni" style={{ padding: '9px 14px' }} onClick={ponastavi} title="Ponastavi">
              <i className="ti ti-refresh" />
            </button>
          </div>

          {/* Krogi + sesije */}
          <div className="pomo-krogi">
            {[0, 1, 2, 3].map(i => (
              <span key={i} className="pomo-krog-pika" style={{ background: i < skupaj % 4 ? barva : 'var(--rob)' }} />
            ))}
            <span className="pomo-krogi-st">{skupaj} {skupaj === 1 ? 'fokus' : 'fokusov'}</span>
          </div>

          {/* Zgodovina */}
          <button className="pomo-zgod-toggle" onClick={() => setPokazZgod(z => !z)}>
            <i className={`ti ti-${pokaziZgod ? 'chevron-up' : 'history'}`} />
            {pokaziZgod ? 'Skrij zgodovino' : 'Zgodovina sej'}
          </button>

          {pokaziZgod && (
            <div className="pomo-zgod-seznam">
              {sesije.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', textAlign: 'center', padding: '8px 0' }}>
                  Ni zabeleženih sej.
                </div>
              ) : sesije.slice(0, 8).map((s, i) => (
                <div key={i} className="pomo-zgod-vnos">
                  <span
                    className="pomo-zgod-tip"
                    style={{
                      background: s.tip === 'fokus' ? '#3B82F620' : '#22C55E20',
                      color: s.tip === 'fokus' ? '#3B82F6' : '#22C55E',
                    }}
                  >
                    {s.tip === 'fokus' ? '🎯 Fokus' : '☕ Odmor'}
                  </span>
                  <span style={{ color: 'var(--besedilo3)', flex: 1, fontFamily: 'var(--mono)', fontSize: '0.7rem' }}>
                    {s.trajanje} min
                  </span>
                  <span className="pomo-zgod-cas">{formatCas(s.zacetek)}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </>
  )
}
