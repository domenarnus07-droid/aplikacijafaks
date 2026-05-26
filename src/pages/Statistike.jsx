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

  // ── Per-subject napredek (new section) ───────────────────────────────────────
  const maxZapiski = Math.max(1, ...predmeti.map(p => zapiski.filter(z => z.predmet === p.id).length))
  const napredekPoP = predmeti.map(p => {
    const pZ = zapiski.filter(z => z.predmet === p.id).length
    const pN = naloge.filter(n => n.predmet === p.id)
    const pOpr = pN.filter(n => n.opravljeno).length
    const pPomo = pomoSesije.filter(s => s.predmet === p.id && s.tip === 'fokus')
    const pPomoMin = pPomo.reduce((a, s) => a + (s.trajanje || 0), 0)
    return { ...p, zapiskov: pZ, nalogStevilo: pN.length, opravljenih: pOpr, pomoMin: pPomoMin }
  })

  return (
    <>
      <div className="stran-glava">
        <h1 className="stran-naslov">Statistike</h1>
        <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem' }}>Tvoj napredek v številkah</p>
      </div>

      {/* Napredek po predmetih */}
      <div className="kartica" style={{ marginBottom: 24 }}>
        <div className="dash-kartica-naslov">
          <i className="ti ti-chart-dots" style={{ color: 'var(--modra)' }} /> 📊 Napredek po predmetih
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {napredekPoP.map(p => {
            const pct = maxZapiski > 0 ? Math.round(p.zapiskov / maxZapiski * 100) : 0
            return (
              <div key={p.id} style={{
                background: 'var(--ozadje2)',
                borderRadius: 10,
                padding: '14px 16px',
                border: `1.5px solid ${p.barva}33`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{p.ikona}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.ime}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 2 }}>
                      <span title="Zapiski">📝 {p.zapiskov}</span>
                      {p.nalogStevilo > 0 && <span title="Opravljene naloge">✓ {p.opravljenih}/{p.nalogStevilo}</span>}
                      {p.pomoMin > 0 && <span title="Fokus minute">🍅 {Math.round(p.pomoMin / 60 * 10) / 10}h</span>}
                    </div>
                  </div>
                </div>
                <div style={{ height: 6, background: 'var(--ozadje3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: p.barva, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
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
            <span><i className="ti ti-clock" style={{ color: '#F59E0B' }} /> Fokus timer — zadnjih 14 dni</span>
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

      {/* 8-tedenski fokus graf */}
      {skupajSesij > 0 && (() => {
        const tednov = 8
        const tedni = []
        for (let i = tednov - 1; i >= 0; i--) {
          const od = new Date(danes); od.setDate(danes.getDate() - i * 7 - danes.getDay() + 1)
          od.setHours(0, 0, 0, 0)
          const do_ = new Date(od); do_.setDate(od.getDate() + 6)
          const oznaka = `${od.getDate()}.${od.getMonth() + 1}`
          let min = 0
          pomoSesije.filter(s => s.tip === 'fokus').forEach(s => {
            const d = new Date(s.zacetek)
            if (d >= od && d <= do_) min += (s.trajanje || 0)
          })
          tedni.push({ oznaka, min, jeTedenski: i === 0 })
        }
        const maxT = Math.max(1, ...tedni.map(t => t.min))
        const skupajT = tedni.reduce((a, t) => a + t.min, 0)
        return (
          <div className="kartica" style={{ marginBottom: 20 }}>
            <div className="dash-kartica-naslov" style={{ justifyContent: 'space-between' }}>
              <span><i className="ti ti-chart-histogram" style={{ color: '#8B5CF6' }} /> Fokus ure — zadnjih 8 tednov</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
                {Math.round(skupajT / 60 * 10) / 10}h skupaj
              </span>
            </div>
            <div className="pomo-graf">
              {tedni.map((t, i) => {
                const h = Math.max(4, Math.round((t.min / maxT) * 80))
                return (
                  <div key={i} className="pomo-graf-stolpec">
                    {t.min > 0 && <div className="pomo-graf-vrednost">{Math.round(t.min / 60 * 10) / 10}h</div>}
                    <div className="pomo-graf-palica" style={{
                      height: h,
                      background: t.jeTedenski ? '#8B5CF6' : '#8B5CF688',
                      border: t.jeTedenski ? '2px solid #7C3AED' : 'none',
                    }} title={`${t.oznaka}: ${t.min} min`} />
                    <div className="pomo-graf-oznaka" style={{ color: t.jeTedenski ? '#8B5CF6' : 'var(--besedilo3)', fontWeight: t.jeTedenski ? 700 : 400 }}>
                      {t.oznaka}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

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

      {/* Letna heatmap aktivnosti */}
      {(() => {
        const aktivnostData = JSON.parse(localStorage.getItem('studyos-aktivnost') || '[]')
        const pomoDatumi = pomoSesije
          .filter(s => s.tip === 'fokus')
          .map(s => s.zacetek ? new Date(s.zacetek).toISOString().slice(0, 10) : null)
          .filter(Boolean)

        // Merge vse aktivnosti
        const aktivMap = {}
        ;[...aktivnostData, ...pomoDatumi].forEach(d => {
          aktivMap[d] = (aktivMap[d] || 0) + 1
        })

        if (Object.keys(aktivMap).length === 0) return null

        // Zadnjih 52 tednov = 364 dni + danes
        const heatDni = []
        for (let i = 363; i >= 0; i--) {
          const d = new Date(danes); d.setDate(danes.getDate() - i)
          heatDni.push(d.toISOString().slice(0, 10))
        }
        const maks = Math.max(1, ...heatDni.map(d => aktivMap[d] || 0))

        function barvaIntenziteta(n) {
          if (n === 0) return 'var(--ozadje3)'
          const p = n / maks
          if (p < 0.25) return 'var(--modra)40'
          if (p < 0.5)  return 'var(--modra)70'
          if (p < 0.75) return 'var(--modra)aa'
          return 'var(--modra)'
        }

        // Group by weeks (columns)
        const tedni = []
        for (let i = 0; i < heatDni.length; i += 7) {
          tedni.push(heatDni.slice(i, i + 7))
        }

        const skupajAktivnihDni = heatDni.filter(d => aktivMap[d] > 0).length
        const maxZapored = (() => {
          let max = 0, cur = 0
          for (const d of heatDni) { if (aktivMap[d] > 0) { cur++; max = Math.max(max, cur) } else cur = 0 }
          return max
        })()

        return (
          <div className="kartica" style={{ marginBottom: 20 }}>
            <div className="dash-kartica-naslov">
              <i className="ti ti-calendar-stats" style={{ color: 'var(--modra)' }} /> Letna aktivnost
              <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>
                {skupajAktivnihDni} aktivnih dni · {maxZapored} max zapored
              </span>
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <div style={{ display: 'flex', gap: 3, minWidth: 'max-content' }}>
                {tedni.map((teden, ti) => (
                  <div key={ti} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {teden.map(d => {
                      const n = aktivMap[d] || 0
                      const jeDanes = d === danesTxt
                      return (
                        <div
                          key={d}
                          title={`${d}: ${n} aktivnosti`}
                          style={{
                            width: 13, height: 13,
                            borderRadius: 3,
                            background: barvaIntenziteta(n),
                            border: jeDanes ? '1.5px solid var(--modra)' : 'none',
                            boxSizing: 'border-box',
                            cursor: 'default',
                            transition: 'background 0.2s',
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, fontSize: '0.68rem', color: 'var(--besedilo3)' }}>
              <span>Manj</span>
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: barvaIntenziteta(Math.round(p * maks)) }} />
              ))}
              <span>Več</span>
            </div>
          </div>
        )
      })()}
    </>
  )
}
