import { useState } from 'react'

const KLJUC = 'studyos-bralnik'

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function beri()  { try { return JSON.parse(localStorage.getItem(KLJUC) || '[]') } catch { return [] } }
function shrani(seznam) { try { localStorage.setItem(KLJUC, JSON.stringify(seznam)) } catch {} }

function domeno(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

const KATEGORIJE = ['Vse', 'Članek', 'Video', 'Knjiga', 'Orodje', 'Ostalo']

export default function Bralnik() {
  const [seznam,     setSeznam]     = useState(beri)
  const [filter,     setFilter]     = useState('vse')   // 'vse' | 'neprebrano' | 'prebrano'
  const [dodajOdprt, setDodajOdprt] = useState(false)
  const [iskanje,    setIskanje]    = useState('')

  // Form state
  const [fUrl,     setFUrl]     = useState('')
  const [fNaslov,  setFNaslov]  = useState('')
  const [fOpomba,  setFOpomba]  = useState('')
  const [fKat,     setFKat]     = useState('Artikel')

  function odpriFormo() { setFUrl(''); setFNaslov(''); setFOpomba(''); setFKat('Artikel'); setDodajOdprt(true) }

  function dodaj() {
    if (!fUrl.trim()) return
    const url = /^https?:\/\//.test(fUrl.trim()) ? fUrl.trim() : 'https://' + fUrl.trim()
    const nov = {
      id: genId(), url, naslov: fNaslov.trim() || domeno(url),
      opomba: fOpomba.trim(), kategorija: fKat,
      prebrano: false, dodano: new Date().toISOString(),
    }
    const novo = [nov, ...seznam]
    setSeznam(novo); shrani(novo)
    setDodajOdprt(false)
  }

  function preklopi(id) {
    const novo = seznam.map(x => x.id === id ? { ...x, prebrano: !x.prebrano } : x)
    setSeznam(novo); shrani(novo)
  }

  function izbrisi(id) {
    if (!window.confirm('Izbriši zaznamek?')) return
    const novo = seznam.filter(x => x.id !== id)
    setSeznam(novo); shrani(novo)
  }

  const filtrirano = seznam
    .filter(x => filter === 'prebrano' ? x.prebrano : filter === 'neprebrano' ? !x.prebrano : true)
    .filter(x => !iskanje || x.naslov.toLowerCase().includes(iskanje.toLowerCase()) ||
                             x.url.toLowerCase().includes(iskanje.toLowerCase()) ||
                             (x.opomba || '').toLowerCase().includes(iskanje.toLowerCase()))

  const stNeprebrano = seznam.filter(x => !x.prebrano).length
  const stPrebrano   = seznam.filter(x =>  x.prebrano).length

  return (
    <div className="stran-vsebina">

      {/* Glava */}
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov"><i className="ti ti-bookmarks" /> Bralnik</h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem', marginTop: 2 }}>
            Shranjeni članki, videi in strani za pozneje
          </p>
        </div>
        <button className="gumb gumb-primarni" onClick={odpriFormo}>
          <i className="ti ti-plus" /> Dodaj
        </button>
      </div>

      {/* Dodaj modal */}
      {dodajOdprt && (
        <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && setDodajOdprt(false)}>
          <div className="modal" style={{ maxWidth: 480, width: '95vw' }}>
            <h2 className="modal-naslov">
              <i className="ti ti-bookmark-plus" style={{ color: 'var(--modra)' }} /> Dodaj zaznamek
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', display: 'block', marginBottom: 4 }}>
                  URL *
                </label>
                <input className="vhod" placeholder="https://..." value={fUrl}
                  onChange={e => setFUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && dodaj()}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', display: 'block', marginBottom: 4 }}>
                  Naslov (neobvezno)
                </label>
                <input className="vhod" placeholder="Ime članka ali strani…" value={fNaslov}
                  onChange={e => setFNaslov(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', display: 'block', marginBottom: 4 }}>
                    Kategorija
                  </label>
                  <select className="vhod" value={fKat} onChange={e => setFKat(e.target.value)}>
                    {KATEGORIJE.slice(1).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', display: 'block', marginBottom: 4 }}>
                  Opomba (neobvezno)
                </label>
                <textarea className="vhod" rows={2} placeholder="Zakaj shranjuješ to stran?"
                  value={fOpomba} onChange={e => setFOpomba(e.target.value)}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-dno">
              <button className="gumb gumb-sekundarni" onClick={() => setDodajOdprt(false)}>Prekliči</button>
              <button className="gumb gumb-primarni" onClick={dodaj} disabled={!fUrl.trim()}>
                <i className="ti ti-bookmark-plus" /> Shrani
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtri + iskanje */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { k: 'vse',        l: `Vse (${seznam.length})` },
          { k: 'neprebrano', l: `Za prebrat (${stNeprebrano})` },
          { k: 'prebrano',   l: `Prebrano (${stPrebrano})` },
        ].map(({ k, l }) => (
          <button key={k}
            className={`gumb ${filter === k ? 'gumb-primarni' : 'gumb-sekundarni'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            onClick={() => setFilter(k)}
          >
            {l}
          </button>
        ))}
        <input
          className="vhod"
          style={{ flex: 1, minWidth: 160, fontSize: '0.82rem', padding: '7px 12px' }}
          placeholder="Išči po naslovu, URLju…"
          value={iskanje}
          onChange={e => setIskanje(e.target.value)}
        />
      </div>

      {/* Seznam */}
      {filtrirano.length === 0 ? (
        <div className="prazno-stanje">
          <div className="prazno-ikona">🔖</div>
          <p>{seznam.length === 0
            ? 'Ni shranjenih zaznamkov. Dodaj prvi!'
            : 'Ni zadetkov za ta filter.'
          }</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrirano.map(vnos => (
            <div key={vnos.id} className="kartica" style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 16px', opacity: vnos.prebrano ? 0.6 : 1,
              borderLeft: `3px solid ${vnos.prebrano ? 'var(--zelena)' : 'var(--modra)'}`,
              transition: 'opacity 0.2s',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  {vnos.kategorija && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 99, background: 'var(--ozadje3)',
                      color: 'var(--besedilo3)', textTransform: 'uppercase',
                      letterSpacing: '0.06em', flexShrink: 0,
                    }}>
                      {vnos.kategorija}
                    </span>
                  )}
                </div>
                <a href={vnos.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    fontWeight: 600, fontSize: '0.9rem', color: 'var(--besedilo1)',
                    textDecoration: vnos.prebrano ? 'line-through' : 'none',
                    display: 'block', marginBottom: 3,
                  }}>
                  {vnos.naslov}
                </a>
                <div style={{ fontSize: '0.73rem', color: 'var(--modra)', marginBottom: vnos.opomba ? 4 : 0 }}>
                  🌐 {domeno(vnos.url)}
                </div>
                {vnos.opomba && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', fontStyle: 'italic', marginTop: 2 }}>
                    {vnos.opomba}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 5 }}>
                  {new Date(vnos.dodano).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="gumb-ikona"
                  onClick={() => preklopi(vnos.id)}
                  title={vnos.prebrano ? 'Označi kot neprebrano' : 'Označi kot prebrano'}
                  style={{ color: vnos.prebrano ? 'var(--zelena)' : undefined }}
                >
                  <i className={`ti ti-${vnos.prebrano ? 'eye-off' : 'eye-check'}`} />
                </button>
                <button className="gumb-ikona" onClick={() => izbrisi(vnos.id)}
                  title="Izbriši" style={{ color: 'var(--rdeca)' }}>
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
