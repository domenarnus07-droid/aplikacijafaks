import { useState } from 'react'
import { createPortal } from 'react-dom'

const KLJUC = 'studyos-bralnik'
const KATEGORIJE = ['Članek', 'Video', 'Knjiga', 'Orodje', 'Ostalo']
const KAT_BARVE = { Članek:'#3B82F6', Video:'#EF4444', Knjiga:'#8B5CF6', Orodje:'#22C55E', Ostalo:'#94A3B8' }

function genId()      { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function beriLS()     { try { return JSON.parse(localStorage.getItem(KLJUC) || '[]') } catch { return [] } }
function shraniLS(s)  { try { localStorage.setItem(KLJUC, JSON.stringify(s)) } catch {} }
function domeno(url)  { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url } }
function normUrl(u)   { const t = u.trim(); return /^https?:\/\//.test(t) ? t : 'https://' + t }

export default function Bralnik() {
  const [seznam,  setSeznam]  = useState(beriLS)
  const [filter,  setFilter]  = useState('vse')
  const [iskanje, setIskanje] = useState('')
  const [modal,   setModal]   = useState(false)

  // form
  const [fUrl,    setFUrl]    = useState('')
  const [fNaslov, setFNaslov] = useState('')
  const [fKat,    setFKat]    = useState('Članek')
  const [fOpomba, setFOpomba] = useState('')

  function odpriModal() {
    setFUrl(''); setFNaslov(''); setFKat('Članek'); setFOpomba('')
    setModal(true)
  }

  function dodaj() {
    if (!fUrl.trim()) return
    const vnos = {
      id: genId(), url: normUrl(fUrl),
      naslov: fNaslov.trim() || domeno(normUrl(fUrl)),
      kategorija: fKat, opomba: fOpomba.trim(),
      prebrano: false, dodano: new Date().toISOString(),
    }
    const novo = [vnos, ...seznam]
    setSeznam(novo); shraniLS(novo); setModal(false)
  }

  function preklopi(id) {
    const novo = seznam.map(x => x.id === id ? { ...x, prebrano: !x.prebrano } : x)
    setSeznam(novo); shraniLS(novo)
  }

  function izbrisi(id) {
    if (!window.confirm('Izbriši zaznamek?')) return
    const novo = seznam.filter(x => x.id !== id)
    setSeznam(novo); shraniLS(novo)
  }

  const prikazano = seznam
    .filter(x => filter === 'prebrano' ? x.prebrano : filter === 'neprebrano' ? !x.prebrano : true)
    .filter(x => !iskanje || [x.naslov, x.url, x.opomba || ''].join(' ').toLowerCase().includes(iskanje.toLowerCase()))

  const stNe = seznam.filter(x => !x.prebrano).length
  const stPr = seznam.filter(x =>  x.prebrano).length

  return (
    <div className="stran-vsebina">

      {/* Glava */}
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov"><i className="ti ti-bookmarks" /> Bralnik</h1>
          <p style={{ color:'var(--besedilo3)', fontSize:'0.85rem', marginTop:2 }}>
            Shranjeni članki, videi in strani za pozneje
          </p>
        </div>
        <button className="gumb gumb-primarni" onClick={odpriModal}>
          <i className="ti ti-plus" /> Dodaj
        </button>
      </div>

      {/* Filtri */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {[
          { k:'vse',        l:`Vse (${seznam.length})` },
          { k:'neprebrano', l:`Za prebrat (${stNe})` },
          { k:'prebrano',   l:`Prebrano (${stPr})` },
        ].map(({ k, l }) => (
          <button key={k}
            className={`gumb ${filter === k ? 'gumb-primarni' : 'gumb-sekundarni'}`}
            style={{ padding:'6px 14px', fontSize:'0.8rem' }}
            onClick={() => setFilter(k)}
          >{l}</button>
        ))}
        <input
          className="vhod"
          style={{ flex:1, minWidth:160, fontSize:'0.82rem', padding:'7px 12px' }}
          placeholder="Išči…"
          value={iskanje}
          onChange={e => setIskanje(e.target.value)}
        />
      </div>

      {/* Seznam */}
      {prikazano.length === 0 ? (
        <div className="prazno-stanje">
          <div className="prazno-ikona">🔖</div>
          <p>{seznam.length === 0 ? 'Ni shranjenih zaznamkov. Dodaj prvega!' : 'Ni zadetkov.'}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {prikazano.map(v => {
            const barva = KAT_BARVE[v.kategorija] || '#94A3B8'
            return (
              <div key={v.id} style={{
                background:'var(--ozadje1)', border:'1.5px solid var(--rob)',
                borderLeft:`4px solid ${v.prebrano ? 'var(--zelena)' : barva}`,
                borderRadius:12, padding:'14px 16px',
                display:'flex', gap:14, alignItems:'flex-start',
                opacity: v.prebrano ? 0.65 : 1,
              }}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domeno(v.url)}&sz=32`}
                  alt="" width={20} height={20}
                  style={{ borderRadius:4, flexShrink:0, marginTop:2, opacity:0.8 }}
                  onError={e => { e.target.style.display='none' }}
                />
                <div style={{ flex:1, minWidth:0 }}>
                  <span style={{
                    display:'inline-block', fontSize:'0.62rem', fontWeight:700,
                    padding:'2px 8px', borderRadius:99,
                    background:`${barva}22`, color:barva,
                    textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5,
                  }}>{v.kategorija}</span>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" style={{
                    display:'block', fontWeight:600, fontSize:'0.9rem', color:'var(--besedilo1)',
                    textDecoration: v.prebrano ? 'line-through' : 'none',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3,
                  }}>{v.naslov}</a>
                  <div style={{ fontSize:'0.73rem', color:'var(--modra)', marginBottom: v.opomba ? 4 : 0 }}>
                    🌐 {domeno(v.url)}
                  </div>
                  {v.opomba && (
                    <div style={{ fontSize:'0.78rem', color:'var(--besedilo3)', fontStyle:'italic', marginTop:3 }}>
                      {v.opomba}
                    </div>
                  )}
                  <div style={{ fontSize:'0.68rem', color:'var(--besedilo3)', marginTop:6 }}>
                    {new Date(v.dodano).toLocaleDateString('sl-SI', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                  <button className="gumb-ikona" onClick={() => preklopi(v.id)}
                    title={v.prebrano ? 'Označi kot neprebrano' : 'Prebrano'}
                    style={{ color: v.prebrano ? 'var(--zelena)' : undefined }}>
                    <i className={`ti ${v.prebrano ? 'ti-eye-off' : 'ti-eye-check'}`} />
                  </button>
                  <button className="gumb-ikona" onClick={() => izbrisi(v.id)}
                    title="Izbriši" style={{ color:'var(--rdeca)' }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal (portal — renderira direktno v body, mimo vseh CSS transformov) ── */}
      {modal && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{
            position:'fixed', inset:0,
            background:'rgba(2,8,23,0.7)',
            backdropFilter:'blur(4px)',
            zIndex:9999,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:'20px',
          }}
        >
          <div style={{
            background:'var(--ozadje1)',
            border:'1.5px solid var(--rob)',
            borderRadius:16,
            padding:'28px',
            width:'100%',
            maxWidth:460,
            maxHeight:'calc(100vh - 40px)',
            overflowY:'auto',
            boxShadow:'0 8px 48px rgba(0,0,20,0.7)',
          }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
              <i className="ti ti-bookmark-plus" style={{ color:'var(--modra)' }} /> Dodaj zaznamek
            </h2>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--besedilo3)', display:'block', marginBottom:5 }}>URL *</label>
                <input className="vhod" placeholder="https://..." value={fUrl}
                  onChange={e => setFUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && dodaj()}
                  autoFocus />
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--besedilo3)', display:'block', marginBottom:5 }}>Naslov (neobvezno)</label>
                <input className="vhod" placeholder="Ime članka ali strani…" value={fNaslov}
                  onChange={e => setFNaslov(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--besedilo3)', display:'block', marginBottom:5 }}>Kategorija</label>
                <select className="vhod" value={fKat} onChange={e => setFKat(e.target.value)}>
                  {KATEGORIJE.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--besedilo3)', display:'block', marginBottom:5 }}>Opomba (neobvezno)</label>
                <textarea className="vhod" rows={3} placeholder="Zakaj shranjuješ to stran?"
                  value={fOpomba} onChange={e => setFOpomba(e.target.value)}
                  style={{ resize:'vertical' }} />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:22 }}>
              <button className="gumb gumb-sekundarni" onClick={() => setModal(false)}>Prekliči</button>
              <button className="gumb gumb-primarni" onClick={dodaj} disabled={!fUrl.trim()}>
                <i className="ti ti-bookmark-plus" /> Shrani
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
