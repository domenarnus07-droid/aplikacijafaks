import React, { useState, useEffect, useRef } from 'react'
import {
  pridobiNaloge, ustvariNalogo, preklopiOpravljenost, posodobiNalogo, izbrisiNalogo
} from '../api.js'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'
import { odkleniDosezek } from '../dosezki.js'

// ── Podnaloge ─────────────────────────────────────────────────────────────────
function beriPodnaloge(nalogaId) {
  try { return JSON.parse(localStorage.getItem(`studyos-podnaloge-${nalogaId}`) || '[]') } catch { return [] }
}
function shraniPodnaloge(nalogaId, podnaloge) {
  try { localStorage.setItem(`studyos-podnaloge-${nalogaId}`, JSON.stringify(podnaloge)) } catch {}
}
function genPodId() { return Math.random().toString(36).slice(2) }

function PodnalogePanel({ nalogaId }) {
  const [podnaloge, setPodnaloge] = useState(() => beriPodnaloge(nalogaId))
  const [novaTekst, setNovaTekst] = useState('')

  function dodaj() {
    if (!novaTekst.trim()) return
    const nove = [...podnaloge, { id: genPodId(), besedilo: novaTekst.trim(), opravljeno: false }]
    setPodnaloge(nove); shraniPodnaloge(nalogaId, nove)
    setNovaTekst('')
  }

  function preklopi(id) {
    const nove = podnaloge.map(p => p.id === id ? { ...p, opravljeno: !p.opravljeno } : p)
    setPodnaloge(nove); shraniPodnaloge(nalogaId, nove)
  }

  function izbrisi(id) {
    const nove = podnaloge.filter(p => p.id !== id)
    setPodnaloge(nove); shraniPodnaloge(nalogaId, nove)
  }

  const opravljenih = podnaloge.filter(p => p.opravljeno).length
  const pct = podnaloge.length > 0 ? Math.round(opravljenih / podnaloge.length * 100) : 0

  return (
    <div className="podnaloge-panel">
      {podnaloge.length > 0 && (
        <>
          <div style={{ height: 3, background: 'var(--ozadje3)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--zelena)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          {podnaloge.map(p => (
            <div key={p.id} className="podnaloga-vnos">
              <button
                className={`naloga-krogec ${p.opravljeno ? 'oznacen' : ''}`}
                style={{ width: 16, height: 16, minWidth: 16 }}
                onClick={() => preklopi(p.id)}
              >
                {p.opravljeno && <i className="ti ti-check" style={{ fontSize: '0.5rem', color: '#fff' }} />}
              </button>
              <span style={{ flex: 1, fontSize: '0.8rem', textDecoration: p.opravljeno ? 'line-through' : 'none', opacity: p.opravljeno ? 0.5 : 1, color: 'var(--besedilo2)' }}>
                {p.besedilo}
              </span>
              <button className="gumb-ikona rdeca" style={{ width: 18, height: 18 }} onClick={() => izbrisi(p.id)}>
                <i className="ti ti-x" style={{ fontSize: '0.55rem' }} />
              </button>
            </div>
          ))}
        </>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: podnaloge.length > 0 ? 6 : 0 }}>
        <input
          className="vhod"
          style={{ flex: 1, fontSize: '0.78rem', padding: '4px 8px' }}
          placeholder="Dodaj podnalogo… (Enter)"
          value={novaTekst}
          onChange={e => setNovaTekst(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && dodaj()}
        />
        <button className="gumb gumb-sekundarni" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={dodaj}>
          <i className="ti ti-plus" />
        </button>
      </div>
      {podnaloge.length > 0 && (
        <div style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', marginTop: 4 }}>
          {opravljenih}/{podnaloge.length} podnalogeoppravleno
        </div>
      )}
    </div>
  )
}

// ── Komentarji ────────────────────────────────────────────────────────────────
function beriKomentarje(nalogaId) {
  try { return JSON.parse(localStorage.getItem(`studyos-komentarji-${nalogaId}`) || '[]') } catch { return [] }
}
function shraniKomentarje(nalogaId, koms) {
  try { localStorage.setItem(`studyos-komentarji-${nalogaId}`, JSON.stringify(koms)) } catch {}
}
function genKomId() { return Math.random().toString(36).slice(2) }

function KomentarjiPanel({ nalogaId }) {
  const [koms, setKoms] = useState(() => beriKomentarje(nalogaId))
  const [tekst, setTekst] = useState('')

  function dodaj() {
    if (!tekst.trim()) return
    const novi = [...koms, { id: genKomId(), tekst: tekst.trim(), cas: new Date().toISOString() }]
    setKoms(novi); shraniKomentarje(nalogaId, novi); setTekst('')
  }

  function izbrisi(id) {
    const novi = koms.filter(k => k.id !== id)
    setKoms(novi); shraniKomentarje(nalogaId, novi)
  }

  function formatCas(iso) {
    const d = new Date(iso)
    const danes = new Date()
    const diffDni = Math.floor((danes - d) / 86400000)
    if (diffDni === 0) return d.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })
    if (diffDni === 1) return 'včeraj'
    return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="komentarji-panel">
      {koms.length > 0 && (
        <div className="komentarji-seznam">
          {koms.map(k => (
            <div key={k.id} className="komentar-vnos">
              <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--besedilo2)', lineHeight: 1.4 }}>{k.tekst}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--besedilo3)', flexShrink: 0, fontFamily: 'var(--mono)' }}>{formatCas(k.cas)}</span>
              <button className="gumb-ikona rdeca" style={{ width: 18, height: 18, flexShrink: 0 }} onClick={() => izbrisi(k.id)}>
                <i className="ti ti-x" style={{ fontSize: '0.55rem' }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: koms.length > 0 ? 6 : 0 }}>
        <input
          className="vhod"
          style={{ flex: 1, fontSize: '0.78rem', padding: '4px 8px' }}
          placeholder="Dodaj komentar… (Enter)"
          value={tekst}
          onChange={e => setTekst(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && dodaj()}
        />
        <button className="gumb gumb-sekundarni" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={dodaj}>
          <i className="ti ti-plus" />
        </button>
      </div>
      {koms.length > 0 && (
        <div style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', marginTop: 4 }}>
          {koms.length} {koms.length === 1 ? 'komentar' : koms.length < 5 ? 'komentarji' : 'komentarjev'}
        </div>
      )}
    </div>
  )
}

