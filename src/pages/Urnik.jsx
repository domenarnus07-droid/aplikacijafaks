import { useState, useEffect } from 'react'
import { pridobiUrnik, ustvariUrniskiVnos, posodobiUrniskiVnos, izbrisiUrniskiVnos } from '../api.js'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'

const DNEVI = ['Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek']
const URE   = Array.from({ length: 9 }, (_, i) => i + 8)   // 8..16

const BARVE = [
  '#2563EB','#7C3AED','#DB2777','#059669',
  '#D97706','#DC2626','#0891B2','#65A30D',
]

const PRAZEN_OBRAZEC = { naslov: '', dan: 0, ura: 8, trajanje: 1, barva: '#2563EB', predmet: '' }

// ── Modalni obrazec ───────────────────────────────────────────────────────────
function DogodekModal({ dogodek, onZapri, onShrani, predmeti }) {
  const [obrazec, setObrazec] = useState(dogodek ? { ...dogodek } : PRAZEN_OBRAZEC)
  const [shranjujem, setShranjujem] = useState(false)
  const set = (k, v) => setObrazec(f => ({ ...f, [k]: v }))

  async function oddaj(e) {
    e.preventDefault()
    if (!obrazec.naslov.trim()) { prikaziObvestilo('Naslov je obvezen', 'napaka'); return }
    setShranjujem(true)
    await onShrani(obrazec)
    setShranjujem(false)
    onZapri()
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal">
        <h2 className="modal-naslov">{dogodek?._id ? 'Uredi uro' : 'Dodaj uro'}</h2>
        <form onSubmit={oddaj}>
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Naslov *</label>
            <input className="vhod" value={obrazec.naslov} onChange={e => set('naslov', e.target.value)} placeholder="npr. Predavanja iz Informatike" />
          </div>

          <div className="vnosni-par">
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Dan</label>
              <select className="vhod izbira" value={obrazec.dan} onChange={e => set('dan', +e.target.value)}>
                {DNEVI.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Ura začetka</label>
              <select className="vhod izbira" value={obrazec.ura} onChange={e => set('ura', +e.target.value)}>
                {URE.map(u => <option key={u} value={u}>{u}:00</option>)}
              </select>
            </div>
          </div>

          <div className="vnosni-par" style={{ marginTop: 14 }}>
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Trajanje (ure)</label>
              <select className="vhod izbira" value={obrazec.trajanje} onChange={e => set('trajanje', +e.target.value)}>
                {[1,2,3,4].map(t => <option key={t} value={t}>{t}h</option>)}
              </select>
            </div>
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Predmet</label>
              <select className="vhod izbira" value={obrazec.predmet} onChange={e => set('predmet', e.target.value)}>
                <option value="">Brez predmeta</option>
                {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
              </select>
            </div>
          </div>

          <div className="vnosna-vrstica" style={{ marginTop: 14 }}>
            <label className="vnosna-oznaka">Barva</label>
            <div className="barvni-izbirnik">
              {BARVE.map(b => (
                <button
                  key={b}
                  type="button"
                  className={`barva-gumb ${obrazec.barva === b ? 'izbrana' : ''}`}
                  style={{ background: b }}
                  onClick={() => set('barva', b)}
                />
              ))}
            </div>
          </div>

          <div className="modal-dno">
            <button type="button" className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
            <button type="submit" className="gumb gumb-primarni" disabled={shranjujem}>
              {shranjujem ? '…' : dogodek?._id ? 'Shrani' : 'Dodaj uro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ICS izvoz ─────────────────────────────────────────────────────────────────
function ustvariICS(dogodki) {
  const vrstice = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyOS//FERI//SL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  const danes = new Date()

  dogodki.forEach(d => {
    // Poišči naslednji dan tega tedna
    const targetDay   = d.dan  // 0=Pon, 4=Pet
    const currentDay  = (danes.getDay() + 6) % 7  // 0=Pon
    let daysAhead     = targetDay - currentDay
    if (daysAhead < 0) daysAhead += 7

    const next = new Date(danes)
    next.setDate(danes.getDate() + daysAhead)
    next.setHours(d.ura, 0, 0, 0)

    const end = new Date(next)
    end.setHours(d.ura + d.trajanje, 0, 0, 0)

    const fmt = (dt) => {
      const y = dt.getFullYear()
      const mo = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      const h = String(dt.getHours()).padStart(2, '0')
      const m = String(dt.getMinutes()).padStart(2, '0')
      return `${y}${mo}${day}T${h}${m}00`
    }

    vrstice.push(
      'BEGIN:VEVENT',
      `DTSTART:${fmt(next)}`,
      `DTEND:${fmt(end)}`,
      `RRULE:FREQ=WEEKLY`,
      `SUMMARY:${d.naslov.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${d.predmet || ''}`,
      `UID:${d._id || Date.now()}@studyos`,
      `COLOR:${d.barva || '#2563EB'}`,
      'END:VEVENT'
    )
  })

  vrstice.push('END:VCALENDAR')
  return vrstice.join('\r\n')
}

// ── Seznam pogled ─────────────────────────────────────────────────────────────
function SeznmaPogled({ dogodki, predmeti, danesDan, onUredi, onIzbrisi }) {
  return (
    <div className="urnik-seznam">
      {DNEVI.map((dan, i) => {
        const dDogodki = [...dogodki.filter(d => d.dan === i)].sort((a, b) => a.ura - b.ura)
        return (
          <div key={i} className={`urnik-seznam-dan ${i === danesDan ? 'danes' : ''}`}>
            <div className="urnik-seznam-dan-naslov">
              {dan}
              {i === danesDan && <span className="urnik-danes-znacka">Danes</span>}
            </div>
            {dDogodki.length === 0 ? (
              <div className="urnik-seznam-prazen">Ni ur</div>
            ) : (
              dDogodki.map(d => (
                <div
                  key={d._id}
                  className="urnik-seznam-vnos"
                  style={{ borderLeft: `3px solid ${d.barva}`, background: d.barva + '12' }}
                  onClick={() => onUredi(d)}
                >
                  <div className="urnik-seznam-ura">
                    {d.ura}:00{d.trajanje > 1 ? `–${d.ura + d.trajanje}:00` : ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.naslov}</div>
                    {d.predmet && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginTop: 2 }}>
                        {predmeti.find(p => p.id === d.predmet)?.ikona} {predmeti.find(p => p.id === d.predmet)?.ime ?? d.predmet}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      background: d.barva + '33', color: d.barva,
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                    }}>{d.trajanje}h</span>
                    <button
                      className="gumb-ikona rdeca"
                      style={{ width: 26, height: 26 }}
                      onClick={e => { e.stopPropagation(); onIzbrisi(d._id, e) }}
                      title="Izbriši"
                    >
                      <i className="ti ti-trash" style={{ fontSize: '0.75rem' }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Glavna stran ──────────────────────────────────────────────────────────────
export default function Urnik() {
  const { predmeti } = useApp()
  const [dogodki, setDogodki] = useState([])
  const [nalaga,  setNalaga]  = useState(true)
  const [modal,   setModal]   = useState(null)   // null | {} | event-object
  const [pogled,  setPogled]  = useState('mrezica')  // 'mrezica' | 'seznam'

  useEffect(() => {
    pridobiUrnik().then(setDogodki).finally(() => setNalaga(false))
  }, [])

  function izvozICS() {
    const vsebina = ustvariICS(dogodki)
    const blob = new Blob([vsebina], { type: 'text/calendar;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'studyos-urnik.ics'
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
    prikaziObvestilo('Urnik izvožen kot .ics', 'uspeh')
  }

  async function shrani(obrazec) {
    if (modal?._id) {
      const posodobljen = await posodobiUrniskiVnos(modal._id, obrazec)
      if (posodobljen) {
        setDogodki(ds => ds.map(d => d._id === posodobljen._id ? posodobljen : d))
        prikaziObvestilo('Ura posodobljena', 'uspeh')
      }
    } else {
      const nov = await ustvariUrniskiVnos(obrazec)
      if (nov) {
        setDogodki(ds => [...ds, nov])
        prikaziObvestilo('Ura dodana v urnik', 'uspeh')
      }
    }
  }

  async function izbrisi(id, e) {
    e.stopPropagation()
    if (!confirm('Izbriši to uro iz urnika?')) return
    const ok = await izbrisiUrniskiVnos(id)
    if (ok) {
      setDogodki(ds => ds.filter(d => d._id !== id))
      prikaziObvestilo('Ura izbrisana', 'uspeh')
    }
  }

  // Mapa: `${dan}-${ura}` → dogodki (samo začetna ura)
  const mapaZacetkov = {}
  const mapaZasedenih = new Set()
  dogodki.forEach(d => {
    mapaZacetkov[`${d.dan}-${d.ura}`] = d
    for (let i = 0; i < d.trajanje; i++) {
      mapaZasedenih.add(`${d.dan}-${d.ura + i}`)
    }
  })

  const danesDan = new Date().getDay() === 0 ? -1 : new Date().getDay() - 1  // -1 = vikend

  return (
    <>
      <div className="stran-glava">
        <h1 className="stran-naslov">Urnik</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Pogled preklop */}
          <div className="urnik-pogled-preklop">
            <button
              className={`urnik-pogled-gumb ${pogled === 'mrezica' ? 'aktiven' : ''}`}
              onClick={() => setPogled('mrezica')}
              title="Mreža"
            >
              <i className="ti ti-layout-grid" />
            </button>
            <button
              className={`urnik-pogled-gumb ${pogled === 'seznam' ? 'aktiven' : ''}`}
              onClick={() => setPogled('seznam')}
              title="Seznam"
            >
              <i className="ti ti-list" />
            </button>
          </div>
          {dogodki.length > 0 && (
            <button className="gumb gumb-sekundarni" onClick={izvozICS} title="Izvozi urnik kot .ics (iCal)">
              <i className="ti ti-calendar-down" /> .ics
            </button>
          )}
          <button className="gumb gumb-primarni" onClick={() => setModal({})}>
            <i className="ti ti-plus" /> Dodaj uro
          </button>
        </div>
      </div>
      <p style={{ color: 'var(--besedilo3)', fontSize: '0.82rem', marginBottom: 20 }}>
        {pogled === 'mrezica' ? 'Klikni na prazno celico, da dodaš novo uro.' : 'Klikni na uro za urejanje.'}
      </p>

      {nalaga ? <div className="nalagalnik" /> : pogled === 'seznam' ? (
        <SeznmaPogled
          dogodki={dogodki}
          predmeti={predmeti}
          danesDan={danesDan}
          onUredi={setModal}
          onIzbrisi={izbrisi}
        />
      ) : (
        <div className="urnik-ovoj">
          <div className="urnik-mrezica">
            {/* Glava */}
            <div />
            {DNEVI.map((d, i) => (
              <div key={d} className={`urnik-glava-celica ${i === danesDan ? 'danes' : ''}`}>
                {d}
              </div>
            ))}

            {/* Vrstice ur */}
            {URE.map(ura => (
              <>
                <div key={`t-${ura}`} className="urnik-ura-oznaka">{ura}:00</div>
                {DNEVI.map((_, dan) => {
                  const kljuc = `${dan}-${ura}`
                  const zacetniDogodek = mapaZacetkov[kljuc]
                  const zasedena = mapaZasedenih.has(kljuc) && !zacetniDogodek

                  if (zasedena) {
                    return <div key={kljuc} style={{ background: 'transparent', border: 'none' }} />
                  }

                  return (
                    <div
                      key={kljuc}
                      className="urnik-celica"
                      onClick={() => !zacetniDogodek && setModal({ dan, ura })}
                    >
                      {zacetniDogodek && (
                        <div
                          className="urnik-dogodek"
                          style={{
                            background: zacetniDogodek.barva,
                            height: `calc(${zacetniDogodek.trajanje * 100}% + ${(zacetniDogodek.trajanje - 1) * 5}px)`,
                          }}
                          onClick={e => { e.stopPropagation(); setModal(zacetniDogodek) }}
                        >
                          <span>{zacetniDogodek.naslov}</span>
                          {zacetniDogodek.predmet && (
                            <span className="urnik-dogodek-predmet">
                              {predmeti.find(p => p.id === zacetniDogodek.predmet)?.ime ?? zacetniDogodek.predmet}
                            </span>
                          )}
                          <button
                            className="urnik-brisanje"
                            onClick={e => izbrisi(zacetniDogodek._id, e)}
                            title="Izbriši"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {modal !== null && (
        <DogodekModal
          dogodek={modal._id ? modal : (modal.dan !== undefined ? { ...PRAZEN_OBRAZEC, dan: modal.dan, ura: modal.ura } : null)}
          onZapri={() => setModal(null)}
          onShrani={shrani}
          predmeti={predmeti}
        />
      )}
    </>
  )
}
