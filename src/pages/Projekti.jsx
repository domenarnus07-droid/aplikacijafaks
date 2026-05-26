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

function beriLS(k) {
  try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] }
}
function shraniLS(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

const BARVE = ['#2563EB','#EF4444','#22C55E','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316']

const STOLPCI = [
  { id: 'todo',        oznaka: '📋 To Do',       barva: 'var(--besedilo3)' },
  { id: 'v_delu',      oznaka: '🔧 V delu',       barva: 'var(--modra)'    },
  { id: 'preverjanje', oznaka: '👀 Preverjanje',  barva: 'var(--rumena)'   },
  { id: 'koncano',     oznaka: '✅ Končano',      barva: 'var(--zelena)'   },
]

function NovProjektObrazec({ predmeti, onShrani, onZapri }) {
  const [ime, setIme] = useState('')
  const [barva, setBarva] = useState(BARVE[0])
  const [predmet, setPredmet] = useState(predmeti[0]?.id || '')
  const [clani, setClani] = useState('')

  function shrani() {
    if (!ime.trim()) { prikaziObvestilo('Vnesi ime projekta', 'napaka'); return }
    onShrani({
      _id: genId(),
      ime: ime.trim(),
      barva,
      predmet,
      clani: clani.split(',').map(c => c.trim()).filter(Boolean),
      ustvarjen: new Date().toISOString(),
    })
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal">
        <div className="modal-naslov">➕ Nov projekt</div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Ime projekta</label>
          <input className="vhod" value={ime} onChange={e => setIme(e.target.value)} placeholder="Skupinski projekt…" />
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
              <button
                key={b}
                className={`barva-gumb ${barva === b ? 'izbrana' : ''}`}
                style={{ background: b }}
                onClick={() => setBarva(b)}
              />
            ))}
          </div>
        </div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Člani (ločeni z vejico)</label>
          <input className="vhod" value={clani} onChange={e => setClani(e.target.value)} placeholder="Ana, Bor, Cene…" />
        </div>
        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
          <button className="gumb gumb-primarni" onClick={shrani}>Ustvari projekt</button>
        </div>
      </div>
    </div>
  )
}