const PRIORITETE = [
  { vrednost: 'visoka',  oznaka: '🔴 Visoka' },
  { vrednost: 'srednja', oznaka: '🟡 Srednja' },
  { vrednost: 'nizka',   oznaka: '🟢 Nizka'  },
]

const VRSTNI_RED = { visoka: 0, srednja: 1, nizka: 2 }

function rokBesedilo(rok) {
  if (!rok) return null
  const d = new Date(rok)
  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const diff = Math.round((d - danes) / 86400000)
  if (diff < 0)   return { besedilo: 'Zamujeno', barva: 'var(--rdeca)' }
  if (diff === 0) return { besedilo: 'Danes',    barva: 'var(--rumena)' }
  if (diff === 1) return { besedilo: 'Jutri',    barva: 'var(--rumena)' }
  return { besedilo: d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' }), barva: 'var(--besedilo3)' }
}

function naslednjRok(rok, ponavljanje) {
  if (!rok || ponavljanje === 'nikoli') return null
  const d = new Date(rok)
  if (ponavljanje === 'dnevno')   d.setDate(d.getDate() + 1)
  if (ponavljanje === 'tedensko') d.setDate(d.getDate() + 7)
  if (ponavljanje === 'mesecno')  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

// ── Modalni obrazec ───────────────────────────────────────────────────────────
function UrejanjeModal({ naloga, onZapri, onShrani, predmeti = [] }) {
  const [obrazec, setObrazec] = useState({
    besedilo:    naloga.besedilo,
    prioriteta:  naloga.prioriteta,
    rok:         naloga.rok ? naloga.rok.slice(0, 10) : '',
    predmet:     naloga.predmet || '',
    ponavljanje: naloga.ponavljanje || 'nikoli',
    tagi:        (naloga.tagi || []).join(', '),
  })
  const [shranjujem, setShranjujem] = useState(false)
  const set = (k, v) => setObrazec(f => ({ ...f, [k]: v }))

  async function oddaj(e) {
    e.preventDefault()
    if (!obrazec.besedilo.trim()) { prikaziObvestilo('Besedilo je obvezno', 'napaka'); return }
    setShranjujem(true)
    const tagi = obrazec.tagi ? obrazec.tagi.split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean) : []
    await onShrani({ ...obrazec, rok: obrazec.rok || null, tagi })
    setShranjujem(false)
    onZapri()
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal">
        <h2 className="modal-naslov">Uredi nalogo</h2>
        <form onSubmit={oddaj}>
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Besedilo *</label>
            <input className="vhod" value={obrazec.besedilo} onChange={e => set('besedilo', e.target.value)} autoFocus />
          </div>
          <div className="vnosni-par">
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Prioriteta</label>
              <select className="vhod izbira" value={obrazec.prioriteta} onChange={e => set('prioriteta', e.target.value)}>
                {PRIORITETE.map(p => <option key={p.vrednost} value={p.vrednost}>{p.oznaka}</option>)}
              </select>
            </div>
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Rok oddaje</label>
              <input className="vhod" type="date" value={obrazec.rok} onChange={e => set('rok', e.target.value)} />
            </div>
          </div>
          <div className="vnosna-vrstica" style={{ marginTop: 14 }}>
            <label className="vnosna-oznaka">Predmet</label>
            <select className="vhod izbira" value={obrazec.predmet} onChange={e => set('predmet', e.target.value)}>
              <option value="">Brez predmeta</option>
              {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
            </select>
          </div>
          <div className="vnosna-vrstica" style={{ marginTop: 14 }}>
            <label className="vnosna-oznaka">Ponavljanje</label>
            <select className="vhod izbira" value={obrazec.ponavljanje} onChange={e => set('ponavljanje', e.target.value)}>
              <option value="nikoli">Nikoli</option>
              <option value="dnevno">Vsak dan</option>
              <option value="tedensko">Vsak teden</option>
              <option value="mesecno">Vsak mesec</option>
            </select>
          </div>
          <div className="vnosna-vrstica" style={{ marginTop: 14 }}>
            <label className="vnosna-oznaka">Tagi</label>
            <input
              className="vhod"
              value={obrazec.tagi}
              onChange={e => set('tagi', e.target.value)}
              placeholder="projekt, izpit, prioriteta… (ločeni z vejico)"
            />
          </div>
          <div className="modal-dno">
            <button type="button" className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
            <button type="submit" className="gumb gumb-primarni" disabled={shranjujem}>
              {shranjujem ? '…' : 'Shrani'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Kanban pogled ─────────────────────────────────────────────────────────────
function KanbanPogled({ naloge, predmeti, onPremakni, onUredi, onIzbrisi }) {
  const [vleceni, setVleceni] = useState(null)
  const [nadKolono, setNadKolono] = useState(null)

  const kolone = [
    { id: 'caka',        naslov: '📋 Čaka',       barva: 'var(--besedilo3)', filter: n => !n.opravljeno && !n.vTeku },
    { id: 'vteku',       naslov: '▶️ V teku',       barva: 'var(--modra)',     filter: n => !!n.vTeku && !n.opravljeno },
    { id: 'opravljeno',  naslov: '✅ Opravljeno',  barva: 'var(--zelena)',    filter: n => !!n.opravljeno },
  ]

  function onDrop(kolId) {
    if (!vleceni) return
    onPremakni(vleceni, kolId)
    setNadKolono(null)
    setVleceni(null)
  }

  return (
    <div className="kanban-okvir">
      {kolone.map(k => {
        const kNaloge = naloge.filter(k.filter).sort((a, b) => {
          if (a.pripeto !== b.pripeto) return a.pripeto ? -1 : 1
          return VRSTNI_RED[a.prioriteta] - VRSTNI_RED[b.prioriteta]
        })
        return (
          <div
            key={k.id}
            className={`kanban-stolpec ${nadKolono === k.id ? 'nad-kolono' : ''}`}
            onDragOver={e => { e.preventDefault(); setNadKolono(k.id) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setNadKolono(null) }}
            onDrop={e => { e.preventDefault(); onDrop(k.id) }}
          >
            <div className="kanban-glava" style={{ borderBottomColor: k.barva }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{k.naslov}</span>
              <span className="znacka" style={{ background: k.barva + '22', color: k.barva }}>{kNaloge.length}</span>
            </div>
            <div className="kanban-kartica-seznam">
              {kNaloge.map(n => {
                const rokInfo = rokBesedilo(n.rok)
                const p = predmeti.find(x => x.id === n.predmet)
                return (
                  <div
                    key={n._id}
                    className={`kanban-karta ${vleceni === n._id ? 'vleci' : ''}`}
                    draggable
                    onDragStart={e => { setVleceni(n._id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => setVleceni(null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span className={`prioriteta-pika prioriteta-${n.prioriteta}`} style={{ marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {n.pripeto && <i className="ti ti-pin pin-ikona" style={{ marginRight: 4 }} />}
                          {n.besedilo}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                          {p && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--besedilo3)' }}>
                              {p.ikona} {p.ime}
                            </span>
                          )}
                          {rokInfo && (
                            <span style={{ fontSize: '0.68rem', color: rokInfo.barva, fontWeight: 600, fontFamily: 'var(--mono)' }}>
                              {rokInfo.besedilo}
                            </span>
                          )}
                          {(n.tagi || []).map(t => (
                            <span key={t} className="tag" style={{ fontSize: '0.6rem' }}>#{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 8 }}>
                      <button className="gumb-ikona" onClick={() => onUredi(n)} title="Uredi" style={{ width: 26, height: 26 }}>
                        <i className="ti ti-edit" style={{ fontSize: '0.75rem' }} />
                      </button>
                      <button className="gumb-ikona rdeca" onClick={() => onIzbrisi(n._id)} title="Izbriši" style={{ width: 26, height: 26 }}>
                        <i className="ti ti-trash" style={{ fontSize: '0.75rem' }} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {kNaloge.length === 0 && (
                <div className="kanban-prazno">
                  <i className="ti ti-drag-drop" />
                  <span>Povleci sem</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Kalendarski pogled ────────────────────────────────────────────────────────
const MESECI = ['Januar','Februar','Marec','April','Maj','Junij',
                'Julij','Avgust','September','Oktober','November','December']
const DNI_IME = ['Pon','Tor','Sre','Čet','Pet','Sob','Ned']

function KolendarskiPogled({ naloge, onIzberiDan }) {
  const [mesec, setMesec] = useState(() => {
    const d = new Date()
    return { leto: d.getFullYear(), mesec: d.getMonth() }
  })

  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const prviDan   = new Date(mesec.leto, mesec.mesec, 1)
  const zadnjiDan = new Date(mesec.leto, mesec.mesec + 1, 0)
  const prviDanTedna = (prviDan.getDay() + 6) % 7

  const nalogePoDnevu = {}
  naloge.forEach(n => {
    if (!n.rok || n.opravljeno) return
    const d = new Date(n.rok)
    if (d.getFullYear() === mesec.leto && d.getMonth() === mesec.mesec) {
      const k = d.getDate()
      if (!nalogePoDnevu[k]) nalogePoDnevu[k] = []
      nalogePoDnevu[k].push(n)
    }
  })

  const celice = []
  for (let i = 0; i < prviDanTedna; i++) celice.push(null)
  for (let d = 1; d <= zadnjiDan.getDate(); d++) celice.push(d)

  return (
    <div>
      <div className="nal-kol-glava">
        <button className="gumb gumb-sekundarni" style={{ padding: '6px 14px' }}
          onClick={() => setMesec(m => m.mesec === 0 ? { leto: m.leto - 1, mesec: 11 } : { ...m, mesec: m.mesec - 1 })}>
          <i className="ti ti-chevron-left" />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{MESECI[mesec.mesec]} {mesec.leto}</span>
        <button className="gumb gumb-sekundarni" style={{ padding: '6px 14px' }}
          onClick={() => setMesec(m => m.mesec === 11 ? { leto: m.leto + 1, mesec: 0 } : { ...m, mesec: m.mesec + 1 })}>
          <i className="ti ti-chevron-right" />
        </button>
      </div>

      <div className="nal-kol-mrezica">
        {DNI_IME.map(d => <div key={d} className="nal-kol-ime-dneva">{d}</div>)}
        {celice.map((dan, i) => {
          if (dan === null) return <div key={`p-${i}`} className="nal-kol-celica prazna" />
          const danDate = new Date(mesec.leto, mesec.mesec, dan); danDate.setHours(0, 0, 0, 0)
          const jeDanes = danDate.getTime() === danes.getTime()
          const nalogeD = nalogePoDnevu[dan] || []
          return (
            <div key={dan}
              className={`nal-kol-celica ${jeDanes ? 'danes' : ''} ${nalogeD.length > 0 ? 'z-nalogami' : ''}`}
              onClick={() => nalogeD.length > 0 && onIzberiDan(nalogeD, dan, mesec)}>
              <div className="nal-kol-datum">{dan}</div>
              <div className="nal-kol-pike">
                {nalogeD.slice(0, 4).map(n => (
                  <div key={n._id} className="nal-kol-pika" title={n.besedilo}
                    style={{ background: n.prioriteta === 'visoka' ? 'var(--rdeca)' : n.prioriteta === 'srednja' ? 'var(--rumena)' : 'var(--zelena)' }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--besedilo3)' }}>
        {Object.entries(nalogePoDnevu).length === 0
          ? <span>V tem mesecu ni nalog z rokom.</span>
          : <span>{Object.values(nalogePoDnevu).flat().length} nalog z rokom ta mesec</span>}
      </div>
    </div>
  )
}

// ── Eisenhower matrika ────────────────────────────────────────────────────────
function EisenhowerMatrika({ naloge, predmeti, onUredi, onIzbrisi, onPreklopi }) {
  const danes = new Date(); danes.setHours(0, 0, 0, 0)

  function jeNujno(n) {
    if (!n.rok) return false
    const d = new Date(n.rok); d.setHours(0, 0, 0, 0)
    const diff = Math.round((d - danes) / 86400000)
    return diff <= 3
  }

  const KVADRANTI = [
    {
      id: 'q1', naslov: 'Naredi takoj', opis: 'Nujno + Pomembno', barva: 'var(--rdeca)',
      filter: n => !n.opravljeno && jeNujno(n) && n.prioriteta === 'visoka'
    },
    {
      id: 'q2', naslov: 'Načrtuj', opis: 'Ni nujno + Pomembno', barva: 'var(--modra)',
      filter: n => !n.opravljeno && !jeNujno(n) && n.prioriteta === 'visoka'
    },
    {
      id: 'q3', naslov: 'Delegiraj', opis: 'Nujno + Ni pomembno', barva: 'var(--rumena)',
      filter: n => !n.opravljeno && jeNujno(n) && n.prioriteta !== 'visoka'
    },
    {
      id: 'q4', naslov: 'Eliminiraj', opis: 'Ni nujno + Ni pomembno', barva: 'var(--zelena)',
      filter: n => !n.opravljeno && !jeNujno(n) && n.prioriteta !== 'visoka'
    },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6, paddingLeft: 4, fontSize: '0.7rem', color: 'var(--besedilo3)', fontWeight: 700 }}>
        <span>← NUJNO</span>
        <span>NI NUJNO →</span>
      </div>
      <div className="eisenhower-mrezica">
        {KVADRANTI.map(kv => {
          const nalogE = naloge.filter(kv.filter)
          return (
            <div key={kv.id} className="eisenhower-kvadrant" style={{ borderTopColor: kv.barva }}>
              <div className="eisenhower-glava">
                <div>
                  <span style={{ fontWeight: 700, color: kv.barva, fontSize: '0.85rem', display: 'block' }}>{kv.naslov}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--besedilo3)' }}>{kv.opis}</span>
                </div>
                <span className="znacka" style={{ background: kv.barva + '22', color: kv.barva, marginLeft: 'auto', alignSelf: 'flex-start' }}>{nalogE.length}</span>
              </div>
              <div className="eisenhower-seznam">
                {nalogE.map(n => {
                  const rokInfo = rokBesedilo(n.rok)
                  const p = predmeti.find(x => x.id === n.predmet)
                  return (
                    <div key={n._id} className="eisenhower-naloga">
                      <button
                        className="naloga-krogec"
                        onClick={() => onPreklopi(n)}
                        title="Označi kot opravljeno"
                        style={{ width: 20, height: 20, minWidth: 20 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.besedilo}</div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                          {p && <span style={{ fontSize: '0.65rem', color: 'var(--besedilo3)' }}>{p.ikona} {p.ime}</span>}
                          {rokInfo && <span style={{ fontSize: '0.65rem', color: rokInfo.barva, fontWeight: 600 }}>{rokInfo.besedilo}</span>}
                        </div>
                      </div>
                      <button className="gumb-ikona" onClick={() => onUredi(n)} style={{ width: 24, height: 24 }}>
                        <i className="ti ti-edit" style={{ fontSize: '0.72rem' }} />
                      </button>
                      <button className="gumb-ikona rdeca" onClick={() => onIzbrisi(n._id)} style={{ width: 24, height: 24 }}>
                        <i className="ti ti-trash" style={{ fontSize: '0.72rem' }} />
                      </button>
                    </div>
                  )
                })}
                {nalogE.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--besedilo3)', fontSize: '0.78rem' }}>
                    <i className="ti ti-checks" style={{ fontSize: '1.6rem', display: 'block', marginBottom: 4, opacity: 0.4 }} />
                    Prazno
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--besedilo3)', textAlign: 'center' }}>
        💡 Nujnost = rok v naslednjih 3 dneh · Pomembnost = visoka prioriteta
      </div>
    </div>
  )
}

// ── Glavna stran ──────────────────────────────────────────────────────────────
export default function Naloge() {
  const { aktivniPredmet, setNalogeBadge, predmeti } = useApp()
  const [naloge,       setNaloge]       = useState([])
  const [nalaga,       setNalaga]       = useState(true)
  const [filter,       setFilter]       = useState('vse')
  const [novoBesd,     setNovoBesd]     = useState('')
  const [novaPrior,    setNovaPrior]    = useState('srednja')
  const [urejam,       setUrejam]       = useState(null)
  const [pogled,       setPogled]       = useState('seznam')  // 'seznam' | 'kanban' | 'koledar' | 'eisenhower'
  const [kolDanNaloge, setKolDanNaloge] = useState(null)
  const [vleceni,      setVleceni]      = useState(null)
  const [nadElementom, setNadElementom] = useState(null)
  const [rucniRed,     setRucniRed]     = useState(false)
  const [izbrani,      setIzbrani]      = useState(new Set())
  const [bulkRezim,    setBulkRezim]    = useState(false)
  const [razsirenePodnaloge, setRazsirenePodnaloge] = useState(new Set())
  const [razsireniKomentarji, setRazsireniKomentarji] = useState(new Set())
  const vhodRef = useRef(null)

  function togglePodnaloge(id) {
    setRazsirenePodnaloge(s => {
      const ns = new Set(s)
      ns.has(id) ? ns.delete(id) : ns.add(id)
      return ns
    })
  }

  function toggleKomentarji(id) {
    setRazsireniKomentarji(s => {
      const ns = new Set(s)
      ns.has(id) ? ns.delete(id) : ns.add(id)
      return ns
    })
  }

  useEffect(() => {
    pridobiNaloge().then(ns => {
      setNaloge(ns)
      setNalogeBadge(ns.filter(n => !n.opravljeno).length)
    }).finally(() => setNalaga(false))
  }, [])

  useEffect(() => {
    const h = () => vhodRef.current?.focus()
    window.addEventListener('studyos:nova-naloga', h)
    return () => window.removeEventListener('studyos:nova-naloga', h)
  }, [])

  function posodobiZnacko(seznam) {
    setNalogeBadge(seznam.filter(n => !n.opravljeno).length)
  }

  async function dodaj() {
    if (!novoBesd.trim()) { vhodRef.current?.focus(); return }
    const privzetiPredmet = localStorage.getItem('studyos-privzeti-predmet') || ''
    const nova = await ustvariNalogo({
      besedilo:   novoBesd.trim(),
      prioriteta: novaPrior,
      predmet:    aktivniPredmet || privzetiPredmet,
      tagi:       [],
    })
    if (nova) {
      const seznam = [nova, ...naloge]
      setNaloge(seznam)
      posodobiZnacko(seznam)
      setNovoBesd('')
      setRucniRed(false)
      prikaziObvestilo('Naloga dodana', 'uspeh')
    }
  }

  async function preklopi(naloga) {
    const pos = await preklopiOpravljenost(naloga._id, !naloga.opravljeno)
    if (pos) {
      // Achievement: task completion
      if (!naloga.opravljeno) {
        odkleniDosezek('prva_naloga')
        const opravljene = naloge.filter(n => n.opravljeno).length + 1
        if (opravljene >= 10)  odkleniDosezek('10_nalog')
        if (opravljene >= 50)  odkleniDosezek('50_nalog')
        if (opravljene >= 100) odkleniDosezek('100_nalog')
        // Rok check
        if (naloga.rok) {
          const danes = new Date(); danes.setHours(0,0,0,0)
          const rok = new Date(naloga.rok); rok.setHours(0,0,0,0)
          if (rok >= danes) odkleniDosezek('brez_zamude')
        }
      }
      let seznam = naloge.map(n => n._id === pos._id ? pos : n)
      if (!naloga.opravljeno && naloga.ponavljanje && naloga.ponavljanje !== 'nikoli') {
        const novRok = naslednjRok(naloga.rok, naloga.ponavljanje)
        const nova = await ustvariNalogo({
          besedilo: naloga.besedilo,
          prioriteta: naloga.prioriteta,
          predmet: naloga.predmet,
          ponavljanje: naloga.ponavljanje,
          rok: novRok,
          tagi: naloga.tagi || [],
        })
        if (nova) {
          seznam = [nova, ...seznam]
          prikaziObvestilo(`🔄 Ponavljajoča naloga obnovljena`, 'info')
        }
      }
      setNaloge(seznam)
      posodobiZnacko(seznam)
    }
  }

  async function preklopiPripeto(naloga) {
    const novVal = !naloga.pripeto
    const pos = await posodobiNalogo(naloga._id, { pripeto: novVal })
    if (pos) {
      const seznam = naloge.map(n => n._id === pos._id ? pos : n)
      setNaloge(seznam)
      posodobiZnacko(seznam)
      prikaziObvestilo(novVal ? 'Naloga pripenjena 📌' : 'Naloga odpipenjena', 'uspeh')
    }
  }

  async function premakniNalogo(id, kolona) {
    let podatki = {}
    if (kolona === 'caka')       podatki = { vTeku: false, opravljeno: false }
    if (kolona === 'vteku')      podatki = { vTeku: true,  opravljeno: false }
    if (kolona === 'opravljeno') podatki = { opravljeno: true, vTeku: false }
    const pos = await posodobiNalogo(id, podatki)
    if (pos) {
      const seznam = naloge.map(n => n._id === id ? pos : n)
      setNaloge(seznam)
      posodobiZnacko(seznam)
    }
  }

  async function shrani(podatki) {
    const pos = await posodobiNalogo(urejam._id, podatki)
    if (pos) {
      const seznam = naloge.map(n => n._id === pos._id ? pos : n)
      setNaloge(seznam)
      posodobiZnacko(seznam)
      prikaziObvestilo('Naloga posodobljena', 'uspeh')
    }
  }

  async function izbrisi(id) {
    if (!confirm('Izbriši to nalogo?')) return
    const ok = await izbrisiNalogo(id)
    if (ok) {
      const seznam = naloge.filter(n => n._id !== id)
      setNaloge(seznam)
      posodobiZnacko(seznam)
      prikaziObvestilo('Naloga izbrisana', 'uspeh')
    }
  }

  // ── Bulk operacije ──
  function toggleIzbrani(id) {
    setIzbrani(s => {
      const ns = new Set(s)
      ns.has(id) ? ns.delete(id) : ns.add(id)
      return ns
    })
  }

  function izberiVse() {
    if (izbrani.size === filtrirane.length) {
      setIzbrani(new Set())
    } else {
      setIzbrani(new Set(filtrirane.map(n => n._id)))
    }
  }

  async function bulkIzbrisi() {
    if (!izbrani.size) return
    if (!confirm(`Izbriši ${izbrani.size} nalog${izbrani.size === 1 ? 'o' : 'e'}?`)) return
    const ids = [...izbrani]
    await Promise.all(ids.map(id => izbrisiNalogo(id)))
    const seznam = naloge.filter(n => !izbrani.has(n._id))
    setNaloge(seznam)
    posodobiZnacko(seznam)
    setIzbrani(new Set())
    setBulkRezim(false)
    prikaziObvestilo(`Izbrisano ${ids.length} nalog`, 'uspeh')
  }

  async function bulkOpravi() {
    if (!izbrani.size) return
    const ids = [...izbrani]
    await Promise.all(ids.map(id => preklopiOpravljenost(id, true)))
    const seznam = naloge.map(n => izbrani.has(n._id) ? { ...n, opravljeno: true } : n)
    setNaloge(seznam)
    posodobiZnacko(seznam)
    setIzbrani(new Set())
    prikaziObvestilo(`${ids.length} nalog opravljenih ✓`, 'uspeh')
  }

  async function bulkSpremenPrioritet(prioriteta) {
    if (!izbrani.size) return
    const ids = [...izbrani]
    await Promise.all(ids.map(id => posodobiNalogo(id, { prioriteta })))
    const seznam = naloge.map(n => izbrani.has(n._id) ? { ...n, prioriteta } : n)
    setNaloge(seznam)
    setIzbrani(new Set())
    prikaziObvestilo(`Prioriteta → ${prioriteta} za ${ids.length} nalog`, 'uspeh')
  }

  // Drag & Drop
  function onDragStart(e, id) {
    setVleceni(id); e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  function onDragOver(e, id) {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
    if (id !== vleceni) setNadElementom(id)
  }
  function onDrop(e, ciljId) {
    e.preventDefault()
    if (!vleceni || vleceni === ciljId) { setVleceni(null); setNadElementom(null); return }
    setNaloge(ns => {
      const seznam = [...ns]
      const srcIdx = seznam.findIndex(n => n._id === vleceni)
      const dstIdx = seznam.findIndex(n => n._id === ciljId)
      const [premaknjeni] = seznam.splice(srcIdx, 1)
      seznam.splice(dstIdx, 0, premaknjeni)
      return seznam
    })
    setRucniRed(true)
    setVleceni(null); setNadElementom(null)
  }
  function onDragEnd() { setVleceni(null); setNadElementom(null) }

  let filtrirane = naloge
    .filter(n => !aktivniPredmet || n.predmet === aktivniPredmet)
    .filter(n => {
      if (filter === 'aktivne')    return !n.opravljeno
      if (filter === 'opravljene') return  n.opravljeno
      return true
    })

  if (!rucniRed) {
    filtrirane = [...filtrirane].sort((a, b) => {
      if (a.pripeto !== b.pripeto) return a.pripeto ? -1 : 1
      if (a.opravljeno !== b.opravljeno) return a.opravljeno ? 1 : -1
      return VRSTNI_RED[a.prioriteta] - VRSTNI_RED[b.prioriteta]
    })
  }

  const skupajAktivnih = naloge.filter(n => !n.opravljeno).length
  const vTekuStevilo   = naloge.filter(n => n.vTeku && !n.opravljeno).length

  return (
    <>
      <div className="stran-glava">
        <h1 className="stran-naslov">Naloge</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--besedilo3)' }}>
            {skupajAktivnih} aktivnih · {vTekuStevilo} v teku · {naloge.filter(n => n.opravljeno).length} opravljenih
          </span>
          {/* Preklop pogledov */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { k: 'seznam',      ikona: 'ti-list',           oznaka: 'Seznam'     },
              { k: 'kanban',      ikona: 'ti-layout-columns', oznaka: 'Kanban'     },
              { k: 'koledar',     ikona: 'ti-calendar-month', oznaka: 'Koledar'    },
              { k: 'eisenhower',  ikona: 'ti-layout-grid',    oznaka: 'Eisenhower' },
            ].map(v => (
              <button
                key={v.k}
                className={`gumb ${pogled === v.k ? 'gumb-primarni' : 'gumb-sekundarni'}`}
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                onClick={() => { setPogled(v.k); setKolDanNaloge(null); setBulkRezim(false); setIzbrani(new Set()) }}
                title={v.oznaka}
              >
                <i className={`ti ${v.ikona}`} />
                <span className="skrij-mobilno"> {v.oznaka}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vnos nove naloge */}
      <div className="naloge-dodaj">
        <i className="ti ti-plus" style={{ color: 'var(--besedilo3)', flexShrink: 0 }} />
        <input
          ref={vhodRef}
          className="naloge-dodaj-vhod"
          placeholder="Dodaj novo nalogo… (Enter)"
          value={novoBesd}
          onChange={e => setNovoBesd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && dodaj()}
        />
        <select
          className="naloge-dodaj-izbira"
          value={novaPrior}
          onChange={e => setNovaPrior(e.target.value)}
        >
          {PRIORITETE.map(p => <option key={p.vrednost} value={p.vrednost}>{p.oznaka}</option>)}
        </select>
        <button className="gumb gumb-primarni" style={{ padding: '7px 14px' }} onClick={dodaj}>
          Dodaj
        </button>
      </div>

      {/* ── Kanban pogled ── */}
      {pogled === 'kanban' && (
        <KanbanPogled
          naloge={naloge.filter(n => !aktivniPredmet || n.predmet === aktivniPredmet)}
          predmeti={predmeti}
          onPremakni={premakniNalogo}
          onUredi={setUrejam}
          onIzbrisi={izbrisi}
        />
      )}

      {/* ── Eisenhower matrika ── */}
      {pogled === 'eisenhower' && (
        <EisenhowerMatrika
          naloge={filtrirane}
          predmeti={predmeti}
          onUredi={setUrejam}
          onIzbrisi={izbrisi}
          onPreklopi={preklopi}
        />
      )}

      {/* ── Kalendarski pogled ── */}
      {pogled === 'koledar' && (
        <div className="kartica">
          <KolendarskiPogled
            naloge={naloge}
            onIzberiDan={(nalogeD, dan, mesec) => setKolDanNaloge({ nalogeD, dan, mesec })}
          />
          {kolDanNaloge && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--ozadje2)', borderRadius: 10, border: '1.5px solid var(--rob)' }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem' }}>
                <i className="ti ti-calendar" style={{ color: 'var(--modra)', marginRight: 6 }} />
                Naloge za {kolDanNaloge.dan}. {MESECI[kolDanNaloge.mesec.mesec].toLowerCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {kolDanNaloge.nalogeD.map(n => (
                  <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--ozadje1)', border: '1px solid var(--rob)' }}>
                    <span className={`prioriteta-pika prioriteta-${n.prioriteta}`} />
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>{n.besedilo}</span>
                    {n.predmet && <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>{predmeti.find(p => p.id === n.predmet)?.ime ?? n.predmet}</span>}
                    <button className="gumb-ikona" onClick={() => setUrejam(n)} title="Uredi"><i className="ti ti-edit" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Seznam pogled ── */}
      {pogled === 'seznam' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div className="filtri">
              {[
                { k: 'vse',        oznaka: 'Vse' },
                { k: 'aktivne',    oznaka: 'Aktivne' },
                { k: 'opravljene', oznaka: 'Opravljene' },
              ].map(f => (
                <button key={f.k} className={`filter-gumb ${filter === f.k ? 'aktiven' : ''}`}
                  onClick={() => { setFilter(f.k); setRucniRed(false) }}>
                  {f.oznaka}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {rucniRed && (
                <button style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setRucniRed(false)}>
                  <i className="ti ti-arrows-sort" /> Ponastavi vrstni red
                </button>
              )}
              <button
                className={`gumb ${bulkRezim ? 'gumb-primarni' : 'gumb-sekundarni'}`}
                style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                onClick={() => { setBulkRezim(b => !b); setIzbrani(new Set()) }}
                title="Skupinska izbira"
              >
                <i className="ti ti-checklist" /> Izberi
              </button>
            </div>
          </div>

          {nalaga ? (
            <div className="nalagalnik" />
          ) : filtrirane.length === 0 ? (
            <div className="prazno-stanje">
              <div className="prazno-ikona">✓</div>
              <p>Ni nalog. Dodaj prvo nalogo!</p>
            </div>
          ) : (
            <div className="naloge-seznam">
              {bulkRezim && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--ozadje2)', borderRadius: 8, marginBottom: 6, fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={izbrani.size === filtrirane.length && filtrirane.length > 0}
                    onChange={izberiVse}
                    style={{ width: 15, height: 15, cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--besedilo2)' }}>
                    {izbrani.size > 0 ? `${izbrani.size} izbrano` : 'Izberi vse'}
                  </span>
                </div>
              )}
              {filtrirane.map(n => {
                const rokInfo = rokBesedilo(n.rok)
                const jeIzbrna = izbrani.has(n._id)
                return (
                  <React.Fragment key={n._id}>
                  <div
                    className={`naloga-element ${n.opravljeno ? 'opravljena' : ''} ${vleceni === n._id ? 'vleci' : ''} ${nadElementom === n._id ? 'nad-elementom' : ''} ${jeIzbrna ? 'bulk-izbrana' : ''}`}
                    style={n.pripeto ? { borderColor: 'var(--modra)', borderWidth: '1.5px' } : {}}
                    draggable={!bulkRezim}
                    onDragStart={e => !bulkRezim && onDragStart(e, n._id)}
                    onDragOver={e => !bulkRezim && onDragOver(e, n._id)}
                    onDrop={e => !bulkRezim && onDrop(e, n._id)}
                    onDragEnd={onDragEnd}
                  >
                    {bulkRezim ? (
                      <input
                        type="checkbox"
                        checked={jeIzbrna}
                        onChange={() => toggleIzbrani(n._id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                      />
                    ) : (
                      <i className="ti ti-grip-vertical naloga-vleci-ikona" title="Povleci za premik" />
                    )}

                    <button
                      className={`naloga-krogec ${n.opravljeno ? 'oznacen' : ''}`}
                      onClick={() => preklopi(n)}
                      title={n.opravljeno ? 'Označi kot neopravljeno' : 'Označi kot opravljeno'}
                    >
                      {n.opravljeno && <i className="ti ti-check" />}
                    </button>

                    <span className={`prioriteta-pika prioriteta-${n.prioriteta}`} />

                    {n.pripeto && <i className="ti ti-pin pin-ikona" title="Pripenjena naloga" />}

                    {n.ponavljanje && n.ponavljanje !== 'nikoli' && (
                      <i className="ti ti-refresh" style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', flexShrink: 0 }} title={`Ponavljanje: ${n.ponavljanje}`} />
                    )}

                    {n.vTeku && !n.opravljeno && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--modra)22', color: 'var(--modra)', borderRadius: 99, padding: '1px 7px', flexShrink: 0, fontWeight: 600 }}>▶ V teku</span>
                    )}

                    <span className="naloga-besedilo">{n.besedilo}</span>

                    {(n.tagi || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(n.tagi || []).slice(0, 2).map(t => (
                          <span key={t} className="tag" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>#{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="naloga-meta">
                      {n.predmet && (
                        <span>
                          {predmeti.find(p => p.id === n.predmet)?.ikona}{' '}
                          {predmeti.find(p => p.id === n.predmet)?.ime ?? n.predmet}
                        </span>
                      )}
                      {rokInfo && (
                        <span style={{ color: rokInfo.barva, fontWeight: 600 }}>{rokInfo.besedilo}</span>
                      )}
                    </div>

                    {!bulkRezim && <>
                      <button
                        className={`gumb-ikona ${razsirenePodnaloge.has(n._id) ? 'aktiven' : ''}`}
                        onClick={() => togglePodnaloge(n._id)}
                        title="Podnaloge"
                        style={{ color: razsirenePodnaloge.has(n._id) ? 'var(--modra)' : undefined }}
                      >
                        <i className="ti ti-subtask" />
                      </button>
                      <button className={`gumb-ikona ${n.pripeto ? 'aktiven' : ''}`} onClick={() => preklopiPripeto(n)} title={n.pripeto ? 'Odpni' : 'Pripni'}>
                        <i className="ti ti-pin" />
                      </button>
                      <button
                        className={`gumb-ikona ${razsireniKomentarji.has(n._id) ? 'aktiven' : ''}`}
                        onClick={() => toggleKomentarji(n._id)}
                        title="Komentarji / dnevnik"
                        style={{ color: razsireniKomentarji.has(n._id) ? 'var(--rumena)' : undefined }}
                      >
                        <i className="ti ti-message" />
                      </button>
                      <button className="gumb-ikona" onClick={() => setUrejam(n)} title="Uredi">
                        <i className="ti ti-edit" />
                      </button>
                      <button className="gumb-ikona rdeca" onClick={() => izbrisi(n._id)} title="Izbriši">
                        <i className="ti ti-trash" />
                      </button>
                    </>}
                  </div>
                  {razsirenePodnaloge.has(n._id) && <PodnalogePanel nalogaId={n._id} />}
                  {razsireniKomentarji.has(n._id) && <KomentarjiPanel nalogaId={n._id} />}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Bulk akcijska vrstica ── */}
      {bulkRezim && izbrani.size > 0 && (
        <div className="bulk-vrstica">
          <span className="bulk-stevilo">{izbrani.size} izbranih</span>
          <button className="bulk-gumb zelena" onClick={bulkOpravi} title="Označi kot opravljeno">
            <i className="ti ti-check" /> Opravi
          </button>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', alignSelf: 'stretch' }} />
          <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>Prioriteta:</span>
          {PRIORITETE.map(p => (
            <button key={p.vrednost} className="bulk-gumb" onClick={() => bulkSpremenPrioritet(p.vrednost)}
              title={`Nastavi prioriteto: ${p.vrednost}`} style={{ fontSize: '0.78rem' }}>
              {p.vrednost === 'visoka' ? '🔴' : p.vrednost === 'srednja' ? '🟡' : '🟢'}
            </button>
          ))}
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', alignSelf: 'stretch' }} />
          <button className="bulk-gumb rdeca" onClick={bulkIzbrisi} title="Izbriši izbrane">
            <i className="ti ti-trash" /> Izbriši
          </button>
          <button className="bulk-gumb" onClick={() => { setIzbrani(new Set()); setBulkRezim(false) }} title="Zapri">
            <i className="ti ti-x" />
          </button>
        </div>
      )}

      {urejam && (
        <UrejanjeModal
          naloga={urejam}
          onZapri={() => setUrejam(null)}
          onShrani={shrani}
          predmeti={predmeti}
        />
      )}
    </>
  )
}
