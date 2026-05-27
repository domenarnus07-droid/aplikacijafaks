import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'

const KLJUC_PROJ = 'studyos-projekti'
const KLJUC_NAL  = 'studyos-projekti-naloge'

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `lok-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
function beriLS(k)    { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
function shraniLS(k,v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

function normalizirajClane(arr) {
  return arr.flatMap(c =>
    c.includes(',') ? c.split(',').map(x => x.trim()).filter(Boolean)
    : c.trim().split(/\s+/).filter(Boolean)
  )
}

const BARVE   = ['#2563EB','#EF4444','#22C55E','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316']
const STOLPCI = [
  { id: 'todo',        oznaka: '📋 To Do',      barva: '#6B7280' },
  { id: 'v_delu',      oznaka: '🔧 V delu',      barva: '#3B82F6' },
  { id: 'preverjanje', oznaka: '👀 Preverjanje', barva: '#F59E0B' },
  { id: 'koncano',     oznaka: '✅ Končano',     barva: '#22C55E' },
]

/* ── Modal z React Portal ──────────────────────────────────────────────── */
function Modal({ naslov, onZapri, children }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onZapri() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [onZapri])

  return createPortal(
    <div onClick={e => e.target === e.currentTarget && onZapri()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(2,8,23,0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}>
      <div style={{
        background: 'var(--ozadje1)',
        border: '1.5px solid var(--rob)',
        borderRadius: 16,
        padding: 28,
        width: 480,
        maxWidth: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>
          {naslov}
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

/* ── Vnosno polje wrapper ──────────────────────────────────────────────── */
function VnosnaVrstica({ oznaka, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--besedilo3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {oznaka}
      </label>
      {children}
    </div>
  )
}

/* ── Modal: Nov projekt ────────────────────────────────────────────────── */
function NovProjektModal({ predmeti, onShrani, onZapri }) {
  const [ime,    setIme]    = useState('')
  const [barva,  setBarva]  = useState(BARVE[0])
  const [predmet,setPredmet]= useState(predmeti[0]?.id || '')
  const [clani,  setClani]  = useState('')

  function shrani() {
    if (!ime.trim()) { prikaziObvestilo('Vnesi ime projekta', 'napaka'); return }
    const claniArr = clani.trim() ? clani.split(',').map(c => c.trim()).filter(Boolean) : []
    onShrani({ _id: genId(), ime: ime.trim(), barva, predmet, clani: claniArr, ustvarjen: new Date().toISOString() })
  }

  return (
    <Modal naslov="➕ Nov projekt" onZapri={onZapri}>
      <VnosnaVrstica oznaka="Ime projekta">
        <input className="vhod" value={ime} onChange={e => setIme(e.target.value)}
          placeholder="Skupinski projekt…" autoFocus onKeyDown={e => e.key === 'Enter' && shrani()} />
      </VnosnaVrstica>

      <VnosnaVrstica oznaka="Predmet">
        <select className="vhod" value={predmet} onChange={e => setPredmet(e.target.value)}>
          {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
        </select>
      </VnosnaVrstica>

      <VnosnaVrstica oznaka="Barva">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {BARVE.map(b => (
            <button key={b} onClick={() => setBarva(b)}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: b, border: 'none',
                cursor: 'pointer', outline: barva === b ? `3px solid ${b}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </VnosnaVrstica>

      <VnosnaVrstica oznaka="Člani (ločeni z vejico)">
        <input className="vhod" value={clani} onChange={e => setClani(e.target.value)} placeholder="Ana, Bor, Cene…" />
      </VnosnaVrstica>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
        <button className="gumb gumb-primarni" onClick={shrani}>Ustvari projekt</button>
      </div>
    </Modal>
  )
}

