import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'

function beriLS(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }

const IME_DNI     = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']
const IME_MESECEV = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
                     'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December']

function enakaDan(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function zacetekTedna(d) {
  const k = new Date(d); k.setHours(0, 0, 0, 0)
  const dn = k.getDay()
  k.setDate(k.getDate() - (dn === 0 ? 6 : dn - 1))
  return k
}

export default function Koledar() {
  const { predmeti } = useApp()
  const danes = new Date(); danes.setHours(0, 0, 0, 0)

  const [mesec,      setMesec]      = useState(() => new Date(danes.getFullYear(), danes.getMonth(), 1))
  const [teden,      setTeden]      = useState(() => zacetekTedna(danes))
  const [pogled,     setPogled]     = useState('teden')
  const [izbraniDan, setIzbraniDan] = useState(null)
  const [izpiti,     setIzpiti]     = useState([])
  const [naloge,     setNaloge]     = useState([])

  useEffect(() => {
    setIzpiti(beriLS('studyos-izpiti'))
    setNaloge(beriLS('studyos-local-naloge'))
  }, [])

  function dogodkiZaDan(dan) {
    const iso = dan.toISOString().slice(0, 10)
    return {
      izpiti: izpiti.filter(i => i.datum?.slice(0, 10) === iso && !i.opravljeno),
      naloge: naloge.filter(n => n.rok?.slice(0, 10) === iso && !n.opravljeno),
    }
  }

  // ── Generiranje dni ────────────────────────────────────────────────────────
  function dniMeseca() {
    const y = mesec.getFullYear(), m = mesec.getMonth()
    const zac = zacetekTedna(new Date(y, m, 1))
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(zac); d.setDate(d.getDate() + i); return d
    })
  }

  function dniTedna() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(teden); d.setDate(d.getDate() + i); return d
    })
  }

  const dnevi = pogled === 'mesec' ? dniMeseca() : dniTedna()

  function navNazaj() {
    if (pogled === 'mesec') setMesec(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
    else setTeden(t => { const n = new Date(t); n.setDate(n.getDate() - 7); return n })
  }
  function navNaprej() {
    if (pogled === 'mesec') setMesec(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
    else setTeden(t => { const n = new Date(t); n.setDate(n.getDate() + 7); return n })
  }

  function naslovObdobja() {
    if (pogled === 'mesec') return `${IME_MESECEV[mesec.getMonth()]} ${mesec.getFullYear()}`
    const konec = new Date(teden); konec.setDate(konec.getDate() + 6)
    return `${teden.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })} – ${konec.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const prikazaniDogodki = izbraniDan ? dogodkiZaDan(izbraniDan) : null

  return (
    <>
      {/* ── Glava ── */}
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov"><i className="ti ti-calendar-event" /> Koledar rokov</h1>
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

      {/* ── Kalendar kartica ── */}
      <div className="kartica" style={{ marginBottom: 20, padding: '20px 20px 16px' }}>

        {/* Navigacija */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button className="gumb-ikona" onClick={navNazaj}><i className="ti ti-chevron-left" /></button>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{naslovObdobja()}</span>
          <button className="gumb-ikona" onClick={navNaprej}><i className="ti ti-chevron-right" /></button>
        </div>

        {/* Glave dni */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 3,
          marginBottom: 3,
        }}>
          {IME_DNI.map(d => (
            <div key={d} style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--besedilo3)',
              padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Celice */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 3,
        }}>
          {dnevi.map((dan, i) => {
            const { izpiti: iz, naloge: nl } = dogodkiZaDan(dan)
            const jeDanes  = enakaDan(dan, danes)
            const jeIzbran = izbraniDan && enakaDan(dan, izbraniDan)
            const vMesecu  = pogled === 'teden' || dan.getMonth() === mesec.getMonth()
            const imaDog   = iz.length > 0 || nl.length > 0

            let borderClr = 'var(--rob)'
            let bgClr     = 'var(--ozadje2)'
            if (jeIzbran) { borderClr = 'var(--modra)'; bgClr = 'color-mix(in srgb, var(--modra) 12%, transparent)' }

            return (
              <div
                key={i}
                onClick={() => setIzbraniDan(jeIzbran ? null : new Date(dan))}
                style={{
                  minHeight: pogled === 'mesec' ? 68 : 88,
                  borderRadius: 8,
                  border: `1.5px solid ${borderClr}`,
                  background: bgClr,
                  padding: '6px 7px 4px',
                  cursor: imaDog ? 'pointer' : 'default',
                  opacity: vMesecu ? 1 : 0.3,
                  transition: 'border-color 0.15s, background 0.15s',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: jeDanes ? 800 : 600,
                  color: 'var(--besedilo1)',
                  marginBottom: 3,
                }}>
                  {dan.getDate()}
                </div>

                {iz.slice(0, 2).map(ev => (
                  <div key={ev._id} style={{
                    fontSize: '0.58rem', borderRadius: 3, padding: '1px 4px', marginBottom: 2,
                    background: 'var(--modra)', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={ev.naziv}>
                    {ev.naziv}
                  </div>
                ))}
                {nl.slice(0, 2).map(n => (
                  <div key={n._id || n.id} style={{
                    fontSize: '0.58rem', borderRadius: 3, padding: '1px 4px', marginBottom: 2,
                    background: '#F59E0B', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={n.besedilo}>
                    {n.besedilo}
                  </div>
                ))}
                {(iz.length + nl.length > 2) && (
                  <div style={{ fontSize: '0.55rem', color: 'var(--besedilo3)', marginTop: 1 }}>
                    +{iz.length + nl.length - 2} več
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.72rem', color: 'var(--besedilo3)', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--modra)', display: 'inline-block' }} /> Izpit
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B', display: 'inline-block' }} /> Rok naloge
          </span>
        </div>
      </div>

      {/* ── Detail panel za izbrani dan ── */}
      {izbraniDan && (
        <div className="kartica">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <i className="ti ti-calendar-event" style={{ color: 'var(--modra)', fontSize: '1.1rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {izbraniDan.toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button className="gumb-ikona" style={{ marginLeft: 'auto', width: 28, height: 28 }} onClick={() => setIzbraniDan(null)}>
              <i className="ti ti-x" style={{ fontSize: '0.75rem' }} />
            </button>
          </div>

          {prikazaniDogodki && prikazaniDogodki.izpiti.length === 0 && prikazaniDogodki.naloge.length === 0 ? (
            <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem' }}>Ni dogodkov ta dan.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prikazaniDogodki?.izpiti.map(iz => {
                const pred = predmeti.find(p => p.id === iz.predmet)
                return (
                  <div key={iz._id} className="kol-event izpit" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid var(--modra)',
                    background: 'color-mix(in srgb, var(--modra) 8%, transparent)',
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>{pred?.ikona ?? '📅'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{iz.naziv}</div>
                      {pred && <div style={{ fontSize: '0.75rem', color: pred.barva }}>{pred.ime}</div>}
                      {iz.lokacija && <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>📍 {iz.lokacija}</div>}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: '0.72rem', background: 'var(--modra)', color: '#fff', borderRadius: 6, padding: '2px 8px' }}>Izpit</span>
                  </div>
                )
              })}
              {prikazaniDogodki?.naloge.map(n => {
                const pred = predmeti.find(p => p.id === n.predmet)
                return (
                  <div key={n._id || n.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #F59E0B',
                    background: 'color-mix(in srgb, #F59E0B 8%, transparent)',
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>✅</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{n.besedilo}</div>
                      {pred && <div style={{ fontSize: '0.75rem', color: pred.barva }}>{pred.ikona} {pred.ime}</div>}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: '0.72rem', background: '#F59E0B', color: '#fff', borderRadius: 6, padding: '2px 8px' }}>Rok</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
