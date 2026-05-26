import { useState, useEffect } from 'react'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'

const KLJUC_PROJ = 'studyos-projekti'
const KLJUC_NAL  = 'studyos-projekti-naloge'

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `lok-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
function beriLS(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
function shraniLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// Normalizira člane: "ana bor cene" → ['ana','bor','cene'], ['ana, bor'] → ['ana','bor']
function normalizirajClane(arr) {
  return arr.flatMap(c =>
    c.includes(',') ? c.split(',').map(x => x.trim()).filter(Boolean)
    : c.trim().split(/\s+/).filter(Boolean)
  )
}

const BARVE = ['#2563EB','#EF4444','#22C55E','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316']

const STOLPCI = [
  { id: 'todo',        oznaka: '📋 To Do',       barva: 'var(--besedilo3)' },
  { id: 'v_delu',      oznaka: '🔧 V delu',       barva: 'var(--modra)'    },
  { id: 'preverjanje', oznaka: '👀 Preverjanje',  barva: 'var(--rumena)'   },
  { id: 'koncano',     oznaka: '✅ Končano',      barva: 'var(--zelena)'   },
]

const STOLPEC_BARVE = {
  todo: '#6B7280', v_delu: '#3B82F6', preverjanje: '#F59E0B', koncano: '#22C55E'
}

function NovProjektObrazec({ predmeti, onShrani, onZapri }) {
  const [ime, setIme] = useState('')
  const [barva, setBarva] = useState(BARVE[0])
  const [predmet, setPredmet] = useState(predmeti[0]?.id || '')
  const [clani, setClani] = useState('')

  function shrani() {
    if (!ime.trim()) { prikaziObvestilo('Vnesi ime projekta', 'napaka'); return }
    const claniArr = clani.trim()
      ? clani.split(',').map(c => c.trim()).filter(Boolean)
      : []
    onShrani({ _id: genId(), ime: ime.trim(), barva, predmet, clani: claniArr, ustvarjen: new Date().toISOString() })
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal">
        <div className="modal-naslov">➕ Nov projekt</div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Ime projekta</label>
          <input className="vhod" value={ime} onChange={e => setIme(e.target.value)} placeholder="Skupinski projekt…" autoFocus />
        </div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Predmet</label>
          <select className="vhod izbira" value={predmet} onChange={e => setPredmet(e.target.value)}>
            {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
          </select>
        </div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Barva</label>
          <div className="barvni-izbirnik">
            {BARVE.map(b => (
              <button key={b} className={`barva-gumb ${barva === b ? 'izbrana' : ''}`}
                style={{ background: b }} onClick={() => setBarva(b)} />
            ))}
          </div>
        </div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Člani <span style={{ fontWeight: 400, color: 'var(--besedilo3)' }}>(ločeni z vejico)</span></label>
          <input className="vhod" value={clani} onChange={e => setClani(e.target.value)}
            placeholder="Ana, Bor, Cene…" />
          <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginTop: 4 }}>
            Primer: <code style={{ fontFamily: 'var(--mono)' }}>Ana, Bor, Cene</code>
          </div>
        </div>
        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
          <button className="gumb gumb-primarni" onClick={shrani}>Ustvari projekt</button>
        </div>
      </div>
    </div>
  )
}

function NovaNalogaObrazec({ projektId, stolpec, clani, privzetaOseba, onShrani, onZapri }) {
  const [ime,       setIme]       = useState('')
  const [oseba,     setOseba]     = useState(privzetaOseba || (clani.length > 0 ? clani[0] : ''))
  const [rok,       setRok]       = useState('')
  const [prioriteta,setPrioriteta]= useState('srednja')
  const [status,    setStatus]    = useState(stolpec)

  function shrani() {
    if (!ime.trim()) { prikaziObvestilo('Vnesi ime naloge', 'napaka'); return }
    onShrani({ _id: genId(), projektId, ime: ime.trim(), oseba, rok, status, prioriteta })
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal">
        <div className="modal-naslov">➕ Nova naloga</div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Naloga</label>
          <input className="vhod" value={ime} onChange={e => setIme(e.target.value)}
            placeholder="Opis naloge…" autoFocus onKeyDown={e => e.key === 'Enter' && shrani()} />
        </div>
        {clani.length > 0 && (
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Dodeljena osebi</label>
            <select className="vhod izbira" value={oseba} onChange={e => setOseba(e.target.value)}>
              <option value="">— Nihče (splošna naloga) —</option>
              {clani.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Stolpec</label>
          <select className="vhod izbira" value={status} onChange={e => setStatus(e.target.value)}>
            {STOLPCI.map(k => <option key={k.id} value={k.id}>{k.oznaka}</option>)}
          </select>
        </div>
        <div className="vnosni-par">
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Rok</label>
            <input className="vhod" type="date" value={rok} onChange={e => setRok(e.target.value)} />
          </div>
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Prioriteta</label>
            <select className="vhod izbira" value={prioriteta} onChange={e => setPrioriteta(e.target.value)}>
              <option value="visoka">🔴 Visoka</option>
              <option value="srednja">🟡 Srednja</option>
              <option value="nizka">🟢 Nizka</option>
            </select>
          </div>
        </div>
        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
          <button className="gumb gumb-primarni" onClick={shrani}>Dodaj nalogo</button>
        </div>
      </div>
    </div>
  )
}

// ── Kanban kartica ─────────────────────────────────────────────────────────────
function KanbanKartica({ n, onIzbrisi, onSpremiStatus }) {
  const barvaP = n.prioriteta === 'visoka' ? '#EF4444' : n.prioriteta === 'nizka' ? '#22C55E' : '#F59E0B'
  return (
    <div className="kanban-kartica">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>{n.ime}</div>
          {n.oseba && (
            <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 3 }}>
              👤 {n.oseba}
            </div>
          )}
          {n.rok && (
            <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              📅 {n.rok}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: barvaP, display: 'block' }} title={n.prioriteta} />
          <button className="gumb-ikona rdeca" style={{ width: 18, height: 18 }} onClick={() => onIzbrisi(n._id)}>
            <i className="ti ti-x" style={{ fontSize: '0.6rem' }} />
          </button>
        </div>
      </div>
      {/* Premakni v stolpec */}
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {STOLPCI.filter(k => k.id !== n.status).map(k => (
          <button key={k.id} onClick={() => onSpremiStatus(n._id, k.id)}
            style={{
              fontSize: '0.6rem', padding: '2px 7px', borderRadius: 6,
              background: STOLPEC_BARVE[k.id] + '22', border: `1px solid ${STOLPEC_BARVE[k.id]}44`,
              color: STOLPEC_BARVE[k.id], cursor: 'pointer', fontWeight: 600,
            }}>
            → {k.oznaka.split(' ').slice(1).join(' ') || k.id}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Projekti() {
  const { predmeti } = useApp()
  const [projekti,     setProjekti]    = useState(() => beriLS(KLJUC_PROJ))
  const [naloge,       setNaloge]      = useState(() => beriLS(KLJUC_NAL))
  const [aktProjekt,   setAktProjekt]  = useState(null)
  const [novProjObrazec, setNovProjObrazec] = useState(false)
  const [novaNalogaStolpec, setNovaNalogaStolpec] = useState(null)
  const [novaNalogaOseba, setNovaNalogaOseba] = useState(null)
  const [pogled,       setPogled]      = useState('kanban') // 'kanban' | 'osebe'

  useEffect(() => {
    if (projekti.length > 0 && !aktProjekt) setAktProjekt(projekti[0])
  }, [projekti])

  function dodajProjekt(nov) {
    const novi = [...projekti, nov]
    setProjekti(novi); shraniLS(KLJUC_PROJ, novi)
    setAktProjekt(nov); setNovProjObrazec(false)
    prikaziObvestilo('Projekt ustvarjen', 'uspeh')
  }

  function izbrisiProjekt(id) {
    if (!confirm('Izbriši projekt in vse njegove naloge?')) return
    const novi = projekti.filter(p => p._id !== id)
    const noveNaloge = naloge.filter(n => n.projektId !== id)
    setProjekti(novi); setNaloge(noveNaloge)
    shraniLS(KLJUC_PROJ, novi); shraniLS(KLJUC_NAL, noveNaloge)
    setAktProjekt(novi[0] || null)
    prikaziObvestilo('Projekt izbrisan', 'uspeh')
  }

  function dodajNalogo(nova) {
    const nove = [...naloge, nova]
    setNaloge(nove); shraniLS(KLJUC_NAL, nove)
    setNovaNalogaStolpec(null); setNovaNalogaOseba(null)
    prikaziObvestilo('Naloga dodana', 'uspeh')
  }

  function spremiStatus(nalogaId, novStatus) {
    const nove = naloge.map(n => n._id === nalogaId ? { ...n, status: novStatus } : n)
    setNaloge(nove); shraniLS(KLJUC_NAL, nove)
  }

  function izbrisiNalogo(id) {
    const nove = naloge.filter(n => n._id !== id)
    setNaloge(nove); shraniLS(KLJUC_NAL, nove)
  }

  const projNaloge = aktProjekt ? naloge.filter(n => n.projektId === aktProjekt._id) : []
  // Normalizirani člani (kompatibilnost s starim zapisom brez vejic)
  const clani = aktProjekt ? normalizirajClane(aktProjekt.clani || []) : []

  return (
    <>
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov">Skupinski projekti</h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem', marginTop: 4 }}>
            Kanban tabla za skupinsko delo
          </p>
        </div>
        <button className="gumb gumb-primarni" onClick={() => setNovProjObrazec(true)}>
          <i className="ti ti-plus" /> Nov projekt
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Levi panel */}
        <div className="kartica" style={{ padding: '14px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--besedilo3)', marginBottom: 10 }}>
            Projekti ({projekti.length})
          </div>
          {projekti.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--besedilo3)', fontSize: '0.85rem' }}>
              Ni projektov
            </div>
          )}
          {projekti.map(p => {
            const pred = predmeti.find(pr => pr.id === p.predmet)
            const claniP = normalizirajClane(p.clani || [])
            return (
              <div key={p._id}
                className={`projekt-kartica ${aktProjekt?._id === p._id ? 'aktiven' : ''}`}
                onClick={() => setAktProjekt(p)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.barva, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.ime}
                  </span>
                  <button className="gumb-ikona rdeca" style={{ width: 20, height: 20, opacity: 0.5 }}
                    onClick={e => { e.stopPropagation(); izbrisiProjekt(p._id) }}>
                    <i className="ti ti-trash" style={{ fontSize: '0.65rem' }} />
                  </button>
                </div>
                {pred && <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 3, paddingLeft: 18 }}>{pred.ikona} {pred.ime}</div>}
                {claniP.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, paddingLeft: 18, flexWrap: 'wrap' }}>
                    {claniP.map(c => (
                      <span key={c} style={{
                        fontSize: '0.62rem', padding: '1px 6px', borderRadius: 99,
                        background: p.barva + '22', border: `1px solid ${p.barva}44`, color: p.barva, fontWeight: 600,
                      }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desni panel */}
        {aktProjekt ? (
          <div>
            {/* Glava projekta + pogled toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: aktProjekt.barva }} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{aktProjekt.ime}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--besedilo3)' }}>{projNaloge.length} nalog</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button
                  className={`gumb ${pogled === 'kanban' ? 'gumb-primarni' : 'gumb-sekundarni'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => setPogled('kanban')}
                >
                  <i className="ti ti-layout-columns" /> Kanban
                </button>
                {clani.length > 0 && (
                  <button
                    className={`gumb ${pogled === 'osebe' ? 'gumb-primarni' : 'gumb-sekundarni'}`}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => setPogled('osebe')}
                  >
                    <i className="ti ti-users" /> Po osebi
                  </button>
                )}
              </div>
            </div>

            {/* ── KANBAN POGLED ─────────────────────────────────── */}
            {pogled === 'kanban' && (
              <div className="projekt-kanban">
                {STOLPCI.map(kol => {
                  const kolNaloge = projNaloge.filter(n => n.status === kol.id)
                  return (
                    <div key={kol.id} className="kanban-stolpec">
                      <div className="kanban-stolpec-glava">
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{kol.oznaka}</span>
                        <span className="znacka" style={{ background: STOLPEC_BARVE[kol.id] }}>{kolNaloge.length}</span>
                      </div>
                      <div className="kanban-kartice">
                        {kolNaloge.map(n => (
                          <KanbanKartica key={n._id} n={n} onIzbrisi={izbrisiNalogo} onSpremiStatus={spremiStatus} />
                        ))}
                        <button className="kanban-dodaj-gumb"
                          onClick={() => { setNovaNalogaStolpec(kol.id); setNovaNalogaOseba(null) }}>
                          <i className="ti ti-plus" /> Dodaj nalogo
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── POGLED PO OSEBI ───────────────────────────────── */}
            {pogled === 'osebe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Splošne naloge (brez osebe) */}
                {(() => {
                  const splosne = projNaloge.filter(n => !n.oseba)
                  return (
                    <div className="kartica" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>📋 Splošne naloge</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>{splosne.length}</span>
                          <button className="gumb gumb-sekundarni" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => { setNovaNalogaStolpec('todo'); setNovaNalogaOseba('') }}>
                            <i className="ti ti-plus" /> Dodaj
                          </button>
                        </div>
                      </div>
                      {splosne.length === 0
                        ? <div style={{ fontSize: '0.8rem', color: 'var(--besedilo3)' }}>Ni splošnih nalog</div>
                        : splosne.map(n => <KanbanKartica key={n._id} n={n} onIzbrisi={izbrisiNalogo} onSpremiStatus={spremiStatus} />)
                      }
                    </div>
                  )
                })()}

                {/* Po osebi */}
                {clani.map(oseba => {
                  const osebaNaloge = projNaloge.filter(n => n.oseba === oseba)
                  const opravljene  = osebaNaloge.filter(n => n.status === 'koncano').length
                  return (
                    <div key={oseba} className="kartica" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: aktProjekt.barva + '33', border: `2px solid ${aktProjekt.barva}66`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.95rem', fontWeight: 700, color: aktProjekt.barva,
                          }}>
                            {oseba[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{oseba}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)' }}>
                              {osebaNaloge.length} nalog · {opravljene} končanih
                            </div>
                          </div>
                        </div>
                        <button
                          className="gumb gumb-primarni"
                          style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                          onClick={() => { setNovaNalogaStolpec('todo'); setNovaNalogaOseba(oseba) }}
                        >
                          <i className="ti ti-plus" /> Dodaj nalogi {oseba}
                        </button>
                      </div>

                      {/* Napredek */}
                      {osebaNaloge.length > 0 && (
                        <div style={{ height: 4, background: 'var(--ozadje3)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(opravljene / osebaNaloge.length * 100)}%`, background: aktProjekt.barva, borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                      )}

                      {/* Naloge po stolpcih */}
                      {osebaNaloge.length === 0
                        ? <div style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', padding: '4px 0' }}>Ni nalog</div>
                        : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                            {STOLPCI.map(kol => {
                              const kNaloge = osebaNaloge.filter(n => n.status === kol.id)
                              if (kNaloge.length === 0) return null
                              return (
                                <div key={kol.id}>
                                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: STOLPEC_BARVE[kol.id], marginBottom: 4 }}>{kol.oznaka}</div>
                                  {kNaloge.map(n => <KanbanKartica key={n._id} n={n} onIzbrisi={izbrisiNalogo} onSpremiStatus={spremiStatus} />)}
                                </div>
                              )
                            })}
                          </div>
                        )
                      }
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="prazno-stanje">
            <div className="prazno-ikona">📋</div>
            <p>Izberi ali ustvari projekt</p>
          </div>
        )}
      </div>

      {novProjObrazec && (
        <NovProjektObrazec predmeti={predmeti} onShrani={dodajProjekt} onZapri={() => setNovProjObrazec(false)} />
      )}

      {novaNalogaStolpec !== null && aktProjekt && (
        <NovaNalogaObrazec
          projektId={aktProjekt._id}
          stolpec={novaNalogaStolpec}
          clani={clani}
          privzetaOseba={novaNalogaOseba}
          onShrani={dodajNalogo}
          onZapri={() => { setNovaNalogaStolpec(null); setNovaNalogaOseba(null) }}
        />
      )}
    </>
  )
}