function NovaNalogaObrazec({ projektId, stolpec, clani, onShrani, onZapri }) {
  const [ime, setIme] = useState('')
  const [oseba, setOseba] = useState(clani[0] || '')
  const [rok, setRok] = useState('')
  const [prioriteta, setPrioriteta] = useState('srednja')

  function shrani() {
    if (!ime.trim()) { prikaziObvestilo('Vnesi ime naloge', 'napaka'); return }
    onShrani({
      _id: genId(),
      projektId,
      ime: ime.trim(),
      oseba,
      rok,
      status: stolpec,
      prioriteta,
    })
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal">
        <div className="modal-naslov">➕ Nova naloga</div>
        <div className="vnosna-vrstica">
          <label className="vnosna-oznaka">Naloga</label>
          <input className="vhod" value={ime} onChange={e => setIme(e.target.value)} placeholder="Opis naloge…" autoFocus />
        </div>
        {clani.length > 0 && (
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Dodeljena osebi</label>
            <select className="vhod izbira" value={oseba} onChange={e => setOseba(e.target.value)}>
              <option value="">— Nihče —</option>
              {clani.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="vnosni-par">
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Rok</label>
            <input className="vhod" type="date" value={rok} onChange={e => setRok(e.target.value)} />
          </div>
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Prioriteta</label>
            <select className="vhod izbira" value={prioriteta} onChange={e => setPrioriteta(e.target.value)}>
              <option value="visoka">Visoka</option>
              <option value="srednja">Srednja</option>
              <option value="nizka">Nizka</option>
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

export default function Projekti() {
  const { predmeti } = useApp()
  const [projekti, setProjekti] = useState(() => beriLS(KLJUC_PROJ))
  const [naloge,   setNaloge]   = useState(() => beriLS(KLJUC_NAL))
  const [aktProjekt, setAktProjekt] = useState(null)
  const [novProjObrazec, setNovProjObrazec] = useState(false)
  const [novaNalogaStolpec, setNovaNalogaStolpec] = useState(null)

  useEffect(() => {
    if (projekti.length > 0 && !aktProjekt) setAktProjekt(projekti[0])
  }, [projekti])

  function dodajProjekt(nov) {
    const novi = [...projekti, nov]
    setProjekti(novi)
    shraniLS(KLJUC_PROJ, novi)
    setAktProjekt(nov)
    setNovProjObrazec(false)
    prikaziObvestilo('Projekt ustvarjen', 'uspeh')
  }

  function izbrisiProjekt(id) {
    if (!confirm('Izbriši projekt in vse njegove naloge?')) return
    const novi = projekti.filter(p => p._id !== id)
    const noveNaloge = naloge.filter(n => n.projektId !== id)
    setProjekti(novi)
    setNaloge(noveNaloge)
    shraniLS(KLJUC_PROJ, novi)
    shraniLS(KLJUC_NAL, noveNaloge)
    setAktProjekt(novi[0] || null)
    prikaziObvestilo('Projekt izbrisan', 'uspeh')
  }

  function dodajNalogo(nova) {
    const nove = [...naloge, nova]
    setNaloge(nove)
    shraniLS(KLJUC_NAL, nove)
    setNovaNalogaStolpec(null)
    prikaziObvestilo('Naloga dodana', 'uspeh')
  }

  function spremiStatus(nalogaId, novStatus) {
    const nove = naloge.map(n => n._id === nalogaId ? { ...n, status: novStatus } : n)
    setNaloge(nove)
    shraniLS(KLJUC_NAL, nove)
  }

  function izbrisiNalogo(id) {
    const nove = naloge.filter(n => n._id !== id)
    setNaloge(nove)
    shraniLS(KLJUC_NAL, nove)
  }

  const projNaloge = aktProjekt ? naloge.filter(n => n.projektId === aktProjekt._id) : []

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
        {/* Levi panel: seznam projektov */}
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
            return (
              <div
                key={p._id}
                className={`projekt-kartica ${aktProjekt?._id === p._id ? 'aktiven' : ''}`}
                onClick={() => setAktProjekt(p)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.barva, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.ime}
                  </span>
                  <button
                    className="gumb-ikona rdeca"
                    style={{ width: 20, height: 20, opacity: 0.5 }}
                    onClick={e => { e.stopPropagation(); izbrisiProjekt(p._id) }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: '0.65rem' }} />
                  </button>
                </div>
                {pred && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 3, paddingLeft: 18 }}>
                    {pred.ikona} {pred.ime}
                  </div>
                )}
                {p.clani.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 2, paddingLeft: 18 }}>
                    👥 {p.clani.join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desni panel: Kanban */}
        {aktProjekt ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: aktProjekt.barva }} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{aktProjekt.ime}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--besedilo3)' }}>{projNaloge.length} nalog</span>
            </div>
            <div className="projekt-kanban">
              {STOLPCI.map(kol => {
                const kolNaloge = projNaloge.filter(n => n.status === kol.id)
                return (
                  <div key={kol.id} className="kanban-stolpec">
                    <div className="kanban-stolpec-glava">
                      <span>{kol.oznaka}</span>
                      <span className="znacka">{kolNaloge.length}</span>
                    </div>
                    <div className="kanban-kartice">
                      {kolNaloge.map(n => (
                        <div key={n._id} className="kanban-kartica">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>{n.ime}</div>
                            <button
                              className="gumb-ikona rdeca"
                              style={{ width: 18, height: 18, flexShrink: 0 }}
                              onClick={() => izbrisiNalogo(n._id)}
                            >
                              <i className="ti ti-x" style={{ fontSize: '0.6rem' }} />
                            </button>
                          </div>
                          {n.oseba && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', marginTop: 4 }}>
                              👤 {n.oseba}
                            </div>
                          )}
                          {n.rok && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
                              📅 {n.rok}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                            {STOLPCI.filter(k => k.id !== kol.id).map(k => (
                              <button
                                key={k.id}
                                onClick={() => spremiStatus(n._id, k.id)}
                                style={{
                                  fontSize: '0.62rem', padding: '2px 6px', borderRadius: 6,
                                  background: 'var(--ozadje2)', border: '1px solid var(--rob)',
                                  color: 'var(--besedilo3)', cursor: 'pointer',
                                }}
                              >
                                → {k.oznaka.split(' ')[1] || k.id}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        className="kanban-dodaj-gumb"
                        onClick={() => setNovaNalogaStolpec(kol.id)}
                      >
                        <i className="ti ti-plus" /> Dodaj nalogo
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="prazno-stanje">
            <div className="prazno-ikona">📋</div>
            <p>Izberi ali ustvari projekt</p>
          </div>
        )}
      </div>

      {novProjObrazec && (
        <NovProjektObrazec
          predmeti={predmeti}
          onShrani={dodajProjekt}
          onZapri={() => setNovProjObrazec(false)}
        />
      )}

      {novaNalogaStolpec && aktProjekt && (
        <NovaNalogaObrazec
          projektId={aktProjekt._id}
          stolpec={novaNalogaStolpec}
          clani={aktProjekt.clani || []}
          onShrani={dodajNalogo}
          onZapri={() => setNovaNalogaStolpec(null)}
        />
      )}
    </>
  )
}
