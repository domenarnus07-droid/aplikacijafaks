import { useState, useEffect } from 'react'
import { pridobiZapiske, pridobiNaloge, pridobiUrnik } from '../api.js'
import { useApp } from '../App.jsx'

export default function Statistike() {
  const { predmeti } = useApp()
  const [zapiski,  setZapiski]  = useState([])
  const [naloge,   setNaloge]   = useState([])
  const [dogodki,  setDogodki]  = useState([])
  const [nalaga,   setNalaga]   = useState(true)

  useEffect(() => {
    Promise.all([pridobiZapiske(), pridobiNaloge(), pridobiUrnik()])
      .then(([z, n, u]) => { setZapiski(z); setNaloge(n); setDogodki(u) })
      .finally(() => setNalaga(false))
  }, [])

  if (nalaga) return <div className="nalagalnik" />

  // ── Summary ───────────────────────────────────────────────────────────────────
  const skupajZapiskov   = zapiski.length
  const skupajNalog      = naloge.length
  const opravljenihNalog = naloge.filter(n => n.opravljeno).length

  const pomoSesije = (() => {
    try { return JSON.parse(localStorage.getItem('studyos-pomo-sesije') || '[]') } catch { return [] }
  })()
  const skupajFokusMin = pomoSesije.filter(s => s.tip === 'fokus').reduce((a, s) => a + (s.trajanje || 0), 0)
  const skupajSesij    = pomoSesije.filter(s => s.tip === 'fokus').length

  const ocene = (() => {
    try { return JSON.parse(localStorage.getItem('studyos-ocene') || '[]') } catch { return [] }
  })()
  const povprecnaOcena = ocene.length > 0
    ? (ocene.reduce((a, o) => a + o.vrednost, 0) / ocene.length).toFixed(2)
    : null

  // ── Per-subject ───────────────────────────────────────────────────────────────
  const predmetStatistike = predmeti.map(p => {
    const pZ = zapiski.filter(z => z.predmet === p.id)
    const pN = naloge.filter(n => n.predmet === p.id)
    const pO = pN.filter(n => n.opravljeno)
    const pU = dogodki.filter(d => d.predmet === p.id)
    return { ...p, zapiskov: pZ.length, nalog: pN.length, opravljenih: pO.length, ur: pU.length }
  }).filter(p => p.zapiskov > 0 || p.nalog > 0 || p.ur > 0)

  // ── Tags ──────────────────────────────────────────────────────────────────────
  const tagiCount = {}
  zapiski.forEach(z => (z.tagi || []).forEach(t => { tagiCount[t] = (tagiCount[t] || 0) + 1 }))
  naloge.forEach(n  => (n.tagi  || []).forEach(t => { tagiCount[t] = (tagiCount[t] || 0) + 1 }))
  const sortedTagi = Object.entries(tagiCount).sort((a, b) => b[1] - a[1]).slice(0, 24)

  // ── Activity last 30 days ─────────────────────────────────────────────────────
  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const aktivnostDni = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(danes); d.setDate(danes.getDate() - i)
    aktivnostDni[d.toISOString().slice(0, 10)] = 0
  }
  zapiski.forEach(z => { const d = z.ustvarjen?.slice(0, 10); if (d && d in aktivnostDni) aktivnostDni[d]++ })
  naloge.forEach(n  => { const d = n.ustvarjena?.slice(0, 10); if (d && d in aktivnostDni) aktivnostDni[d]++ })
  const maxAkt = Math.max(1, ...Object.values(aktivnostDni))

  // ── Pomodoro last 14 days ─────────────────────────────────────────────────────
  const DNI_KR = ['P','T','S','Č','P','S','N']
  const pomo14Dni = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(danes); d.setDate(danes.getDate() - i)
    pomo14Dni.push(d.toISOString().slice(0, 10))
  }
  const minutePoD = {}
  pomo14Dni.forEach(d => { minutePoD[d] = 0 })
  pomoSesije.filter(s => s.tip === 'fokus').forEach(s => {
    const d = new Date(s.zacetek).toISOString().slice(0, 10)
    if (d in minutePoD) minutePoD[d] += (s.trajanje || 0)
  })
  const maxPomo = Math.max(1, ...Object.values(minutePoD))
  const danesTxt = danes.toISOString().slice(0, 10)

  return (
    <>
      <div className="stran-glava">
        <h1 className="stran-naslov">Statistike</h1>
        <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem' }}>Tvoj napredek v številkah</p>
      </div>

      {/* Summary cards */}
      <div className="stat-mrezica" style={{ marginBottom: 24 }}>
        {[
          { oznaka: 'Skupaj zapiskov',   vrednost: skupajZapiskov,    pod: 'vsi predmeti',            barva: 'var(--modra)'     },
          { oznaka: 'Opravljene naloge', vrednost: opravljenihNalog,  pod: `od ${skupajNalog}`,       barva: 'var(--zelena)'    },
          { oznaka: 'Fokus minut',       vrednost: skupajFokusMin,    pod: `v ${skupajSesij} sejah`,  barva: '#F59E0B'          },
          { oznaka: 'Povprečna ocena',   vrednost: povprecnaOcena ?? '—', pod: ocene.length > 0 ? `${ocene.length} ocen` : 'ni ocen', barva: 'var(--vijolicna)' },
        ].map((s, i) => (
          <div key={i} className="stat-kartica">
            <span className="stat-oznaka">{s.oznaka}</span>
            <span className="stat-vrednost" style={{ color: s.barva }}>{s.vrednost}</span>
            <span className="stat-podnapis">{s.pod}</span>
          </div>
        ))}
      </div>

      {/* Per-subject with progress bars */}
      {predmetStatistike.length > 0 && (
        <div className="kartica" style={{ marginBottom: 20 }}>
          <div className="dash-kartica-naslov">
            <i className="ti ti-chart-bar" style={{ color: 'var(--modra)' }} /> Statistike po predmetih
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {predmetStatistike.map(p => {
              const pct = p.nalog > 0 ? Math.round(p.opravljenih / p.nalog * 100) : 0
              return (
                <div key={p.id} className="stat-predmet-vrstica">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>{p.ikona}</span>
                    <span style={{ fontWeight: 600, flex: 1 }}>{p.ime}</span>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
                      {p.zapiskov > 0 && <span title="Zapiski"><i className="ti ti-notebook" style={{ fontSize: '0.7rem' }} /> {p.zapiskov}</span>}
                      {p.nalog > 0    && <span title="Naloge"><i className="ti ti-check" style={{ fontSize: '0.7rem' }} /> {p.opravljenih}/{p.nalog}</span>}
                      {p.ur > 0       && <span title="Ure v urniku"><i className="ti ti-calendar" style={{ fontSize: '0.7rem' }} /> {p.ur}h</span>}
                    </div>
                  </div>
                  {p.nalog > 0 && (
                    <div style={{ position: 'relative', height: 8, background: 'var(--ozadje3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: p.barva, borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  )}
                  {p.nalog > 0 && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', marginTop: 3, textAlign: 'right' }}>{pct}% opravljenih</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity last 30 days */}
      <div className="kartica" style={{ marginBottom: 20 }}>
        <div className="dash-kartica-naslov">
          <i className="ti ti-activity" style={{ color: 'var(--modra)' }} /> Aktivnost — zadnjih 30 dni
          <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>
            {Object.values(aktivnostDni).reduce((a, b) => a + b, 0)} skupaj
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 64, padding: '4px 0' }}>
          {Object.entries(aktivnostDni).map(([datum, st]) => {
            const h = Math.max(4, Math.round((st / maxAkt) * 60))
            const jeDanes = datum === danesTxt
            return (
              <div key={datum} title={`${datum}: ${st}`} style={{
                flex: 1, height: h, minWidth: 4, alignSelf: 'flex-end',
                background: st > 0 ? (jeDanes ? 'var(--modra)' : 'var(--modra)88') : 'var(--ozadje3)',
                borderRadius: 2, transition: 'height 0.3s',
                border: jeDanes ? '1.5px solid var(--modra)' : 'none',
                boxSizing: 'border-box',
              }} />
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--besedilo3)', marginTop: 4 }}>
          <span>30 dni nazaj</span><span>Danes</span>
        </div>
      </div>

      {/* Tag cloud */}
      {sortedTagi.length > 0 && (
        <div className="kartica" style={{ marginBottom: 20 }}>
          <div className="dash-kartica-naslov">
            <i className="ti ti-tags" style={{ color: 'var(--modra)' }} /> Pogosti tagi
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
            {sortedTagi.map(([t, n]) => (
              <span key={t} className="tag" style={{
                fontSize: `${Math.min(1.15, 0.7 + n * 0.1)}rem`,
                padding: '4px 12px',
                opacity: Math.min(1, 0.55 + n * 0.1),
              }}>
                #{t} <span style={{ fontSize: '0.65em', opacity: 0.65 }}>×{n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pomodoro 14 days */}
      {skupajSesij > 0 && (
        <div className="kartica" style={{ marginBottom: 20 }}>
          <div className="dash-kartica-naslov" style={{ justifyContent: 'space-between' }}>
            <span><i className="ti ti-clock" style={{ color: '#F59E0B' }} /> Pomodoro — zadnjih 14 dni</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
              {skupajFokusMin} min skupaj
            </span>
          </div>
          <div className="pomo-graf">
            {pomo14Dni.map(d => {
              const min = minutePoD[d] || 0
              const dayNum = new Date(d).getDay()
              const kratko = DNI_KR[dayNum === 0 ? 6 : dayNum - 1]
              const jeDanes = d === danesTxt
              const h = Math.max(4, Math.round((min / maxPomo) * 80))
              return (
                <div key={d} className="pomo-graf-stolpec">
                  {min > 0 && <div className="pomo-graf-vrednost">{min}</div>}
                  <div className="pomo-graf-palica" style={{
                    height: h, background: jeDanes ? '#F59E0B' : '#F59E0B88',
                    border: jeDanes ? '2px solid #D97706' : 'none',
                  }} title={`${d}: ${min} min`} />
                  <div className="pomo-graf-oznaka" style={{ color: jeDanes ? '#F59E0B' : 'var(--besedilo3)', fontWeight: jeDanes ? 700 : 400 }}>
                    {kratko}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Naloge po prioriteti */}
      {skupajNalog > 0 && (
        <div className="kartica" style={{ marginBottom: 20 }}>
          <div className="dash-kartica-naslov">
            <i className="ti ti-list-check" style={{ color: 'var(--modra)' }} /> Naloge po prioriteti
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { k: 'visoka',  b: 'var(--rdeca)',  e: '🔴', l: 'Visoka'  },
              { k: 'srednja', b: 'var(--rumena)', e: '🟡', l: 'Srednja' },
              { k: 'nizka',   b: 'var(--zelena)', e: '🟢', l: 'Nizka'   },
            ].map(({ k, b, e, l }) => {
              const vse = naloge.filter(n => n.prioriteta === k)
              const opr = vse.filter(n => n.opravljeno)
              const pct = vse.length > 0 ? Math.round(opr.length / vse.length * 100) : 0
              return (
                <div key={k} style={{
                  flex: 1, minWidth: 120, background: 'var(--ozadje2)',
                  borderRadius: 12, padding: '16px 18px',
                  border: `1.5px solid ${b}44`,
                }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{e}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.6rem', color: b, fontFamily: 'var(--mono)' }}>{vse.length}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--besedilo2)', marginTop: 2, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 4 }}>{opr.length} opr. · {pct}%</div>
                  {vse.length > 0 && (
                    <div style={{ marginTop: 8, height: 4, background: 'var(--ozadje3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: b, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