/* ── Modal: Nova naloga ────────────────────────────────────────────────── */
function NovaNalogaModal({ projektId, stolpec, clani, privzetaOseba, onShrani, onZapri }) {
  const [ime,       setIme]       = useState('')
  const [oseba,     setOseba]     = useState(privzetaOseba ?? (clani[0] || ''))
  const [rok,       setRok]       = useState('')
  const [prioriteta,setPrioriteta]= useState('srednja')
  const [status,    setStatus]    = useState(stolpec)

  function shrani() {
    if (!ime.trim()) { prikaziObvestilo('Vnesi opis naloge', 'napaka'); return }
    onShrani({ _id: genId(), projektId, ime: ime.trim(), oseba, rok, status, prioriteta })
  }

  return (
    <Modal naslov="✚ Nova naloga" onZapri={onZapri}>
      <VnosnaVrstica oznaka="Naloga *">
        <input className="vhod" value={ime} onChange={e => setIme(e.target.value)}
          placeholder="Opis naloge…" autoFocus onKeyDown={e => e.key === 'Enter' && shrani()} />
      </VnosnaVrstica>

      {clani.length > 0 && (
        <VnosnaVrstica oznaka="Dodeljena osebi">
          <select className="vhod" value={oseba} onChange={e => setOseba(e.target.value)}>
            <option value="">— Nihče —</option>
            {clani.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </VnosnaVrstica>
      )}

      <VnosnaVrstica oznaka="Stolpec">
        <select className="vhod" value={status} onChange={e => setStatus(e.target.value)}>
          {STOLPCI.map(k => <option key={k.id} value={k.id}>{k.oznaka}</option>)}
        </select>
      </VnosnaVrstica>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--besedilo3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rok</label>
          <input className="vhod" type="date" value={rok} onChange={e => setRok(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--besedilo3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prioriteta</label>
          <select className="vhod" value={prioriteta} onChange={e => setPrioriteta(e.target.value)}>
            <option value="visoka">🔴 Visoka</option>
            <option value="srednja">🟡 Srednja</option>
            <option value="nizka">🟢 Nizka</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
        <button className="gumb gumb-primarni" onClick={shrani} disabled={!ime.trim()}>Dodaj nalogo</button>
      </div>
    </Modal>
  )
}

/* ── Kanban kartica ────────────────────────────────────────────────────── */
function KanbanKartica({ n, onIzbrisi, onSpremiStatus }) {
  const barvaP = n.prioriteta === 'visoka' ? '#EF4444' : n.prioriteta === 'nizka' ? '#22C55E' : '#F59E0B'
  return (
    <div style={{
      background: 'var(--ozadje1)', border: '1.5px solid var(--rob)', borderRadius: 10,
      padding: '10px 12px', marginBottom: 8, wordBreak: 'break-word', minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: barvaP, flexShrink: 0, marginTop: 4 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>{n.ime}</div>
          {n.oseba && <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 2 }}>👤 {n.oseba}</div>}
          {n.rok   && <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)', marginTop: 2 }}>📅 {n.rok}</div>}
        </div>
        <button onClick={() => onIzbrisi(n._id)} title="Izbriši"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rdeca)', fontSize: '0.75rem', padding: 2, opacity: 0.7, lineHeight: 1 }}>
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {STOLPCI.filter(k => k.id !== n.status).map(k => (
          <button key={k.id} onClick={() => onSpremiStatus(n._id, k.id)}
            style={{
              fontSize: '0.6rem', padding: '2px 7px', borderRadius: 6,
              background: k.barva + '22', border: `1px solid ${k.barva}44`,
              color: k.barva, cursor: 'pointer', fontWeight: 600,
            }}>
            → {k.oznaka.split(' ').slice(1).join(' ')}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Glavna komponenta ─────────────────────────────────────────────────── */
export default function Projekti() {
  const { predmeti } = useApp()
  const [projekti,   setProjekti]  = useState(() => beriLS(KLJUC_PROJ))
  const [naloge,     setNaloge]    = useState(() => beriLS(KLJUC_NAL))
  const [aktProjekt, setAktProjekt]= useState(null)
  const [novProjekt, setNovProjekt]= useState(false)
  const [novaNaloga, setNovaNaloga]= useState(null) // { stolpec, oseba } | null
  const [pogled,     setPogled]    = useState('kanban')

  useEffect(() => {
    if (projekti.length > 0 && !aktProjekt) setAktProjekt(projekti[0])
  }, [projekti])

  function dodajProjekt(nov) {
    const novi = [...projekti, nov]
    setProjekti(novi); shraniLS(KLJUC_PROJ, novi)
    setAktProjekt(nov); setNovProjekt(false)
    prikaziObvestilo('Projekt ustvarjen ✓', 'uspeh')
  }

  function izbrisiProjekt(id) {
    if (!confirm('Izbriši projekt in vse naloge?')) return
    const novi = projekti.filter(p => p._id !== id)
    const noveN = naloge.filter(n => n.projektId !== id)
    setProjekti(novi); setNaloge(noveN)
    shraniLS(KLJUC_PROJ, novi); shraniLS(KLJUC_NAL, noveN)
    setAktProjekt(novi[0] || null)
    prikaziObvestilo('Projekt izbrisan', 'uspeh')
  }

  function dodajNalogo(nova) {
    const nove = [...naloge, nova]
    setNaloge(nove); shraniLS(KLJUC_NAL, nove)
    setNovaNaloga(null)
    prikaziObvestilo('Naloga dodana ✓', 'uspeh')
  }

  function spremiStatus(nalogaId, novStatus) {
    const nove = naloge.map(n => n._id === nalogaId ? { ...n, status: novStatus } : n)
    setNaloge(nove); shraniLS(KLJUC_NAL, nove)
  }

  function izbrisiNalogo(id) {
    setNaloge(prev => { const n = prev.filter(x => x._id !== id); shraniLS(KLJUC_NAL, n); return n })
  }

  const projNaloge = aktProjekt ? naloge.filter(n => n.projektId === aktProjekt._id) : []
  const clani = aktProjekt ? normalizirajClane(aktProjekt.clani || []) : []

  return (
    <div style={{ padding: '32px 36px', height: '100%', overflow: 'auto', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>

      {/* Glava */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            <i className="ti ti-users" style={{ marginRight: 10, color: 'var(--modra)' }} />
            Skupinski projekti
          </h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem', marginTop: 4 }}>Kanban tabla za skupinsko delo</p>
        </div>
        <button className="gumb gumb-primarni" onClick={() => setNovProjekt(true)}>
          <i className="ti ti-plus" /> Nov projekt
        </button>
      </div>

      {/* Layout: levi panel + desni panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 20, alignItems: 'start', minWidth: 0, overflow: 'hidden' }}>

        {/* ── Levi panel: seznam projektov ── */}
        <div style={{ background: 'var(--ozadje2)', borderRadius: 12, border: '1.5px solid var(--rob)', padding: 12, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--besedilo3)', marginBottom: 10 }}>
            Projekti ({projekti.length})
          </div>

          {projekti.length === 0 && (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--besedilo3)', fontSize: '0.82rem' }}>
              Ni projektov
            </div>
          )}

          {projekti.map(p => {
            const pred = predmeti.find(pr => pr.id === p.predmet)
            const cL = normalizirajClane(p.clani || [])
            const aktiven = aktProjekt?._id === p._id
            return (
              <div key={p._id} onClick={() => setAktProjekt(p)}
                style={{
                  padding: '10px 10px', borderRadius: 9, marginBottom: 4, cursor: 'pointer',
                  background: aktiven ? 'var(--modra)' : 'transparent',
                  color: aktiven ? '#fff' : 'inherit',
                  border: aktiven ? 'none' : '1px solid transparent',
                  transition: 'background 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: aktiven ? '#fff' : p.barva, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.ime}
                  </span>
                  <button onClick={e => { e.stopPropagation(); izbrisiProjekt(p._id) }}
                    title="Izbriši projekt"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: aktiven ? '#ffaaaa' : 'var(--rdeca)', fontSize: '0.7rem', padding: 2, opacity: 0.7, lineHeight: 1 }}>
                    ✕
                  </button>
                </div>
                {pred && (
                  <div style={{ fontSize: '0.68rem', marginTop: 2, paddingLeft: 16, opacity: aktiven ? 0.85 : undefined, color: aktiven ? '#fff' : 'var(--besedilo3)' }}>
                    {pred.ikona} {pred.ime}
                  </div>
                )}
                {cL.length > 0 && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 4, paddingLeft: 16, flexWrap: 'wrap' }}>
                    {cL.slice(0, 4).map(c => (
                      <span key={c} style={{
                        fontSize: '0.6rem', padding: '1px 5px', borderRadius: 99,
                        background: aktiven ? 'rgba(255,255,255,0.2)' : p.barva + '22',
                        color: aktiven ? '#fff' : p.barva, fontWeight: 600,
                      }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Desni panel: kanban ── */}
        {!aktProjekt ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--besedilo3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
            <p>Izberi ali ustvari projekt</p>
          </div>
        ) : (
          <div>
            {/* Projekt header + toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: aktProjekt.barva, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{aktProjekt.ime}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', background: 'var(--ozadje2)', padding: '2px 8px', borderRadius: 99 }}>
                {projNaloge.length} nalog
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {['kanban','osebe'].map(p => (
                  (p === 'osebe' && clani.length === 0) ? null :
                  <button key={p}
                    className={`gumb ${pogled === p ? 'gumb-primarni' : 'gumb-sekundarni'}`}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => setPogled(p)}>
                    <i className={`ti ${p === 'kanban' ? 'ti-layout-columns' : 'ti-users'}`} />
                    {p === 'kanban' ? ' Kanban' : ' Po osebi'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Kanban ── */}
            {pogled === 'kanban' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, alignItems: 'start', overflowX: 'auto', minWidth: 0 }}>
                {STOLPCI.map(kol => {
                  const kolNaloge = projNaloge.filter(n => n.status === kol.id)
                  return (
                    <div key={kol.id} style={{ background: 'var(--ozadje2)', borderRadius: 12, border: '1.5px solid var(--rob)', overflow: 'hidden', minWidth: 0, minHeight: 200 }}>
                      {/* Stolpec glava */}
                      <div style={{
                        padding: '10px 14px', borderBottom: '1.5px solid var(--rob)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: kol.barva + '15',
                      }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{kol.oznaka}</span>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                          background: kol.barva, color: '#fff',
                        }}>{kolNaloge.length}</span>
                      </div>
                      {/* Kartice */}
                      <div style={{ padding: '10px 10px 6px' }}>
                        {kolNaloge.map(n => (
                          <KanbanKartica key={n._id} n={n} onIzbrisi={izbrisiNalogo} onSpremiStatus={spremiStatus} />
                        ))}
                        <button
                          onClick={() => setNovaNaloga({ stolpec: kol.id, oseba: null })}
                          style={{
                            width: '100%', padding: '7px', borderRadius: 8, fontSize: '0.78rem',
                            background: 'transparent', border: `1.5px dashed var(--rob)`,
                            color: 'var(--besedilo3)', cursor: 'pointer', fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            marginTop: 4,
                          }}>
                          <i className="ti ti-plus" /> Dodaj
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Po osebi ── */}
            {pogled === 'osebe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Splošne */}
                {(() => {
                  const splosne = projNaloge.filter(n => !n.oseba)
                  return (
                    <div style={{ background: 'var(--ozadje2)', border: '1.5px solid var(--rob)', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>📋 Splošne naloge</span>
                        <button className="gumb gumb-sekundarni" style={{ padding: '4px 10px', fontSize: '0.73rem' }}
                          onClick={() => setNovaNaloga({ stolpec: 'todo', oseba: '' })}>
                          <i className="ti ti-plus" /> Dodaj
                        </button>
                      </div>
                      {splosne.length === 0
                        ? <div style={{ fontSize: '0.8rem', color: 'var(--besedilo3)' }}>Ni splošnih nalog</div>
                        : splosne.map(n => <KanbanKartica key={n._id} n={n} onIzbrisi={izbrisiNalogo} onSpremiStatus={spremiStatus} />)
                      }
                    </div>
                  )
                })()}

                {clani.map(oseba => {
                  const oN = projNaloge.filter(n => n.oseba === oseba)
                  const opr = oN.filter(n => n.status === 'koncano').length
                  return (
                    <div key={oseba} style={{ background: 'var(--ozadje2)', border: '1.5px solid var(--rob)', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: aktProjekt.barva + '33', border: `2px solid ${aktProjekt.barva}66`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, color: aktProjekt.barva, fontSize: '0.95rem',
                          }}>{oseba[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{oseba}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)' }}>{oN.length} nalog · {opr} končanih</div>
                          </div>
                        </div>
                        <button className="gumb gumb-primarni" style={{ padding: '5px 12px', fontSize: '0.73rem' }}
                          onClick={() => setNovaNaloga({ stolpec: 'todo', oseba })}>
                          <i className="ti ti-plus" /> Dodaj
                        </button>
                      </div>
                      {oN.length > 0 && (
                        <div style={{ height: 4, background: 'var(--ozadje3)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(opr / oN.length * 100)}%`, background: aktProjekt.barva, borderRadius: 2, transition: 'width .3s' }} />
                        </div>
                      )}
                      {oN.length === 0
                        ? <div style={{ fontSize: '0.8rem', color: 'var(--besedilo3)' }}>Ni nalog</div>
                        : oN.map(n => <KanbanKartica key={n._id} n={n} onIzbrisi={izbrisiNalogo} onSpremiStatus={spremiStatus} />)
                      }
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modali */}
      {novProjekt && (
        <NovProjektModal predmeti={predmeti} onShrani={dodajProjekt} onZapri={() => setNovProjekt(false)} />
      )}
      {novaNaloga !== null && aktProjekt && (
        <NovaNalogaModal
          projektId={aktProjekt._id}
          stolpec={novaNaloga.stolpec}
          clani={clani}
          privzetaOseba={novaNaloga.oseba}
          onShrani={dodajNalogo}
          onZapri={() => setNovaNaloga(null)}
        />
      )}
    </div>
  )
}
