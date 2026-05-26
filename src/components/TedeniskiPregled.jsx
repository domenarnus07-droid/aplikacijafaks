import { useState, useEffect } from 'react'
import { pridobiZapiske, pridobiNaloge } from '../api.js'
import { useApp } from '../App.jsx'

function isoTeden(d = new Date()) {
  const dd = new Date(d)
  dd.setHours(0, 0, 0, 0)
  const ponedeljek = new Date(dd)
  ponedeljek.setDate(dd.getDate() - ((dd.getDay() + 6) % 7))
  return ponedeljek.toISOString().slice(0, 10)
}

function tedenOd(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset * 7)
  return isoTeden(d)
}

const DNI = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']

export default function TedeniskiPregled({ onZapri }) {
  const { predmeti } = useApp()
  const [tab,       setTab]       = useState('pregled')
  const [zapiski,   setZapiski]   = useState([])
  const [naloge,    setNaloge]    = useState([])
  const [nalaga,    setNalaga]    = useState(true)
  const [refleksija, setRefleksija] = useState('')

  const tedenKljuc = `studyos-teden-${isoTeden()}`
  const reflKljuc  = `studyos-refl-${isoTeden()}`

  useEffect(() => {
    const shrRefl = localStorage.getItem(reflKljuc) || ''
    setRefleksija(shrRefl)

    Promise.all([pridobiZapiske(), pridobiNaloge()]).then(([zs, ns]) => {
      setZapiski(zs)
      setNaloge(ns)
    }).finally(() => setNalaga(false))
  }, [])

  function shraniRefleksijo(v) {
    setRefleksija(v)
    localStorage.setItem(reflKljuc, v)
  }

  // ── Statistike tega tedna ──
  const zacetekTedna = new Date(isoTeden())
  const konecTedna   = new Date(zacetekTedna); konecTedna.setDate(konecTedna.getDate() + 7)

  const novZapiski = zapiski.filter(z => {
    const d = new Date(z.ustvarjen || z.createdAt || 0)
    return d >= zacetekTedna && d < konecTedna
  })

  const opravljeneNaloge = naloge.filter(n => {
    if (!n.opravljeno) return false
    const d = new Date(n.posodobljen || n.updatedAt || 0)
    return d >= zacetekTedna && d < konecTedna
  })

  const pomoSeje = JSON.parse(localStorage.getItem('studyos-pomo-sesije') || '[]')
    .filter(s => s.datum && s.datum >= isoTeden())
  const pomoCasMin = pomoSeje.length * 25

  // Naloge z rokom naslednji teden
  const naslednjTeden = tedenOd(1)
  const konecNaslednjega = new Date(naslednjTeden); konecNaslednjega.setDate(konecNaslednjega.getDate() + 7)
  const nalogeNaslednji = naloge.filter(n => {
    if (n.opravljeno || !n.rok) return false
    const d = new Date(n.rok)
    return d >= new Date(naslednjTeden) && d < konecNaslednjega
  })

  // Rok ta teden
  const nalogeZRokom = naloge.filter(n => {
    if (n.opravljeno || !n.rok) return false
    const d = new Date(n.rok)
    return d >= zacetekTedna && d < konecTedna
  })

  // Aktivnost po dneh (Pomo seje)
  const aktivnostPoSesijah = Array(7).fill(0)
  pomoSeje.forEach(s => {
    if (!s.datum) return
    const d = new Date(s.datum)
    const indeks = (d.getDay() + 6) % 7
    aktivnostPoSesijah[indeks]++
  })
  const maksSej = Math.max(...aktivnostPoSesijah, 1)

  // Ocena tedna
  const skupajTocke = novZapiski.length * 2 + opravljeneNaloge.length * 3 + pomoSeje.length * 1
  let ocenaTedna = '😴'
  if (skupajTocke >= 20) ocenaTedna = '🔥'
  else if (skupajTocke >= 10) ocenaTedna = '⚡'
  else if (skupajTocke >= 5) ocenaTedna = '📚'

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal" style={{ maxWidth: 560, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Glava */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 className="modal-naslov" style={{ marginBottom: 2 }}>
              <i className="ti ti-calendar-week" style={{ color: 'var(--modra)', marginRight: 8 }} />
              Tedenski pregled
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)' }}>
              Teden od {new Date(isoTeden()).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div style={{ fontSize: '2rem' }}>{ocenaTedna}</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1.5px solid var(--rob)', paddingBottom: 10 }}>
          {[
            { k: 'pregled',    oznaka: 'Ta teden',     ikona: 'ti-chart-bar'    },
            { k: 'prihodnji',  oznaka: 'Prihodnji',    ikona: 'ti-calendar'     },
            { k: 'refleksija', oznaka: 'Refleksija',   ikona: 'ti-pencil'       },
          ].map(t => (
            <button key={t.k}
              className={`filter-gumb ${tab === t.k ? 'aktiven' : ''}`}
              onClick={() => setTab(t.k)}>
              <i className={`ti ${t.ikona}`} /> {t.oznaka}
            </button>
          ))}
        </div>

        {nalaga ? <div className="nalagalnik" /> : <>
          {/* ── Pregled tega tedna ── */}
          {tab === 'pregled' && (
            <div>
              {/* Statistike kartice */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { ikona: '📝', vrednost: novZapiski.length,      oznaka: 'Novih zapiskov' },
                  { ikona: '✅', vrednost: opravljeneNaloge.length, oznaka: 'Nalog opravljenih' },
                  { ikona: '🍅', vrednost: pomoSeje.length,         oznaka: `Fokus timer (${pomoCasMin} min)` },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--ozadje2)', borderRadius: 12, border: '1px solid var(--rob)' }}>
                    <div style={{ fontSize: '1.4rem' }}>{s.ikona}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--mono)', marginTop: 4 }}>{s.vrednost}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--besedilo3)', marginTop: 2 }}>{s.oznaka}</div>
                  </div>
                ))}
              </div>

              {/* Aktivnost po dneh */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--besedilo2)' }}>Fokus po dneh</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
                  {DNI.map((d, i) => (
                    <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
                        {aktivnostPoSesijah[i] || ''}
                      </div>
                      <div style={{
                        width: '100%',
                        height: Math.max(4, (aktivnostPoSesijah[i] / maksSej) * 44),
                        background: aktivnostPoSesijah[i] > 0 ? 'var(--modra)' : 'var(--ozadje3)',
                        borderRadius: 4,
                        transition: 'height 0.4s',
                      }} />
                      <div style={{ fontSize: '0.62rem', color: 'var(--besedilo3)' }}>{d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opravljene naloge */}
              {opravljeneNaloge.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--besedilo2)' }}>Opravljeno ta teden ✓</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {opravljeneNaloge.slice(0, 5).map(n => (
                      <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--zelena)10', borderRadius: 8, border: '1px solid var(--zelena)30' }}>
                        <i className="ti ti-check" style={{ color: 'var(--zelena)', fontSize: '0.8rem' }} />
                        <span style={{ fontSize: '0.82rem', flex: 1 }}>{n.besedilo}</span>
                      </div>
                    ))}
                    {opravljeneNaloge.length > 5 && <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', paddingLeft: 10 }}>in {opravljeneNaloge.length - 5} več…</div>}
                  </div>
                </div>
              )}

              {/* Roki ta teden */}
              {nalogeZRokom.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--rdeca)' }}>
                    <i className="ti ti-alert-triangle" /> Roki ta teden ({nalogeZRokom.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {nalogeZRokom.map(n => (
                      <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--rdeca)10', borderRadius: 8 }}>
                        <span className={`prioriteta-pika prioriteta-${n.prioriteta}`} />
                        <span style={{ fontSize: '0.82rem', flex: 1 }}>{n.besedilo}</span>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--rdeca)' }}>
                          {new Date(n.rok).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Prihodnji teden ── */}
          {tab === 'prihodnji' && (
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 14, color: 'var(--besedilo2)' }}>
                Naloge z rokom naslednji teden
              </div>
              {nalogeNaslednji.length === 0 ? (
                <div className="prazno-stanje" style={{ padding: '30px 0' }}>
                  <div className="prazno-ikona" style={{ fontSize: '2rem' }}>🎉</div>
                  <p>Naslednji teden ni rokov!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {nalogeNaslednji.map(n => {
                    const predmet = predmeti.find(p => p.id === n.predmet)
                    return (
                      <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--ozadje2)', borderRadius: 10, border: '1px solid var(--rob)' }}>
                        <span className={`prioriteta-pika prioriteta-${n.prioriteta}`} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{n.besedilo}</div>
                          {predmet && <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)' }}>{predmet.ikona} {predmet.ime}</div>}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--besedilo3)' }}>
                          {new Date(n.rok).toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Nasveti za prihodnji teden */}
              <div style={{ marginTop: 20, padding: 16, background: 'var(--modra)10', borderRadius: 12, border: '1px solid var(--modra)30' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8, color: 'var(--modra)' }}>
                  💡 Cilji za prihodnji teden
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--besedilo2)', lineHeight: 1.7 }}>
                  {nalogeNaslednji.length > 0 && <div>• Opravi {Math.min(nalogeNaslednji.length, 3)} prednostnih nalog z rokom</div>}
                  <div>• Naredi vsaj {Math.max(3, pomoSeje.length)} fokus sej</div>
                  <div>• Dodaj vsaj 1 nov zapisek</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Refleksija ── */}
          {tab === 'refleksija' && (
            <div>
              <div style={{ fontSize: '0.88rem', color: 'var(--besedilo2)', marginBottom: 14, lineHeight: 1.6 }}>
                Kako je šlo ta teden? Kaj si se naučil? Kaj bi spremenil?
              </div>
              <textarea
                className="vhod"
                style={{ width: '100%', minHeight: 180, resize: 'vertical', fontSize: '0.88rem', lineHeight: 1.7 }}
                placeholder="Zapiši refleksijo tedna…&#10;&#10;Kaj je šlo dobro?&#10;Kaj bi popravil?&#10;Cilji za naslednji teden?"
                value={refleksija}
                onChange={e => shraniRefleksijo(e.target.value)}
              />
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--besedilo3)' }}>
                <i className="ti ti-device-floppy" /> Samodejno shranjeno
              </div>

              {/* Prejšnje refleksije */}
              <PrejsnjeRefleksije />
            </div>
          )}
        </>}

        <div className="modal-dno" style={{ marginTop: 20 }}>
          <button className="gumb gumb-primarni" style={{ width: '100%' }} onClick={onZapri}>
            Zapri pregled
          </button>
        </div>
      </div>
    </div>
  )
}

