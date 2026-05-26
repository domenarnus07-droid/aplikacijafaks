import { useState, useRef, useEffect } from 'react'
import { ustvariZapisek, ustvariNalogo } from '../api.js'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'
import GlasovniVnos from './GlasovniVnos.jsx'

const PREDLOGI = [
  'Predavanja iz…', 'Izpit za…', 'Preberi poglavje…',
  'Oddati do…', 'Naloga za…', 'Zapiski o…',
]

export default function HitroZajemanje({ onZapri, onNovZapisek }) {
  const { aktivniPredmet, predmeti } = useApp()
  const [tip,       setTip]       = useState('zapisek')
  const [besedilo,  setBesedilo]  = useState('')
  const [predmet,   setPredmet]   = useState(aktivniPredmet || '')
  const [shranjujem, setShranjujem] = useState(false)
  const vhodRef = useRef(null)
  const placeholder = PREDLOGI[Math.floor(Math.random() * PREDLOGI.length)]

  useEffect(() => {
    vhodRef.current?.focus()
    const h = e => { if (e.key === 'Escape') onZapri() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  async function oddaj(e) {
    e?.preventDefault()
    if (!besedilo.trim() || shranjujem) return
    setShranjujem(true)
    try {
      if (tip === 'zapisek') {
        const nov = await ustvariZapisek({
          naslov: besedilo.trim(), vsebina: '',
          oznaka: 'modra', predmet: predmet || '', tagi: [],
        })
        if (nov) {
          prikaziObvestilo(`Zapisek "${nov.naslov}" ustvarjen`, 'uspeh')
          onNovZapisek?.(nov)
        }
      } else {
        const nov = await ustvariNalogo({
          besedilo: besedilo.trim(), prioriteta: 'srednja',
          predmet: predmet || '', tagi: [],
        })
        if (nov) prikaziObvestilo('Naloga dodana ✓', 'uspeh')
      }
      onZapri()
    } finally {
      setShranjujem(false)
    }
  }

  return (
    <div className="hz-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="hz-panel">
        {/* Tip preklop */}
        <div className="hz-glava">
          <div className="hz-tip-preklop">
            <button className={`hz-tip-gumb ${tip === 'zapisek' ? 'aktiven' : ''}`} onClick={() => setTip('zapisek')}>
              <i className="ti ti-notebook" /> Zapisek
            </button>
            <button className={`hz-tip-gumb ${tip === 'naloga' ? 'aktiven' : ''}`} onClick={() => setTip('naloga')}>
              <i className="ti ti-check" /> Naloga
            </button>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginLeft: 'auto' }}>Ctrl+Shift+N</span>
          <button className="gumb-ikona" onClick={onZapri} style={{ width: 28, height: 28 }}>
            <i className="ti ti-x" style={{ fontSize: '0.8rem' }} />
          </button>
        </div>

        {/* Vhod */}
        <form onSubmit={oddaj} className="hz-forma">
          <input
            ref={vhodRef}
            className="hz-vhod"
            placeholder={`${placeholder} (Enter za dodaj)`}
            value={besedilo}
            onChange={e => setBesedilo(e.target.value)}
          />
          <GlasovniVnos
            onBesedilo={txt => setBesedilo(b => b ? `${b} ${txt}` : txt)}
            style={{ flexShrink: 0 }}
          />
          <button
            type="submit"
            className="gumb gumb-primarni"
            disabled={!besedilo.trim() || shranjujem}
            style={{ padding: '11px 20px', flexShrink: 0 }}
          >
            {shranjujem
              ? <div className="nalagalnik" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : <><i className="ti ti-plus" /> Dodaj</>
            }
          </button>
        </form>

        {/* Predmet izbira */}
        <div style={{ display: 'flex', gap: 8, padding: '6px 0 2px', flexWrap: 'wrap' }}>
          <button
            className={`hz-predmet-gumb ${!predmet ? 'aktiven' : ''}`}
            onClick={() => setPredmet('')}
          >
            Brez predmeta
          </button>
          {predmeti.map(p => (
            <button
              key={p.id}
              className={`hz-predmet-gumb ${predmet === p.id ? 'aktiven' : ''}`}
              style={predmet === p.id ? { borderColor: p.barva, background: p.barva + '22', color: p.barva } : {}}
              onClick={() => setPredmet(p.id)}
            >
              {p.ikona} {p.ime}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
