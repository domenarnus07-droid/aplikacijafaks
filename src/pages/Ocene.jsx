import { useState } from 'react'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'

const KLJUC = 'studyos-ocene'
const KLJUC_FORMULE = 'studyos-oc-formule'

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}
function beriFormule() { try { return JSON.parse(localStorage.getItem(KLJUC_FORMULE) || '[]') } catch { return [] } }
function shraniFormule(f) { try { localStorage.setItem(KLJUC_FORMULE, JSON.stringify(f)) } catch {} }

function OcenaKalkulator({ predmeti }) {
  const [odprt, setOdprt] = useState(false)
  const [komponente, setKomponente] = useState([
    { id: genId(), ime: 'Kolokvij 1', utez: 25, dosezeno: '' },
    { id: genId(), ime: 'Kolokvij 2', utez: 25, dosezeno: '' },
    { id: genId(), ime: 'Izpit',      utez: 50, dosezeno: '' },
  ])
  const [imeShranjene, setImeShranjene] = useState('')
  const [shranjeneFormule, setShranjeneFormule] = useState(beriFormule)
  const [ciljnaOcena, setCiljnaOcena] = useState(60)

  function posodobiKomponento(id, polje, vrednost) {
    setKomponente(prev => prev.map(k => k.id === id ? { ...k, [polje]: vrednost } : k))
  }
  function dodajKomponento() {
    setKomponente(prev => [...prev, { id: genId(), ime: 'Nova komponenta', utez: 0, dosezeno: '' }])
  }
  function odstraniKomponento(id) {
    setKomponente(prev => prev.filter(k => k.id !== id))
  }

  const skupnaUtez = komponente.reduce((a, k) => a + Number(k.utez || 0), 0)
  const znanKomponente = komponente.filter(k => k.dosezeno !== '' && k.dosezeno !== '?')
  const neznanKomponente = komponente.filter(k => k.dosezeno === '' || k.dosezeno === '?')

  const trenutnoTehtano = znanKomponente.reduce((a, k) => a + Number(k.dosezeno || 0) * Number(k.utez || 0) / 100, 0)
  const preostalaUtez = neznanKomponente.reduce((a, k) => a + Number(k.utez || 0), 0)

  let potrebnoNaPreostalem = null
  if (neznanKomponente.length > 0 && preostalaUtez > 0) {
    potrebnoNaPreostalem = ((ciljnaOcena - trenutnoTehtano * 100 / skupnaUtez * skupnaUtez / 100) / preostalaUtez * 100).toFixed(1)
  }
  const skupajProcent = skupnaUtez > 0 ? (trenutnoTehtano / skupnaUtez * 100).toFixed(1) : '0'

  function shraniFormulo() {
    if (!imeShranjene.trim()) { prikaziObvestilo('Vnesi ime formule', 'napaka'); return }
    const nova = { id: genId(), ime: imeShranjene.trim(), komponente }
    const posodobljene = [...shranjeneFormule, nova]
    setShranjeneFormule(posodobljene)
    shraniFormule(posodobljene)
    setImeShranjene('')
    prikaziObvestilo('Formula shranjena', 'uspeh')
  }

  function naloziformulo(formula) {
    setKomponente(formula.komponente.map(k => ({ ...k, id: genId(), dosezeno: '' })))
  }

  if (!odprt) {
    return (
      <div className="kartica" style={{ marginTop: 20 }}>
        <button
          className="dash-kartica-naslov"
          style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0 }}
          onClick={() => setOdprt(true)}
        >
          🧮 Kalkulator ocen
          <i className="ti ti-chevron-right" style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--besedilo3)' }} />
        </button>
      </div>
    )
  }

  return (
    <div className="kartica oc-kalkulator" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="dash-kartica-naslov" style={{ margin: 0 }}>
          🧮 Kalkulator ocen
        </div>
        <button className="gumb-ikona" onClick={() => setOdprt(false)}><i className="ti ti-chevron-up" /></button>
      </div>

      {shranjeneFormule.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--besedilo3)', marginBottom: 6 }}>
            Shranjene formule
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {shranjeneFormule.map(f => (
              <button
                key={f.id}
                className="filter-gumb"
                onClick={() => naloziformulo(f)}
                style={{ fontSize: '0.78rem' }}
              >
                {f.ime}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--ozadje2)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--besedilo3)' }}>Komponenta</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--besedilo3)', width: 80 }}>Utež %</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--besedilo3)', width: 120 }}>Doseženo %</th>
              <th style={{ width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {komponente.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid var(--rob)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <input
                    className="vhod"
                    value={k.ime}
                    onChange={e => posodobiKomponento(k.id, 'ime', e.target.value)}
                    style={{ width: '100%', fontSize: '0.875rem', padding: '5px 8px' }}
                  />
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    className="vhod"
                    type="number" min={0} max={100}
                    value={k.utez}
                    onChange={e => posodobiKomponento(k.id, 'utez', e.target.value)}
                    style={{ width: 70, textAlign: 'center', fontFamily: 'var(--mono)', padding: '5px 6px' }}
                  />
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    className="vhod"
                    placeholder="? ali +"
                    value={k.dosezeno}
                    onChange={e => posodobiKomponento(k.id, 'dosezeno', e.target.value)}
                    style={{ width: 100, textAlign: 'center', fontFamily: 'var(--mono)', padding: '5px 6px', color: k.dosezeno && k.dosezeno !== '?' ? (Number(k.dosezeno) >= 50 ? 'var(--zelena)' : 'var(--rdeca)') : 'var(--besedilo3)' }}
                  />
                </td>
                <td style={{ padding: '8px 6px' }}>
                  <button className="gumb-ikona rdeca" style={{ width: 24, height: 24 }} onClick={() => odstraniKomponento(k.id)}>
                    <i className="ti ti-x" style={{ fontSize: '0.65rem' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="gumb gumb-sekundarni" style={{ fontSize: '0.8rem', padding: '7px 12px' }} onClick={dodajKomponento}>
          <i className="ti ti-plus" /> Dodaj
        </button>
        <div style={{
          fontSize: '0.72rem', color: skupnaUtez === 100 ? 'var(--zelena)' : 'var(--rdeca)',
          padding: '4px 10px', borderRadius: 6,
          background: skupnaUtez === 100 ? 'var(--zelena-bg)' : 'var(--rdeca-bg)',
          fontWeight: 600,
        }}>
          Skupaj: {skupnaUtez}%{skupnaUtez !== 100 && ' ≠ 100%'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div style={{ background: 'var(--ozadje2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Trenutno povprečje</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--mono)', color: Number(skupajProcent) >= 50 ? 'var(--zelena)' : 'var(--rdeca)' }}>
            {skupajProcent}%
          </div>
        </div>
        <div style={{ background: 'var(--ozadje2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            Za cilj {ciljnaOcena}%
          </div>
          <input
            type="range" min={0} max={100} value={ciljnaOcena}
            onChange={e => setCiljnaOcena(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--modra)', marginBottom: 4 }}
          />
          {potrebnoNaPreostalem !== null ? (
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--mono)', color: Number(potrebnoNaPreostalem) > 100 ? 'var(--rdeca)' : Number(potrebnoNaPreostalem) > 80 ? 'var(--rumena)' : 'var(--zelena)' }}>
              {Number(potrebnoNaPreostalem) > 100 ? 'Ni mogoče' : `${potrebnoNaPreostalem}% na preostalih`}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--besedilo3)', fontStyle: 'italic' }}>Vpiši dosežene točke</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
        <input
          className="vhod"
          placeholder="Ime formule za shranitev…"
          value={imeShranjene}
          onChange={e => setImeShranjene(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="gumb gumb-sekundarni" style={{ padding: '9px 14px' }} onClick={shraniFormulo}>
          <i className="ti ti-device-floppy" /> Shrani
        </button>
      </div>
    </div>
  )
}

function bereOcene() {
  try { return JSON.parse(localStorage.getItem(KLJUC) || '{}') } catch { return {} }
}
function hraniOcene(o) {
  try { localStorage.setItem(KLJUC, JSON.stringify(o)) } catch {}
}

function povprecje(arr) {
  if (!arr || arr.length === 0) return null
  return (arr.reduce((a, o) => a + o.vrednost, 0) / arr.length).toFixed(2)
}

function barvaNaOceno(v) {
  if (v >= 9) return 'var(--zelena)'
  if (v >= 7) return '#3B82F6'
  if (v >= 6) return 'var(--rumena)'
  return 'var(--rdeca)'
}

const LESTVICA = [
  { min: 9, max: 10, ime: 'Odlično',  barva: 'var(--zelena)' },
  { min: 8, max: 9,  ime: 'Prav dobro', barva: '#3B82F6' },
  { min: 7, max: 8,  ime: 'Dobro',    barva: '#60A5FA' },
  { min: 6, max: 7,  ime: 'Zadostno', barva: 'var(--rumena)' },
  { min: 1, max: 6,  ime: 'Nezadostno', barva: 'var(--rdeca)' },
]

function imeOcene(v) {
  return LESTVICA.find(l => v >= l.min && v < l.max + (l.max === 10 ? 1 : 0))?.ime || ''
}

export default function Ocene() {
  const { predmeti } = useApp()
  const [ocene, setOcene]       = useState(bereOcene)
  const [predmet, setPredmet]   = useState(predmeti[0]?.id || '')
  const [novaIme,  setNovaIme]  = useState('')
  const [novaVred, setNovaVred] = useState(8)

  function dodaj() {
    if (!novaIme.trim()) { prikaziObvestilo('Vnesi naziv ocene', 'napaka'); return }
    const nova = { ime: novaIme.trim(), vrednost: Number(novaVred), datum: new Date().toISOString() }
    const pos = { ...ocene, [predmet]: [...(ocene[predmet] || []), nova] }
    setOcene(pos); hraniOcene(pos)
    setNovaIme(''); setNovaVred(8)
    prikaziObvestilo('Ocena dodana', 'uspeh')
  }

  function izbrisi(pid, idx) {
    if (!confirm('Izbriši oceno?')) return
    const pos = { ...ocene, [pid]: ocene[pid].filter((_, i) => i !== idx) }
    setOcene(pos); hraniOcene(pos)
    prikaziObvestilo('Ocena izbrisana', 'uspeh')
  }

  // Skupno povprečje
  const vseOcene = Object.values(ocene).flat()
  const skupno   = povprecje(vseOcene)
  const skupnoN  = skupno ? parseFloat(skupno) : null

  // Predmeti z ocenami
  const predmetiZOcenami = predmeti.filter(p => (ocene[p.id] || []).length > 0)

  return (
    <>
      <div className="stran-glava" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="stran-naslov">Ocene</h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem', marginTop: 4 }}>
            Beleži ocene in sledé povprečjem po predmetih
          </p>
        </div>
        {skupnoN && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: barvaNaOceno(skupnoN) + '18',
            border: `1.5px solid ${barvaNaOceno(skupnoN)}44`,
            borderRadius: 12, padding: '10px 20px',
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Skupno povprečje</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--mono)', color: barvaNaOceno(skupnoN), lineHeight: 1 }}>
                {skupno}
              </div>
              <div style={{ fontSize: '0.72rem', color: barvaNaOceno(skupnoN), marginTop: 2 }}>{imeOcene(skupnoN)}</div>
            </div>
          </div>
        )}
      </div>

      {/* SVG bar chart */}
      {predmetiZOcenami.length > 0 && (
        <div className="kartica">
          <div className="dash-kartica-naslov">
            <i className="ti ti-chart-bar-popular" style={{ color: 'var(--modra)' }} /> Povprečja po predmetih
          </div>
          <div className="ocene-graf">
            {predmetiZOcenami.map(p => {
              const avg = parseFloat(povprecje(ocene[p.id]))
              const h   = Math.max(8, Math.round((avg / 10) * 80))
              return (
                <div key={p.id} className="ocene-graf-stolpec">
                  <div className="ocene-graf-vrednost" style={{ color: barvaNaOceno(avg) }}>{avg.toFixed(1)}</div>
                  <div
                    className="ocene-graf-palica"
                    style={{ height: h, background: p.barva + 'cc' }}
                    title={`${p.ime}: ${avg.toFixed(2)}`}
                  />
                  <div className="ocene-graf-oznaka" title={p.ime}>{p.ikona}</div>
                </div>
              )
            })}
          </div>
          {/* 10-point reference line */}
          <div style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', textAlign: 'right', marginTop: 4 }}>
            Lestvica 1–10 · {vseOcene.length} ocen skupaj
          </div>
        </div>
      )}

      {/* Kartice po predmetih */}
      <div className="ocene-mrezica">
        {predmeti.map(p => {
          const ocenePred = ocene[p.id] || []
          const avg = povprecje(ocenePred)
          const avgN = avg ? parseFloat(avg) : null
          return (
            <div key={p.id} className="ocene-kartica" style={{ '--ocene-barva': p.barva }}>
              <div className="ocene-kartica-glava">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: '1.5rem' }}>{p.ikona}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.ime}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>
                      {ocenePred.length} {ocenePred.length === 1 ? 'ocena' : 'ocen'}
                    </div>
                  </div>
                </div>
                {avgN && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--mono)', color: barvaNaOceno(avgN), lineHeight: 1 }}>
                      {avg}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: barvaNaOceno(avgN) }}>{imeOcene(avgN)}</div>
                  </div>
                )}
              </div>

              {ocenePred.length > 0 && (
                <div className="ocene-seznam">
                  {[...ocenePred].reverse().map((o, ri) => {
                    const i = ocenePred.length - 1 - ri
                    return (
                      <div key={i} className="ocene-vnos">
                        <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--besedilo1)' }}>{o.ime}</span>
                        {o.datum && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
                            {new Date(o.datum).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span
                          className="ocene-vrednost"
                          style={{ color: barvaNaOceno(o.vrednost) }}
                        >
                          {o.vrednost}
                        </span>
                        <button
                          className="gumb-ikona rdeca"
                          style={{ width: 24, height: 24 }}
                          onClick={() => izbrisi(p.id, i)}
                          title="Izbriši oceno"
                        >
                          <i className="ti ti-x" style={{ fontSize: '0.7rem' }} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {ocenePred.length === 0 && (
                <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--besedilo3)', textAlign: 'center', fontStyle: 'italic' }}>
                  Ni še ocen za ta predmet
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dodaj oceno */}
      <div className="kartica">
        <div className="dash-kartica-naslov">
          <i className="ti ti-plus" style={{ color: 'var(--zelena)' }} /> Dodaj oceno
        </div>
        <div className="ocene-dodaj-obrazec">
          <select
            className="vhod izbira"
            value={predmet}
            onChange={e => setPredmet(e.target.value)}
            style={{ minWidth: 140 }}
          >
            {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
          </select>
          <input
            className="vhod"
            placeholder="Naziv ocene (npr. Izpit 1, Seminarska…)"
            value={novaIme}
            onChange={e => setNovaIme(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && dodaj()}
            style={{ flex: 1, minWidth: 180 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              className="vhod"
              type="number"
              min={1} max={10} step={0.5}
              value={novaVred}
              onChange={e => setNovaVred(e.target.value)}
              style={{ width: 72, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '1.15rem', color: barvaNaOceno(Number(novaVred)) }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--besedilo3)' }}>/ 10</span>
          </div>
          <button className="gumb gumb-primarni" style={{ padding: '10px 22px' }} onClick={dodaj}>
            <i className="ti ti-plus" /> Dodaj
          </button>
        </div>

        {/* Barvna lestvica referenca */}
        <div style={{ display: 'flex', gap: 6, padding: '0 20px 16px', flexWrap: 'wrap' }}>
          {LESTVICA.map(l => (
            <span key={l.ime} style={{
              fontSize: '0.68rem', padding: '2px 10px', borderRadius: 99,
              background: l.barva + '22', color: l.barva, border: `1px solid ${l.barva}44`,
              fontWeight: 600,
            }}>
              {l.min}–{l.max}: {l.ime}
            </span>
          ))}
        </div>
      </div>

      <OcenaKalkulator predmeti={predmeti} />
    </>
  )
}
