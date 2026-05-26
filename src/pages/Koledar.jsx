import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'

function beriLS(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }

const IME_DNI = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']
const IME_MESECEV = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
                     'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December']

function zacetekTedna(d) {
  const klon = new Date(d); klon.setHours(0,0,0,0)
  const dn = klon.getDay()
  klon.setDate(klon.getDate() - (dn === 0 ? 6 : dn - 1))
  return klon
}

export default function Koledar() {
  const { predmeti } = useApp()
  const [danes]   = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [mesec,    setMesec]   = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [pogled,   setPogled]  = useState('mesec') // 'mesec' | 'teden'
  const [izpiti,   setIzpiti]  = useState([])
  const [naloge,   setNaloge]  = useState([])
  const [izbraniDan, setIzbraniDan] = useState(null)

  useEffect(() => {
    setIzpiti(beriLS('studyos-izpiti'))
    setNaloge(beriLS('studyos-local-naloge'))
  }, [])

  // ── Zberi vse dogodke za datum ─────────────────────────────────────────────
  function dogodkiZaDan(dan) {
    const isoDay = dan.toISOString().slice(0, 10)
    const iz = izpiti.filter(i => i.datum?.slice(0, 10) === isoDay && !i.opravljeno)
    const nl = naloge.filter(n => n.rok?.slice(0, 10) === isoDay && !n.opravljeno)
    return { izpiti: iz, naloge: nl }
  }

  // ── Mesečni pogled ─────────────────────────────────────────────────────────
  function dniVMesecu() {
    const y = mesec.getFullYear(), m = mesec.getMonth()
    const prvic = new Date(y, m, 1)
    const zacetek = zacetekTedna(prvic)
    const dnevi = []
    const cur = new Date(zacetek)
    while (dnevi.length < 42) {
      dnevi.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return dnevi
  }

  // ── Tedenski pogled ────────────────────────────────────────────────────────
  const [teden, setTeden] = useState(() => zacetekTedna(new Date()))

  function dniVTednu() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(teden); d.setDate(d.getDate() + i); return d
    })
  }

  const dnevi = pogled === 'mesec' ? dniVMesecu() : dniVTednu()
  const prikazaniDogodki = izbraniDan ? dogodkiZaDan(izbraniDan) : null

  return (
    <>
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov">Koledar rokov</h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem', marginTop: 4 }}>
            Izpitni roki in naloge z rokom
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`gumb ${pogled === 'mesec' ? 'gumb-primarni' : 'gumb-sekundarni'}`} onClick={() => setPogled('mesec')}>
            <i className="ti ti-calendar-month" /> Mesec
          </button>
          <button className={`gumb ${pogled === 'teden' ? 'gumb-primarni' : 'gumb-sekundarni'}`} onClick={() => setPogled('teden')}>
            <i className="ti ti-calendar-week" /> Teden
          </button>
        </div>
      </div>

      <div className="kartica" style={{ marginBottom: 20 }}>
        {/* Navigacija */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button className="gumb-ikona" onClick={() => {
            if (pogled === 'mesec') {
              setMesec(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            } else {
              setTeden(t => { const n = new Date(t); n.setDate(n.getDate() - 7); return n })
            }
          }}>
            <i className="ti ti-chevron-left" />
          </button>

          <div style={{ fontWeight: 700, fontSize: '1rem' }}>
            {pogled === 'mesec'
              ? `${IME_MESECEV[mesec.getMonth()]} ${mesec.getFullYear()}`
              : (() => {
                  const konec = new Date(teden); konec.setDate(konec.getDate() + 6)
                  return `${teden.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })} – ${konec.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' })}`
                })()
            }
          </div>

          <button className="gumb-ikona" onClick={() => {
            if (pogled === 'mesec') {
              setMesec(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            } else {
              setTeden(t => { const n = new Date(t); n.setDate(n.getDate() + 7); return n })
            }
          }}>
            <i className="ti ti-chevron-right" />
          </button>
        </div>

        {/* Glave dni */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {IME_DNI.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--besedilo3)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Celice */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {dnevi.map((dan, i) => {
            const { izpiti: iz, naloge: nl } = dogodkiZaDan(dan)
            const jeCurrentMesec = pogled === 'teden' || dan.getMonth() === mesec.getMonth()
            const jeDanes = dan.getTime() === danes.getTime()
            const jeIzbran = izbraniDan?.getTime() === dan.getTime()
            const imaDogodke = iz.length > 0 || nl.length > 0

            return (
              <div
                key={i}
                onClick={() => setIzbraniDan(jeIzbran ? null : dan)}
                style={{
                  minHeight: pogled === 'mesec' ? 64 : 80,
                  borderRadius: 8,
                  border: `1.5px solid ${jeIzbran ? 'var(--modra)' : jeDanes ? 'var(--modra)44' : 'var(--rob)'}`,
                  background: jeIzbran ? 'var(--modra)11' : jeDanes ? 'var(--modra)08' : 'var(--ozadje1)',
                  padding: '6px 6px 4px',
                  cursor: imaDogodke ? 'pointer' : 'default',
                  opacity: jeCurrentMesec ? 1 : 0.35,
                  transition: 'border 0.15s, background 0.15s',
                }}
              >
                <div style={{
                  fontSize: '0.78rem', fontWeight: jeDanes ? 800 : 600,
                  color: jeDanes ? 'var(--modra)' : 'var(--besedilo1)',
                  marginBottom: 3,
                }}>
                  {dan.getDate()}
                </div>
                {iz.slice(0, 2).map(ev => (
                  <div key={ev._id} style={{
                    fontSize: '0.6rem', borderRadius: 4, padding: '1px 4px', marginBottom: 2,
                    background: 'var(--modra)', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={ev.naziv}>
                    📅 {ev.naziv}
                  </div>
                ))}
                {nl.slice(0, 2).map(n => (
                  <div key={n._id} style={{
                    fontSize: '0.6rem', borderRadius: 4, padding: '1px 4px', marginBottom: 2,
                    background: '#F59E0B', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={n.besedilo}>
                    ✅ {n.besedilo}
                  </div>
                ))}
                {(iz.length + nl.length > 2) && (
                  <div style={{ fontSize: '0.58rem', color: 'var(--besedilo3)' }}>
                    +{iz.length + nl.length - 2} več
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.72rem', color: 'var(--besedilo3)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--modra)', marginRight: 5 }} />Izpit</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#F59E0B', marginRight: 5 }} />Rok naloge</span>
        </div>
      </div>

      {/* Detail panel za izbrani dan */}
      {izbraniDan && prikazaniDogodki && (
        <div className="kartica">
          <div className="dash-kartica-naslov" style={{ marginBottom: 12 }}>
            <i className="ti ti-calendar-event" />
            {izbraniDan.toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            <button className="gumb-ikona" style={{ marginLeft: 'auto' }} onClick={() => setIzbraniDan(null)}>
              <i className="ti ti-x" />
            </button>
          </div>

          {prikazaniDogodki.izpiti.length === 0 && prikazaniDogodki.naloge.length === 0 ? (
            <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem' }}>Ni dogodkov ta dan.</p>
          ) : (
            <>
              {prikazaniDogodki.izpiti.map(iz => {
                const pred = predmeti.find(p => p.id === iz.predmet)
                return (
                  <div key={iz._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 10, border: '1.5px solid var(--modra)44',
                    background: 'var(--modra)0A', marginBottom: 8,
                  }}>
                    <div style={{ fontSize: '1.4rem' }}>{pred?.ikona ?? '📅'}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{iz.naziv}</div>
                      {pred && <div style={{ fontSize: '0.75rem', color: pred.barva }}>{pred.ime}</div>}
                      {iz.lokacija && <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>📍 {iz.lokacija}</div>}
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'var(--modra)', color: '#fff', borderRadius: 6, padding: '2px 8px' }}>Izpit</span>
                  </div>
                )
              })}
              {prikazaniDogodki.naloge.map(n => {
                const pred = predmeti.find(p => p.id === n.predmet)
                return (
                  <div key={n._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 10, border: '1.5px solid #F59E0B44',
                    background: '#F59E0B0A', marginBottom: 8,
                  }}>
                    <div style={{ fontSize: '1.4rem' }}>✅</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{n.besedilo}</div>
                      {pred && <div style={{ fontSize: '0.75rem', color: pred.barva }}>{pred.ikona} {pred.ime}</div>}
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: '#F59E0B', color: '#fff', borderRadius: 6, padding: '2px 8px' }}>Rok</span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </>
  )
}
