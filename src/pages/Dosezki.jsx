import { useState, useEffect } from 'react'
import { DOSEZKI, REDKOST_BARVA, REDKOST_IME, beriOdklenjene, preveriDosezke, izracunajStreak } from '../dosezki.js'
import { pridobiZapiske, pridobiNaloge } from '../api.js'

const KATEGORIJE = [
  { id: 'vse',      oznaka: 'Vse',       ikona: '🏆' },
  { id: 'zapiski',  oznaka: 'Zapiski',   ikona: '📝' },
  { id: 'naloge',   oznaka: 'Naloge',    ikona: '✅' },
  { id: 'focus',    oznaka: 'Focus',     ikona: '🍅' },
  { id: 'kviz',     oznaka: 'Kviz',      ikona: '🃏' },
  { id: 'ai',       oznaka: 'AI',        ikona: '🤖' },
  { id: 'streak',   oznaka: 'Streak',    ikona: '🔥' },
  { id: 'posebno',  oznaka: 'Posebno',   ikona: '⭐' },
]

function DosezekKartica({ dosezek, odklenjen, datum }) {
  const barva = REDKOST_BARVA[dosezek.redkost] || 'var(--besedilo3)'

  return (
    <div className={`dosezek-kartica ${odklenjen ? 'odklenjen' : 'zaklenjen'}`} style={odklenjen ? { borderColor: barva + '60' } : {}}>
      <div className="dosezek-ikona" style={odklenjen ? { filter: 'none', opacity: 1 } : { filter: 'grayscale(1)', opacity: 0.35 }}>
        {dosezek.ikona}
      </div>
      <div className="dosezek-vsebina">
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: odklenjen ? 'var(--besedilo1)' : 'var(--besedilo3)' }}>
          {dosezek.ime}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginTop: 2 }}>{dosezek.opis}</div>
        <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: barva, fontWeight: 600 }}>
            {REDKOST_IME[dosezek.redkost]}
          </span>
          {odklenjen && datum && (
            <span style={{ fontSize: '0.65rem', color: 'var(--besedilo3)' }}>
              {new Date(datum).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      {odklenjen && (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.65rem', background: barva + '22', color: barva, borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>
          ✓
        </div>
      )}
    </div>
  )
}

export default function Dosezki() {
  const [odklenjenObj, setOdklenjenObj] = useState({})
  const [kategorija,   setKategorija]   = useState('vse')
  const [nalaga,       setNalaga]       = useState(true)
  const [statistike,   setStatistike]   = useState({})

  useEffect(() => {
    setOdklenjenObj(beriOdklenjene())

    // Naložimo statistike in preverimo dosežke
    Promise.all([pridobiZapiske(), pridobiNaloge()]).then(([zs, ns]) => {
      const pomoSeje = JSON.parse(localStorage.getItem('studyos-pomo-sesije') || '[]').length
      const predmeti = JSON.parse(localStorage.getItem('studyos-predmeti') || '[]').length
      const kvizDat  = JSON.parse(localStorage.getItem('studyos-kviz-statistike') || '{"skupaj":0,"100procent":0}')
      const aktivnost = JSON.parse(localStorage.getItem('studyos-aktivnost') || '[]')
      const streak = izracunajStreak(aktivnost)

      const st = {
        zapiski:    zs.length,
        nalogeDone: ns.filter(n => n.opravljeno).length,
        pomoSeje,
        predmeti,
        kvizSkupaj: kvizDat.skupaj || 0,
        kviz100:    (kvizDat['100procent'] || 0) > 0,
        streak,
      }
      setStatistike(st)
      preveriDosezke(st)
      setOdklenjenObj(beriOdklenjene())
    }).finally(() => setNalaga(false))

    // Zabeleži aktivnost za danes
    const danes = new Date().toISOString().slice(0, 10)
    const akt = JSON.parse(localStorage.getItem('studyos-aktivnost') || '[]')
    if (!akt.includes(danes)) {
      akt.push(danes)
      localStorage.setItem('studyos-aktivnost', JSON.stringify(akt.slice(-365)))
    }
  }, [])

  const filtrirani = DOSEZKI.filter(d => kategorija === 'vse' || d.kategorija === kategorija)
  const odklenjenoStevilo = DOSEZKI.filter(d => odklenjenObj[d.id]).length
  const skupajStevilo = DOSEZKI.length

  // Razvrsti: odklenjeni najprej, potem po redkosti
  const razvrsceni = [...filtrirani].sort((a, b) => {
    const aO = !!odklenjenObj[a.id]
    const bO = !!odklenjenObj[b.id]
    if (aO !== bO) return aO ? -1 : 1
    const vrstni = { epski: 0, redek: 1, navaden: 2, navadan: 2 }
    return (vrstni[a.redkost] ?? 2) - (vrstni[b.redkost] ?? 2)
  })

  const procent = skupajStevilo ? Math.round((odklenjenoStevilo / skupajStevilo) * 100) : 0

  return (
    <div>
      <div className="stran-glava">
        <h1 className="stran-naslov">
          <i className="ti ti-trophy" style={{ color: '#f39c12', marginRight: 8 }} />
          Dosežki
        </h1>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--besedilo3)' }}>
          {odklenjenoStevilo} / {skupajStevilo}
        </span>
      </div>

      {/* Skupni napredek */}
      <div className="kartica" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Skupni napredek</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--modra)' }}>{procent}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--ozadje3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${procent}%`, background: 'linear-gradient(90deg, var(--modra), #9b59b6)', borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.78rem', color: 'var(--besedilo3)' }}>
              {!nalaga && <>
                <span>📝 {statistike.zapiski} zapiskov</span>
                <span>✅ {statistike.nalogeDone} nalog</span>
                <span>🍅 {statistike.pomoSeje} Pomodoro</span>
                {statistike.streak > 0 && <span>🔥 {statistike.streak} dni streak</span>}
              </>}
            </div>
          </div>

          {/* Epski/redki dosežki */}
          <div style={{ display: 'flex', gap: 8 }}>
            {DOSEZKI.filter(d => d.redkost === 'epski' && odklenjenObj[d.id]).slice(0, 3).map(d => (
              <div key={d.id} title={d.ime} style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 8px #f39c1260)' }}>
                {d.ikona}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kategorije */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {KATEGORIJE.map(k => {
          const stKat = DOSEZKI.filter(d => k.id === 'vse' || d.kategorija === k.id)
          const odkl  = stKat.filter(d => odklenjenObj[d.id]).length
          return (
            <button
              key={k.id}
              className={`filter-gumb ${kategorija === k.id ? 'aktiven' : ''}`}
              onClick={() => setKategorija(k.id)}
            >
              {k.ikona} {k.oznaka}
              <span style={{ marginLeft: 5, fontFamily: 'var(--mono)', fontSize: '0.7rem', opacity: 0.7 }}>
                {odkl}/{stKat.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mreža dosežkov */}
      {nalaga ? (
        <div className="nalagalnik" />
      ) : (
        <div className="dosezki-mrezica">
          {razvrsceni.map(d => (
            <DosezekKartica
              key={d.id}
              dosezek={d}
              odklenjen={!!odklenjenObj[d.id]}
              datum={odklenjenObj[d.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
