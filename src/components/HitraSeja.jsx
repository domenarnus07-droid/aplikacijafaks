import { useState, useEffect } from 'react'
import { pridobiNaloge } from '../api.js'
import { useApp } from '../App.jsx'

function pozdrav() {
  const h = new Date().getHours()
  if (h < 6)  return 'Pozna noč 🌙'
  if (h < 12) return 'Dobro jutro ☀️'
  if (h < 18) return 'Dober dan 👋'
  return 'Dober večer 🌙'
}

function priporoceniPredmet(predmeti) {
  try {
    const sesije = JSON.parse(localStorage.getItem('studyos-pomo-sesije') || '[]')
    const teden = new Date()
    teden.setDate(teden.getDate() - 7)
    const tedenStr = teden.toISOString()

    const ure = {}
    predmeti.forEach(p => { ure[p.id] = 0 })

    sesije
      .filter(s => s.tip === 'fokus' && s.zacetek > tedenStr)
      .forEach(s => {
        if (s.predmet && ure[s.predmet] !== undefined) {
          ure[s.predmet] += s.trajanje || 0
        }
      })

    const minPredmet = predmeti.reduce((min, p) => {
      return (ure[p.id] || 0) < (ure[min?.id] || Infinity) ? p : min
    }, predmeti[0])

    return minPredmet
  } catch {
    return predmeti[0] || null
  }
}

function karticeZaDanes() {
  try {
    const kartice = JSON.parse(localStorage.getItem('studyos-sr-kartice') || '[]')
    const danes = new Date().toISOString().slice(0, 10)
    return kartice.filter(k => !k.nextReview || k.nextReview <= danes).length
  } catch {
    return 0
  }
}

export default function HitraSeja({ onZapri, onZacniPomo, onOdpriZapiske }) {
  const { predmeti, setStran } = useApp()
  const [naloge, setNaloge] = useState([])
  const [nalaga, setNalaga] = useState(true)

  useEffect(() => {
    pridobiNaloge()
      .then(ns => {
        const danes = new Date().toISOString().slice(0, 10)
        const danes30 = danes.replace(/-/g, '-')
        const prihodnje = ns
          .filter(n => !n.opravljeno && n.rok && n.rok <= danes)
          .slice(0, 3)
        setNaloge(prihodnje)
      })
      .finally(() => setNalaga(false))
  }, [])

  const priporocen = priporoceniPredmet(predmeti)
  const stKartic = karticeZaDanes()

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="hitra-seja-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Hitra seja
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {pozdrav()}
            </div>
          </div>
          <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
        </div>

        {/* Priporočeni predmet */}
        {priporocen && (
          <div style={{
            background: 'var(--ozadje2)',
            border: `1.5px solid ${priporocen.barva}44`,
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--besedilo3)', marginBottom: 6 }}>
              Priporočeno za danes
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.8rem' }}>{priporocen.ikona}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{priporocen.ime}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)' }}>Najmanj učenja ta teden</div>
              </div>
              <button
                className="gumb gumb-sekundarni"
                style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '6px 12px' }}
                onClick={() => {
                  onZapri()
                  if (onOdpriZapiske) onOdpriZapiske(priporocen.id)
                }}
              >
                <i className="ti ti-notebook" /> Zapiski
              </button>
            </div>
          </div>
        )}

        {/* Naloge za danes */}
        {!nalaga && naloge.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--besedilo3)', marginBottom: 8 }}>
              Naloge za danes ({naloge.length})
            </div>
            {naloge.map(n => (
              <div key={n._id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                background: 'var(--rdeca-bg)',
                border: '1px solid var(--rdeca)33',
                borderRadius: 8,
                marginBottom: 4,
                fontSize: '0.85rem',
              }}>
                <i className="ti ti-clock" style={{ color: 'var(--rdeca)', fontSize: '0.8rem' }} />
                <span style={{ flex: 1 }}>{n.besedilo || n.ime}</span>
                {n.rok && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--rdeca)', fontFamily: 'var(--mono)' }}>{n.rok}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Kartice za ponavljanje */}
        {stKartic > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: 'var(--vijolicna-bg)',
            border: '1px solid var(--vijolicna)33',
            borderRadius: 10,
            marginBottom: 14,
          }}>
            <i className="ti ti-cards" style={{ color: 'var(--vijolicna)', fontSize: '1.1rem' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Kartice za ponavljanje</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)' }}>
                {stKartic} kartic čaka na pregled
              </div>
            </div>
            <button
              className="gumb gumb-sekundarni"
              style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => { onZapri(); setStran('kviz') }}
            >
              Ponovi
            </button>
          </div>
        )}

        {/* Gumba */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            className="gumb gumb-primarni"
            style={{ flex: 1, padding: '12px', fontSize: '1rem', justifyContent: 'center' }}
            onClick={() => {
              onZapri()
              if (onZacniPomo) onZacniPomo()
            }}
          >
            <i className="ti ti-player-play" /> Začni fokus timer
          </button>
        </div>
      </div>
    </div>
  )
}
