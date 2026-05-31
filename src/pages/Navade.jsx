import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { prikaziObvestilo } from '../toast.js'

const KLJUC_NAVADE = 'studyos-navade-seznam'
const KLJUC_VNOSI  = 'studyos-navade-vnosi'

const PRIVZETE_NAVADE = [
  { id: 'ucenje',   ime: 'Učenje',        ikona: '📚', barva: '#3B82F6' },
  { id: 'vadba',    ime: 'Telesna vadba',  ikona: '🏃', barva: '#22C55E' },
  { id: 'branje',   ime: 'Branje',         ikona: '📖', barva: '#8B5CF6' },
  { id: 'voda',     ime: 'Pitje vode',     ikona: '💧', barva: '#0891B2' },
  { id: 'spanec',   ime: 'Zgodaj spat',    ikona: '😴', barva: '#6366F1' },
]

const EMOIJI_IZBOR = ['📚','🏃','📖','💧','😴','🎯','💪','🧘','🍎','✍️','🎵','🌿','☀️','🧠','💻','🏋️','🚴','🤸']

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function beriNavade() {
  try { const s = localStorage.getItem(KLJUC_NAVADE); if (s) return JSON.parse(s) } catch {}
  return PRIVZETE_NAVADE
}
function beriVnose()  { try { return JSON.parse(localStorage.getItem(KLJUC_VNOSI) || '{}') } catch { return {} } }
function shraniNavade(n) { try { localStorage.setItem(KLJUC_NAVADE, JSON.stringify(n)) } catch {} }
function shraniVnose(v)  { try { localStorage.setItem(KLJUC_VNOSI,  JSON.stringify(v)) } catch {} }

function danes() { return new Date().toISOString().slice(0, 10) }

function izracunajStreak(id, vnosi) {
  let streak = 0
  const d = new Date(); d.setHours(0,0,0,0)
  for (let i = 0; i < 365; i++) {
    const k = new Date(d); k.setDate(d.getDate() - i)
    const str = k.toISOString().slice(0, 10)
    if ((vnosi[str] || []).includes(id)) streak++
    else break
  }
  return streak
}

function zadnjih7(id, vnosi) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const k = d.toISOString().slice(0, 10)
    return { k, opravljeno: (vnosi[k] || []).includes(id), jeDanes: k === danes() }
  })
}

const DNI_KRATKO = ['P','T','S','Č','P','S','N']