function PrejsnjeRefleksije() {
  const [razprto, setRazprto] = useState(false)

  function tedenOdOffset(offset) {
    const d = new Date()
    d.setDate(d.getDate() + offset * 7)
    return isoTeden(d)
  }

  const pretekle = []
  for (let i = 1; i <= 8; i++) {
    const kljuc = `studyos-refl-${tedenOdOffset(-i)}`
    const vs = localStorage.getItem(kljuc)
    if (vs) {
      const datum = new Date(tedenOdOffset(-i))
      pretekle.push({ datum, vsebina: vs })
    }
  }

  if (pretekle.length === 0) return null

  return (
    <div style={{ marginTop: 20 }}>
      <button style={{ fontSize: '0.78rem', color: 'var(--besedilo3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={() => setRazprto(r => !r)}>
        <i className={`ti ti-chevron-${razprto ? 'up' : 'down'}`} />
        Prejšnje refleksije ({pretekle.length})
      </button>
      {razprto && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pretekle.map((r, i) => (
            <div key={i} style={{ padding: 12, background: 'var(--ozadje2)', borderRadius: 10, border: '1px solid var(--rob)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginBottom: 6 }}>
                Teden od {r.datum.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long' })}
              </div>
              <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', color: 'var(--besedilo2)' }}>{r.vsebina}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
