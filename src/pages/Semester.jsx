import { useState, useEffect } from 'react'
import { pridobiNaloge, pridobiUrnik } from '../api.js'
import { useApp } from '../App.jsx'

const MESECI_KRATKI = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec']
const MESECI_POLNI  = ['Januar','Februar','Marec','April','Maj','Junij','Julij','Avgust','September','Oktober','November','December']

const PRIVZETI_SEMESTRI = [
  { id: 'zimski',  ime: 'Zimski semester',  od: '2025-10-01', do: '2026-01-31', barva: '#3498db' },
  { id: 'poletni', ime: 'Poletni semester', od: '2026-02-01', do: '2026-06-30', barva: '#27ae60' },
]

function dniDoRoka(d) {
  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const rok = new Date(d); rok.setHours(0, 0, 0, 0)
  return Math.round((rok - danes) / 86400000)
}

function barvaPrioritete(p) {
  if (p === 'visoka') return 'var(--rdeca)'
  if (p === 'srednja') return 'var(--rumena)'
  return 'var(--zelena)'
}

// ── Časovnica dogodkov ────────────────────────────────────────────────────────
function Casovnica({ dogodki, semester }) {
  if (!semester) return null

  const zacetek = new Date(semester.od)
  const konec   = new Date(semester.do)
  const skupajMs = konec - zacetek

  const danes = new Date()

  // Pozicija elementa na časovnici (%)
  function pozicija(d) {
    const dat = new Date(d)
    const procent = Math.max(0, Math.min(100, ((dat - zacetek) / skupajMs) * 100))
    return procent
  }

  // Danes pozicija
  const danesPos = pozicija(danes)
  const jeVSemestru = danes >= zacetek && danes <= konec

  // Mesečne oznake
  const meseci = []
  const d = new Date(zacetek)
  d.setDate(1)
  while (d <= konec) {
    meseci.push({ mesec: d.getMonth(), leto: d.getFullYear(), pos: pozicija(d) })
    d.setMonth(d.getMonth() + 1)
  }

  return (
    <div className="casovnica-okvir">
      {/* Glava */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: semester.barva }} />
        <span style={{ fontWeight: 700 }}>{semester.ime}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--besedilo3)' }}>
          {new Date(semester.od).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })} —
          {new Date(semester.do).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="znacka" style={{ background: semester.barva + '22', color: semester.barva }}>
          {dogodki.length} dogodkov
        </span>
      </div>

      {/* Časovnica palica */}
      <div style={{ position: 'relative', height: 60, marginBottom: 8 }}>
        {/* Ozadje */}
        <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 8, background: 'var(--ozadje3)', borderRadius: 99 }} />

        {/* Polnjeno do danes */}
        {jeVSemestru && (
          <div style={{
            position: 'absolute', top: 24, left: 0, height: 8,
            width: `${danesPos}%`,
            background: `linear-gradient(90deg, ${semester.barva}, ${semester.barva}88)`,
            borderRadius: 99, transition: 'width 0.6s'
          }} />
        )}

        {/* Meseci */}
        {meseci.map((m, i) => (
          <div key={i} style={{ position: 'absolute', top: 34, left: `${m.pos}%`, transform: 'translateX(-50%)' }}>
            <div style={{ width: 1, height: 8, background: 'var(--rob)', margin: '0 auto' }} />
            <div style={{ fontSize: '0.62rem', color: 'var(--besedilo3)', whiteSpace: 'nowrap', marginTop: 2 }}>
              {MESECI_KRATKI[m.mesec]}
            </div>
          </div>
        ))}

        {/* Dogodki */}
        {dogodki.map((d, i) => {
          const pos = pozicija(d.datum)
          const dni = dniDoRoka(d.datum)
          const minul = dni < 0
          return (
            <div key={i} title={`${d.ime} (${new Date(d.datum).toLocaleDateString('sl-SI')})`}
              style={{
                position: 'absolute',
                top: d.tip === 'urnik' ? 8 : 14,
                left: `${pos}%`,
                transform: 'translateX(-50%)',
                zIndex: 2,
              }}>
              <div style={{
                width: d.tip === 'urnik' ? 8 : 12,
                height: d.tip === 'urnik' ? 8 : 12,
                borderRadius: '50%',
                background: minul ? 'var(--besedilo3)' : (d.barva || barvaPrioritete(d.prioriteta)),
                border: !minul ? `2px solid white` : 'none',
                boxShadow: !minul ? `0 0 0 1px ${d.barva || barvaPrioritete(d.prioriteta)}` : 'none',
                opacity: minul ? 0.4 : 1,
                cursor: 'pointer',
              }} />
            </div>
          )
        })}

        {/* Danes oznaka */}
        {jeVSemestru && (
          <div style={{ position: 'absolute', top: 0, left: `${danesPos}%`, transform: 'translateX(-50%)', zIndex: 3 }}>
            <div style={{ width: 2, height: 56, background: semester.barva, borderRadius: 99 }} />
            <div style={{ fontSize: '0.62rem', color: semester.barva, fontWeight: 700, whiteSpace: 'nowrap', marginTop: 2, transform: 'translateX(-50%)', marginLeft: 1 }}>
              Danes
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Kartica dogodka ───────────────────────────────────────────────────────────
function DogodekKartica({ d }) {
  const dni = dniDoRoka(d.datum)
  const minul = dni < 0

  return (
    <div className="semes-kartica" style={{ opacity: minul ? 0.55 : 1, borderLeftColor: d.barva || barvaPrioritete(d.prioriteta) }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 56, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1, color: minul ? 'var(--besedilo3)' : 'var(--besedilo1)' }}>
            {new Date(d.datum).getDate()}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--besedilo3)' }}>
            {MESECI_KRATKI[new Date(d.datum).getMonth()]}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{d.ime}</div>
          {d.predmet && <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginTop: 2 }}>{d.predmet}</div>}
        </div>
        <div>
          {minul ? (
            <span style={{ fontSize: '0.68rem', color: 'var(--besedilo3)' }}>Minulo</span>
          ) : dni === 0 ? (
            <span style={{ fontSize: '0.68rem', color: 'var(--rumena)', fontWeight: 700 }}>Danes!</span>
          ) : (
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--mono)', color: dni <= 7 ? 'var(--rdeca)' : 'var(--besedilo3)', fontWeight: dni <= 7 ? 700 : 400 }}>
              {dni}d
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Cilji semestra ────────────────────────────────────────────────────────────
const CILJI_KLJUC = 'studyos-sem-cilji'
function beriCilje() { try { return JSON.parse(localStorage.getItem(CILJI_KLJUC) || '{}') } catch { return {} } }
function shraniCilje(c) { try { localStorage.setItem(CILJI_KLJUC, JSON.stringify(c)) } catch {} }

function CiljiSemestra({ predmeti, ocene }) {
  const [cilji, setCilji] = useState(beriCilje)
  const [uredi, setUredi] = useState(false)

  function nastavi(predId, vrednost) {
    const novi = { ...cilji, [predId]: vrednost }
    setCilji(novi); shraniCilje(novi)
  }

  // Povprečna ocena po predmetu iz localStorage ocen
  function povprecjeZaPredmet(predId) {
    try {
      const oc = JSON.parse(localStorage.getItem('studyos-ocene') || '[]')
      const filtrirane = oc.filter(o => o.predmet === predId && o.ocena)
      if (filtrirane.length === 0) return null
      return (filtrirane.reduce((s, o) => s + parseFloat(o.ocena), 0) / filtrirane.length).toFixed(1)
    } catch { return null }
  }

  return (
    <div className="kartica" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-target" style={{ color: 'var(--modra)' }} /> Cilji semestra
        </span>
        <button className="gumb-ikona" onClick={() => setUredi(u => !u)} title="Uredi cilje">
          <i className={`ti ti-${uredi ? 'check' : 'edit'}`} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {predmeti.map(p => {
          const cilj = parseFloat(cilji[p.id]) || 0
          const trenutna = povprecjeZaPredmet(p.id)
          const dosegli = trenutna && parseFloat(trenutna) >= cilj
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1rem', width: 24 }}>{p.ikona}</span>
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{p.ime}</span>
              {trenutna && (
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', color: dosegli ? 'var(--zelena)' : 'var(--besedilo3)', fontWeight: 600 }}>
                  {trenutna} {dosegli ? '✓' : ''}
                </span>
              )}
              {uredi ? (
                <input
                  type="number" min={1} max={10} step={0.5}
                  className="vhod"
                  style={{ width: 70, textAlign: 'center', fontSize: '0.85rem', padding: '5px 8px' }}
                  value={cilji[p.id] || ''}
                  onChange={e => nastavi(p.id, e.target.value)}
                  placeholder="Cilj"
                />
              ) : (
                <div style={{ width: 100 }}>
                  <div style={{ height: 6, background: 'var(--ozadje3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: dosegli ? 'var(--zelena)' : p.barva,
                      width: cilj > 0 && trenutna ? `${Math.min(100, (parseFloat(trenutna) / cilj) * 100)}%` : '0%',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', marginTop: 2, textAlign: 'right' }}>
                    {cilj > 0 ? `cilj: ${cilj}` : <span style={{ color: 'var(--besedilo3)', fontStyle: 'italic' }}>ni nastavljeno</span>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Glavna stran ──────────────────────────────────────────────────────────────
export default function Semester() {
  const { predmeti } = useApp()
  const [naloge,     setNaloge]     = useState([])
  const [urnik,      setUrnik]      = useState([])
  const [nalaga,     setNalaga]     = useState(true)
  const [semestri,   setSemestri]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyos-semestri') || 'null') || PRIVZETI_SEMESTRI }
    catch { return PRIVZETI_SEMESTRI }
  })
  const [aktivniSem, setAktivniSem] = useState(() => {
    const danes = new Date()
    const id = PRIVZETI_SEMESTRI.find(s => new Date(s.od) <= danes && danes <= new Date(s.do))?.id
    return id || PRIVZETI_SEMESTRI[0].id
  })
  const [filtriraMesec, setFiltriraMesec] = useState(null)
  const [urejamSem, setUrejamSem] = useState(false)
  const [novSem, setNovSem] = useState({ ime: '', od: '', do: '', barva: '#3498db' })

  useEffect(() => {
    Promise.all([pridobiNaloge(), pridobiUrnik()]).then(([ns, us]) => {
      setNaloge(ns)
      setUrnik(us)
    }).finally(() => setNalaga(false))
  }, [])

  const semester = semestri.find(s => s.id === aktivniSem)

  // Zberi dogodke za ta semester
  const dogodki = []

  // Naloge z rokom
  naloge.filter(n => !n.opravljeno && n.rok).forEach(n => {
    const dat = new Date(n.rok)
    if (!semester || (dat >= new Date(semester.od) && dat <= new Date(semester.do))) {
      const predmet = predmeti.find(p => p.id === n.predmet)
      dogodki.push({
        datum: n.rok,
        ime: n.besedilo,
        tip: 'naloga',
        prioriteta: n.prioriteta,
        predmet: predmet ? `${predmet.ikona} ${predmet.ime}` : null,
        barva: barvaPrioritete(n.prioriteta),
      })
    }
  })

  // Urnik (enkratni dogodki — brez ponavljajočih)
  urnik.filter(u => u.datum).forEach(u => {
    const dat = new Date(u.datum)
    if (!semester || (dat >= new Date(semester.od) && dat <= new Date(semester.do))) {
      const predmet = predmeti.find(p => p.id === u.predmet)
      dogodki.push({
        datum: u.datum,
        ime: u.ime || u.predmet,
        tip: 'urnik',
        predmet: predmet ? `${predmet.ikona} ${predmet.ime}` : null,
        barva: predmet?.barva || 'var(--modra)',
      })
    }
  })

  // Razvrsti po datumu
  dogodki.sort((a, b) => new Date(a.datum) - new Date(b.datum))

  // Filtrirani po mesecu
  const filtrirani = filtriraMesec !== null
    ? dogodki.filter(d => new Date(d.datum).getMonth() === filtriraMesec)
    : dogodki

  // Prihajajočih 7 dni
  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const prihajajoci = dogodki.filter(d => {
    const dni = dniDoRoka(d.datum)
    return dni >= 0 && dni <= 14
  })

  // Meseci tega semestra
  const meseci = []
  if (semester) {
    const d = new Date(semester.od); d.setDate(1)
    const konec = new Date(semester.do)
    while (d <= konec) {
      meseci.push({ mesec: d.getMonth(), leto: d.getFullYear() })
      d.setMonth(d.getMonth() + 1)
    }
  }

  function dodajSemester() {
    if (!novSem.ime || !novSem.od || !novSem.do) return
    const ns = [...semestri, { ...novSem, id: `sem-${Date.now()}` }]
    setSemestri(ns)
    localStorage.setItem('studyos-semestri', JSON.stringify(ns))
    setNovSem({ ime: '', od: '', do: '', barva: '#3498db' })
    setUrejamSem(false)
  }

  return (
    <div>
      <div className="stran-glava">
        <h1 className="stran-naslov">
          <i className="ti ti-timeline" style={{ color: 'var(--modra)', marginRight: 8 }} />
          Semesterski pregled
        </h1>
        <button className="gumb gumb-sekundarni" style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          onClick={() => setUrejamSem(u => !u)}>
          <i className="ti ti-settings" /> Semestri
        </button>
      </div>

      {/* Izbira semestra */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {semestri.map(s => (
          <button
            key={s.id}
            className={`filter-gumb ${aktivniSem === s.id ? 'aktiven' : ''}`}
            style={aktivniSem === s.id ? { borderColor: s.barva, color: s.barva, background: s.barva + '15' } : {}}
            onClick={() => setAktivniSem(s.id)}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.barva, display: 'inline-block', marginRight: 6 }} />
            {s.ime}
          </button>
        ))}
      </div>

      {/* Nastavitve semestrov */}
      {urejamSem && (
        <div className="kartica" style={{ marginBottom: 16, padding: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Dodaj semester</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input className="vhod" style={{ flex: 1, minWidth: 150 }} placeholder="Ime semestra" value={novSem.ime} onChange={e => setNovSem(n => ({ ...n, ime: e.target.value }))} />
            <input className="vhod" type="date" value={novSem.od} onChange={e => setNovSem(n => ({ ...n, od: e.target.value }))} />
            <input className="vhod" type="date" value={novSem.do} onChange={e => setNovSem(n => ({ ...n, do: e.target.value }))} />
            <input type="color" value={novSem.barva} onChange={e => setNovSem(n => ({ ...n, barva: e.target.value }))}
              style={{ width: 42, height: 38, borderRadius: 8, border: '1px solid var(--rob)', cursor: 'pointer', padding: 2 }} />
            <button className="gumb gumb-primarni" onClick={dodajSemester}><i className="ti ti-plus" /> Dodaj</button>
          </div>
        </div>
      )}

      {nalaga ? (
        <div className="nalagalnik" />
      ) : (
        <>
          {/* Cilji semestra */}
          <CiljiSemestra predmeti={predmeti} />

          {/* Časovnica */}
          {semester && (
            <div className="kartica" style={{ marginBottom: 16 }}>
              <Casovnica dogodki={dogodki} semester={semester} />
            </div>
          )}

          {/* Prihajajoci */}
          {prihajajoci.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-alert-triangle" style={{ color: 'var(--rumena)' }} />
                Prihajajoče (14 dni)
                <span className="znacka" style={{ background: 'var(--rumena)22', color: 'var(--rumena)' }}>{prihajajoci.length}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {prihajajoci.map((d, i) => <DogodekKartica key={i} d={d} />)}
              </div>
            </div>
          )}

          {/* Filter po mesecu */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <button className={`filter-gumb ${filtriraMesec === null ? 'aktiven' : ''}`} onClick={() => setFiltriraMesec(null)}>
              Vsi meseci
            </button>
            {meseci.map(m => {
              const st = dogodki.filter(d => new Date(d.datum).getMonth() === m.mesec).length
              return st > 0 ? (
                <button key={m.mesec} className={`filter-gumb ${filtriraMesec === m.mesec ? 'aktiven' : ''}`}
                  onClick={() => setFiltriraMesec(m.mesec === filtriraMesec ? null : m.mesec)}>
                  {MESECI_KRATKI[m.mesec]} <span style={{ opacity: 0.6 }}>({st})</span>
                </button>
              ) : null
            })}
          </div>

          {/* Seznam vseh dogodkov */}
          {filtrirani.length === 0 ? (
            <div className="prazno-stanje">
              <div className="prazno-ikona">📅</div>
              <p>Ni dogodkov za ta semester.</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--besedilo3)' }}>Dodaj naloge z rokom oddaje v Naloge</p>
            </div>
          ) : (
            <div>
              {/* Grupiraj po mesecu */}
              {(filtriraMesec !== null ? [filtriraMesec] : [...new Set(filtrirani.map(d => new Date(d.datum).getMonth()))]).map(mes => {
                const mesDogodk = filtrirani.filter(d => new Date(d.datum).getMonth() === mes)
                if (mesDogodk.length === 0) return null
                return (
                  <div key={mes} style={{ marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.88rem', color: 'var(--besedilo2)' }}>
                      {MESECI_POLNI[mes]}
                      <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--besedilo3)', fontSize: '0.78rem' }}>({mesDogodk.length})</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {mesDogodk.map((d, i) => <DogodekKartica key={i} d={d} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