export default function Navade() {
  const [navade,   setNavade]   = useState(beriNavade)
  const [vnosi,    setVnosi]    = useState(beriVnose)
  const [modal,    setModal]    = useState(false)
  const [uredi,    setUredi]    = useState(null)

  // forma
  const [fIme,   setFIme]   = useState('')
  const [fIkona, setFIkona] = useState('📚')
  const [fBarva, setFBarva] = useState('#3B82F6')

  const danasDatum = danes()

  function preklopi(id) {
    const vnos = { ...vnosi }
    const arr  = [...(vnos[danasDatum] || [])]
    const idx  = arr.indexOf(id)
    if (idx === -1) arr.push(id)
    else arr.splice(idx, 1)
    vnos[danasDatum] = arr
    setVnosi(vnos)
    shraniVnose(vnos)
  }

  function odpriModal(navada = null) {
    if (navada) {
      setUredi(navada.id); setFIme(navada.ime); setFIkona(navada.ikona); setFBarva(navada.barva)
    } else {
      setUredi(null); setFIme(''); setFIkona('📚'); setFBarva('#3B82F6')
    }
    setModal(true)
  }

  function shrani() {
    if (!fIme.trim()) return
    let nove
    if (uredi) {
      nove = navade.map(n => n.id === uredi ? { ...n, ime: fIme.trim(), ikona: fIkona, barva: fBarva } : n)
      prikaziObvestilo('Navada posodobljena', 'uspeh')
    } else {
      nove = [...navade, { id: genId(), ime: fIme.trim(), ikona: fIkona, barva: fBarva }]
      prikaziObvestilo('Navada dodana', 'uspeh')
    }
    setNavade(nove); shraniNavade(nove); setModal(false)
  }

  function izbrisi(id) {
    if (!confirm('Izbriši navado?')) return
    const nove = navade.filter(n => n.id !== id)
    setNavade(nove); shraniNavade(nove)
    prikaziObvestilo('Navada izbrisana', 'info')
  }

  const danesDokoncane = navade.filter(n => (vnosi[danasDatum] || []).includes(n.id)).length
  const procent = navade.length > 0 ? Math.round((danesDokoncane / navade.length) * 100) : 0

  return (
    <div className="stran-vsebina">
      {/* Glava */}
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov"><i className="ti ti-check" /> Navade</h1>
          <p style={{ color:'var(--besedilo3)', fontSize:'0.85rem', marginTop:2 }}>
            Sledenje dnevnim navadam in streak-om
          </p>
        </div>
        <button className="gumb gumb-primarni" onClick={() => odpriModal()}>
          <i className="ti ti-plus" /> Dodaj navado
        </button>
      </div>

      {/* Današnji napredek */}
      <div style={{
        background:'var(--ozadje1)', border:'1.5px solid var(--rob)', borderRadius:14,
        padding:'18px 22px', marginBottom:20,
        display:'flex', alignItems:'center', gap:20,
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'0.78rem', color:'var(--besedilo3)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Danes — {new Date().toLocaleDateString('sl-SI', { weekday:'long', day:'numeric', month:'long' })}
          </div>
          <div style={{ height:8, background:'var(--ozadje3)', borderRadius:99, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:99,
              background: procent === 100 ? 'var(--zelena)' : 'var(--modra)',
              width:`${procent}%`, transition:'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize:'0.8rem', color:'var(--besedilo3)', marginTop:5 }}>
            {danesDokoncane} / {navade.length} navad opravljenih
          </div>
        </div>
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ fontSize:'2rem', fontWeight:800, color: procent === 100 ? 'var(--zelena)' : 'var(--modra)', fontFamily:'var(--mono)' }}>
            {procent}%
          </div>
          {procent === 100 && <div style={{ fontSize:'0.72rem', color:'var(--zelena)', fontWeight:600 }}>Perfektno! 🎉</div>}
        </div>
      </div>

      {/* Navade */}
      {navade.length === 0 ? (
        <div className="prazno-stanje">
          <div className="prazno-ikona">✅</div>
          <p>Ni navad. Dodaj prvo!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {navade.map(navada => {
            const opravljeno = (vnosi[danasDatum] || []).includes(navada.id)
            const streak = izracunajStreak(navada.id, vnosi)
            const teden  = zadnjih7(navada.id, vnosi)
            return (
              <div key={navada.id} style={{
                background:'var(--ozadje1)', border:`1.5px solid ${opravljeno ? navada.barva + '66' : 'var(--rob)'}`,
                borderRadius:12, padding:'14px 16px',
                display:'flex', alignItems:'center', gap:14,
                transition:'border-color 0.2s',
                opacity: opravljeno ? 1 : 0.85,
              }}>
                {/* Checkbox */}
                <button
                  onClick={() => preklopi(navada.id)}
                  style={{
                    width:36, height:36, borderRadius:'50%', flexShrink:0,
                    border:`2px solid ${opravljeno ? navada.barva : 'var(--rob)'}`,
                    background: opravljeno ? navada.barva : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', transition:'all 0.2s', fontSize:'1rem',
                  }}
                >
                  {opravljeno ? <i className="ti ti-check" style={{ color:'#fff', fontSize:'0.9rem' }} /> : null}
                </button>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:'1.1rem' }}>{navada.ikona}</span>
                    <span style={{ fontWeight:600, fontSize:'0.9rem', textDecoration: opravljeno ? 'line-through' : 'none', color: opravljeno ? 'var(--besedilo3)' : 'var(--besedilo1)' }}>
                      {navada.ime}
                    </span>
                    {streak >= 3 && (
                      <span style={{ fontSize:'0.7rem', background:`${navada.barva}22`, color:navada.barva, padding:'1px 8px', borderRadius:99, fontWeight:700 }}>
                        🔥 {streak} dni
                      </span>
                    )}
                  </div>
                  {/* 7-dnevni pregled */}
                  <div style={{ display:'flex', gap:4 }}>
                    {teden.map(({ k, opravljeno: op, jeDanes }, i) => (
                      <div key={k} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'0.58rem', color:'var(--besedilo3)', marginBottom:2 }}>
                          {DNI_KRATKO[(new Date(k).getDay() + 6) % 7]}
                        </div>
                        <div style={{
                          width:18, height:18, borderRadius:4,
                          background: op ? navada.barva : 'var(--ozadje3)',
                          border: jeDanes ? `1.5px solid ${navada.barva}` : 'none',
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                          {op && <i className="ti ti-check" style={{ fontSize:'0.55rem', color:'#fff' }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streak */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:'1.1rem', fontWeight:800, color: streak > 0 ? navada.barva : 'var(--besedilo3)', fontFamily:'var(--mono)' }}>
                    {streak}
                  </div>
                  <div style={{ fontSize:'0.62rem', color:'var(--besedilo3)' }}>streak</div>
                </div>

                {/* Akcije */}
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button className="gumb-ikona" onClick={() => odpriModal(navada)} title="Uredi">
                    <i className="ti ti-edit" />
                  </button>
                  <button className="gumb-ikona" onClick={() => izbrisi(navada.id)} title="Izbriši" style={{ color:'var(--rdeca)' }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && createPortal(
        <div onClick={e => e.target === e.currentTarget && setModal(false)} style={{
          position:'fixed', inset:0, background:'rgba(2,8,23,0.75)', backdropFilter:'blur(4px)',
          zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
        }}>
          <div style={{
            background:'var(--ozadje1)', border:'1.5px solid var(--rob)', borderRadius:16,
            padding:'28px', width:'100%', maxWidth:420,
            maxHeight:'calc(100vh - 40px)', overflowY:'auto',
            boxShadow:'0 8px 48px rgba(0,0,20,0.7)',
          }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:20 }}>
              {uredi ? 'Uredi navado' : 'Dodaj navado'}
            </h2>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--besedilo3)', display:'block', marginBottom:5 }}>Ime *</label>
                <input className="vhod" placeholder="Npr. Meditacija…" value={fIme}
                  onChange={e => setFIme(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && shrani()}
                  autoFocus />
              </div>

              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--besedilo3)', display:'block', marginBottom:8 }}>Ikona</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {EMOIJI_IZBOR.map(e => (
                    <button key={e} onClick={() => setFIkona(e)} style={{
                      width:36, height:36, borderRadius:8, fontSize:'1.1rem',
                      border:`2px solid ${fIkona === e ? 'var(--modra)' : 'var(--rob)'}`,
                      background: fIkona === e ? 'var(--ozadje3)' : 'transparent',
                      cursor:'pointer',
                    }}>{e}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--besedilo3)', display:'block', marginBottom:5 }}>Barva</label>
                <input type="color" value={fBarva} onChange={e => setFBarva(e.target.value)}
                  style={{ width:48, height:36, padding:2, borderRadius:8, border:'1.5px solid var(--rob)', cursor:'pointer', background:'none' }} />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:22 }}>
              <button className="gumb gumb-sekundarni" onClick={() => setModal(false)}>Prekliči</button>
              <button className="gumb gumb-primarni" onClick={shrani} disabled={!fIme.trim()}>
                {uredi ? 'Shrani' : <><i className="ti ti-plus" /> Dodaj</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
