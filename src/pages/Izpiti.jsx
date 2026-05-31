import { useState, useEffect } from 'react'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'
import { aiNacrtUcenja } from '../api.js'

const KLJUC = 'studyos-izpiti'

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `lok-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
function beriLS() { try { return JSON.parse(localStorage.getItem(KLJUC) || '[]') } catch { return [] } }
function shraniLS(v) { try { localStorage.setItem(KLJUC, JSON.stringify(v)) } catch {} }

function steviloDni(datumStr) {
  if (!datumStr) return null
  const d = new Date(datumStr)
  d.setHours(0, 0, 0, 0)
  const danes = new Date()
  danes.setHours(0, 0, 0, 0)
  return Math.round((d - danes) / 86400000)
}

function barvaOdstevanja(dni) {
  if (dni < 0) return 'var(--besedilo3)'
  if (dni === 0) return 'var(--rdeca)'
  if (dni < 7) return 'var(--rdeca)'
  if (dni < 14) return 'var(--rumena)'
  return 'var(--zelena)'
}

function OcenaModal({ izpit, predmeti, onZapri, onShrani }) {
  const pred = predmeti.find(p => p.id === izpit.predmet)
  const [ocena, setOcena] = useState(izpit.ocena || '')

  function shrani() {
    if (!ocena) return
    // Dodaj v studyos-ocene localStorage
    try {
      const ocene = JSON.parse(localStorage.getItem('studyos-ocene') || '[]')
      const novaOcena = {
        id: Date.now().toString(36),
        predmet: izpit.predmet || '',
        predmetIme: pred?.ime || izpit.naziv,
        ocena: parseFloat(ocena),
        naziv: izpit.naziv,
        datum: new Date().toISOString().slice(0, 10),
        tip: 'izpit',
      }
      ocene.push(novaOcena)
      localStorage.setItem('studyos-ocene', JSON.stringify(ocene))
    } catch {}
    onShrani(izpit._id, parseFloat(ocena))
    prikaziObvestilo(`Ocena ${ocena} shranjena ✓`, 'uspeh')
    onZapri()
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <h2 className="modal-naslov">
          <i className="ti ti-star" style={{ color: 'var(--rumena)' }} /> Vpiši oceno
        </h2>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{izpit.naziv}</div>
          {pred && <div style={{ fontSize: '0.8rem', color: pred.barva }}>{pred.ikona} {pred.ime}</div>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', display: 'block', marginBottom: 8 }}>
            Ocena (1–10)
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(o => (
              <button key={o} onClick={() => setOcena(o)} style={{
                width: 42, height: 42, borderRadius: 8, fontWeight: 700, fontSize: '1rem',
                border: `2px solid ${ocena == o ? 'var(--modra)' : 'var(--rob)'}`,
                background: ocena == o ? 'var(--modra)' : 'transparent',
                color: ocena == o ? '#fff' : 'var(--besedilo1)',
                cursor: 'pointer',
              }}>{o}</button>
            ))}
          </div>
        </div>
        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
          <button className="gumb gumb-primarni" onClick={shrani} disabled={!ocena}>
            <i className="ti ti-check" /> Shrani oceno
          </button>
        </div>
      </div>
    </div>
  )
}

function AiNacrtModal({ izpit, predmeti, onZapri }) {
  const pred = predmeti.find(p => p.id === izpit.predmet)
  const [nacrt, setNacrt]   = useState('')
  const [nalaga, setNalaga] = useState(true)

  useEffect(() => {
    aiNacrtUcenja(izpit, pred?.ime || '')
      .then(setNacrt)
      .catch(e => setNacrt(`**Napaka:** ${e.message}`))
      .finally(() => setNalaga(false))
  }, [])

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal" style={{ maxWidth: 620, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="modal-naslov" style={{ margin: 0 }}>🗓️ AI učni načrt</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--besedilo3)', marginTop: 3 }}>{izpit.naziv}</div>
          </div>
          <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {nalaga
            ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="nalagalnik" /></div>
            : <div
                className="predogled-vsebina"
                style={{ fontSize: '0.88rem', lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: nacrt.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>').replace(/## (.+)/g, '<h3>$1</h3>').replace(/- (.+)/g, '<li>$1</li>') }}
              />
          }
        </div>
        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={() => { navigator.clipboard?.writeText(nacrt); prikaziObvestilo('Kopirano', 'uspeh') }}>
            <i className="ti ti-copy" /> Kopiraj
          </button>
          <button className="gumb gumb-primarni" onClick={onZapri}>Zapri</button>
        </div>
      </div>
    </div>
  )
}

function IzpitKartica({ izpit, predmeti, onPreklopi, onIzbrisi, onVpiziOceno }) {
  const pred = predmeti.find(p => p.id === izpit.predmet)
  const dni = steviloDni(izpit.datum)
  const jeDanes = dni === 0
  const jeKmalu = dni !== null && dni >= 0 && dni < 7
  const [nacrtOdprt,  setNacrtOdprt]  = useState(false)
  const [ocenaOdprt,  setOcenaOdprt]  = useState(false)

  return (
    <div
      className={`izpit-kartica ${jeDanes ? 'danes' : ''} ${izpit.opravljeno ? 'opravljeno' : ''}`}
      style={{ borderColor: jeDanes ? 'var(--rdeca)' : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {pred && (
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: pred.barva + '22',
            border: `1.5px solid ${pred.barva}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0,
          }}>
            {pred.ikona}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{izpit.naziv}</div>
          {pred && <div style={{ fontSize: '0.75rem', color: pred.barva, fontWeight: 600 }}>{pred.ime}</div>}
          {izpit.lokacija && (
            <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', marginTop: 3 }}>
              <i className="ti ti-map-pin" style={{ fontSize: '0.7rem' }} /> {izpit.lokacija}
            </div>
          )}
          {izpit.opomba && (
            <div style={{ fontSize: '0.75rem', color: 'var(--besedilo3)', marginTop: 2, fontStyle: 'italic' }}>
              {izpit.opomba}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          {dni !== null && !izpit.opravljeno && (
            <div
              className={`izpit-odstevalnik ${jeKmalu && !izpit.opravljeno ? 'utripaj' : ''}`}
              style={{ color: barvaOdstevanja(dni), background: barvaOdstevanja(dni) + '18', border: `1.5px solid ${barvaOdstevanja(dni)}44` }}
            >
              {dni === 0 ? 'DANES' : dni < 0 ? `${Math.abs(dni)} dni nazaj` : `${dni} dni`}
            </div>
          )}
          {izpit.datum && (
            <div style={{ fontSize: '0.7rem', color: 'var(--besedilo3)', fontFamily: 'var(--mono)' }}>
              {new Date(izpit.datum).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={!!izpit.opravljeno}
            onChange={() => onPreklopi(izpit._id)}
            style={{ accentColor: 'var(--zelena)', width: 16, height: 16 }}
          />
          <span style={{ color: izpit.opravljeno ? 'var(--zelena)' : 'var(--besedilo3)' }}>
            {izpit.opravljeno ? '✓ Opravljeno' : 'Označi kot opravljeno'}
          </span>
        </label>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {izpit.opravljeno && (
            izpit.ocena ? (
              <span style={{ fontSize:'0.78rem', fontWeight:700, background:'var(--zelena)22', color:'var(--zelena)', padding:'3px 10px', borderRadius:99 }}>
                ★ {izpit.ocena}
              </span>
            ) : (
              <button className="gumb gumb-sekundarni" style={{ fontSize:'0.75rem', padding:'5px 10px' }}
                onClick={() => setOcenaOdprt(true)}>
                <i className="ti ti-star" style={{ color:'var(--rumena)' }} /> Vpiši oceno
              </button>
            )
          )}
          {!izpit.opravljeno && (
            <button className="gumb gumb-sekundarni" style={{ fontSize:'0.75rem', padding:'5px 10px', gap:5 }}
              onClick={() => setNacrtOdprt(true)} title="AI učni načrt do izpita">
              <i className="ti ti-sparkles" style={{ color:'var(--vijolicna)' }} /> AI načrt
            </button>
          )}
          <button className="gumb-ikona rdeca" onClick={() => onIzbrisi(izpit._id)}>
            <i className="ti ti-trash" style={{ fontSize:'0.75rem' }} />
          </button>
        </div>
      </div>
      {nacrtOdprt && <AiNacrtModal izpit={izpit} predmeti={predmeti} onZapri={() => setNacrtOdprt(false)} />}
      {ocenaOdprt && <OcenaModal izpit={izpit} predmeti={predmeti} onZapri={() => setOcenaOdprt(false)}
        onShrani={(id, ocena) => onVpiziOceno?.(id, ocena)} />}
    </div>
  )
}

function KalendarskiTrak({ izpiti }) {
  const meseci = []
  const danes = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(danes.getFullYear(), danes.getMonth() + i, 1)
    const mesec = d.toLocaleDateString('sl-SI', { month: 'short', year: '2-digit' })
    const izpitiMesec = izpiti.filter(iz => {
      if (!iz.datum) return false
      const dd = new Date(iz.datum)
      return dd.getFullYear() === d.getFullYear() && dd.getMonth() === d.getMonth()
    })
    meseci.push({ mesec, count: izpitiMesec.length, datum: d })
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
      {meseci.map((m, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            padding: '10px 16px',
            borderRadius: 10,
            background: m.count > 0 ? 'var(--modra)' : 'var(--ozadje1)',
            border: `1.5px solid ${m.count > 0 ? 'var(--modra)' : 'var(--rob)'}`,
            color: m.count > 0 ? '#fff' : 'var(--besedilo3)',
            textAlign: 'center',
            minWidth: 72,
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.mesec}</div>
          {m.count > 0 && (
            <div style={{ fontSize: '0.7rem', marginTop: 2, opacity: 0.9 }}>{m.count} izpit{m.count > 1 ? 'i' : ''}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Opomniki ──────────────────────────────────────────────────────────────────
function preveriOpomnikeDanes(izpiti) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const kljucDanes = `studyos-opomnik-${new Date().toISOString().slice(0, 10)}`
  if (localStorage.getItem(kljucDanes)) return
  const danes = new Date(); danes.setHours(0, 0, 0, 0)
  const kmalu = izpiti.filter(iz => {
    if (iz.opravljeno) return false
    const dni = steviloDni(iz.datum)
    return dni !== null && dni >= 0 && dni <= 7
  })
  if (kmalu.length > 0) {
    kmalu.forEach(iz => {
      const dni = steviloDni(iz.datum)
      new Notification(`📅 Izpit kmalu: ${iz.naziv}`, {
        body: dni === 0 ? 'DANES!' : `Čez ${dni} ${dni === 1 ? 'dan' : 'dni'}`,
        tag: `izpit-${iz._id}`,
      })
    })
    localStorage.setItem(kljucDanes, '1')
  }
}

export default function Izpiti() {
  const { predmeti } = useApp()
  const [izpiti, setIzpiti] = useState(beriLS)
  const [filter, setFilter] = useState('prihodnji')
  const [notifDovoljenje, setNotifDovoljenje] = useState(
    () => typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    preveriOpomnikeDanes(izpiti)
  }, [izpiti])

  async function zahtevajOpomnik() {
    if (typeof Notification === 'undefined') { prikaziObvestilo('Brskalnik ne podpira obvestil', 'napaka'); return }
    const rez = await Notification.requestPermission()
    setNotifDovoljenje(rez)
    if (rez === 'granted') {
      prikaziObvestilo('Obvestila omogočena ✓', 'uspeh')
      preveriOpomnikeDanes(izpiti)
    }
  }
  const [obrazecOdprt, setObrazecOdprt] = useState(false)
  const [novNaziv, setNovNaziv] = useState('')
  const [novPredmet, setNovPredmet] = useState(predmeti[0]?.id || '')
  const [novDatum, setNovDatum] = useState('')
  const [novLokacija, setNovLokacija] = useState('')
  const [novOpomba, setNovOpomba] = useState('')

  function dodaj() {
    if (!novNaziv.trim()) { prikaziObvestilo('Vnesi naziv izpita', 'napaka'); return }
    if (!novDatum) { prikaziObvestilo('Izberi datum izpita', 'napaka'); return }
    const nov = {
      _id: genId(),
      predmet: novPredmet,
      naziv: novNaziv.trim(),
      datum: novDatum,
      lokacija: novLokacija.trim(),
      opomba: novOpomba.trim(),
      opravljeno: false,
    }
    const novi = [...izpiti, nov].sort((a, b) => a.datum.localeCompare(b.datum))
    setIzpiti(novi); shraniLS(novi)
    setNovNaziv(''); setNovDatum(''); setNovLokacija(''); setNovOpomba('')
    setObrazecOdprt(false)
    prikaziObvestilo('Izpit dodan', 'uspeh')
  }

  function preклоpiOpravljeno(id) {
    const novi = izpiti.map(iz => iz._id === id ? { ...iz, opravljeno: !iz.opravljeno } : iz)
    setIzpiti(novi); shraniLS(novi)
  }

  function izbrisi(id) {
    if (!confirm('Izbriši izpit?')) return
    const novi = izpiti.filter(iz => iz._id !== id)
    setIzpiti(novi); shraniLS(novi)
    prikaziObvestilo('Izpit izbrisan', 'uspeh')
  }

  function vpiziOceno(id, ocena) {
    const novi = izpiti.map(iz => iz._id === id ? { ...iz, ocena } : iz)
    setIzpiti(novi); shraniLS(novi)
  }

  const danes = new Date().toISOString().slice(0, 10)
  const filtrirani = izpiti.filter(iz => {
    if (filter === 'prihodnji') return iz.datum >= danes && !iz.opravljeno
    if (filter === 'pretekli')  return iz.datum < danes || iz.opravljeno
    return true
  })

  return (
    <>
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov">Izpitni roki</h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem', marginTop: 4 }}>
            Sledenje izpitom in odštevanje
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {notifDovoljenje !== 'granted' && notifDovoljenje !== 'unsupported' && (
            <button className="gumb gumb-sekundarni" onClick={zahtevajOpomnik} title="Omogoči opombnike za izpite">
              <i className="ti ti-bell" /> Opomniki
            </button>
          )}
          {notifDovoljenje === 'granted' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--zelena)' }}>
              <i className="ti ti-bell-check" /> Obvestila vkl.
            </span>
          )}
          <button className="gumb gumb-primarni" onClick={() => setObrazecOdprt(o => !o)}>
            <i className="ti ti-plus" /> Dodaj izpit
          </button>
        </div>
      </div>

      <KalendarskiTrak izpiti={izpiti} />

      {obrazecOdprt && (
        <div className="kartica" style={{ marginBottom: 20 }}>
          <div className="dash-kartica-naslov">
            <i className="ti ti-plus" style={{ color: 'var(--zelena)' }} /> Nov izpit
          </div>
          <div className="vnosni-par">
            <div className="vnosna-vrstica">
              <label className="vnosna-oznaka">Naziv izpita</label>
              <input className="vhod" value={novNaziv} onChange={e => setNovNaziv(e.target.value)} placeholder="npr. Pisni izpit" />
            </div>
            <div className="vnosna-vrstica">
              <label className="vnosna-oznaka">Predmet</label>
              <select className="vhod izbira" value={novPredmet} onChange={e => setNovPredmet(e.target.value)}>
                {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
              </select>
            </div>
          </div>
          <div className="vnosni-par">
            <div className="vnosna-vrstica">
              <label className="vnosna-oznaka">Datum</label>
              <input className="vhod" type="date" value={novDatum} onChange={e => setNovDatum(e.target.value)} />
            </div>
            <div className="vnosna-vrstica">
              <label className="vnosna-oznaka">Lokacija</label>
              <input className="vhod" value={novLokacija} onChange={e => setNovLokacija(e.target.value)} placeholder="Učilnica, dvorana…" />
            </div>
          </div>
          <div className="vnosna-vrstica">
            <label className="vnosna-oznaka">Opomba</label>
            <input className="vhod" value={novOpomba} onChange={e => setNovOpomba(e.target.value)} placeholder="Dovoljeni pripomočki, snov…" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="gumb gumb-sekundarni" onClick={() => setObrazecOdprt(false)}>Prekliči</button>
            <button className="gumb gumb-primarni" onClick={dodaj}>Shrani</button>
          </div>
        </div>
      )}

      <div className="filtri" style={{ marginBottom: 16 }}>
        {[
          { k: 'prihodnji', l: '📅 Prihodnji' },
          { k: 'pretekli',  l: '✅ Pretekli'  },
          { k: 'vsi',       l: '📋 Vsi'        },
        ].map(f => (
          <button
            key={f.k}
            className={`filter-gumb ${filter === f.k ? 'aktiven' : ''}`}
            onClick={() => setFilter(f.k)}
          >
            {f.l}
          </button>
        ))}
      </div>

      {filtrirani.length === 0 ? (
        <div className="prazno-stanje">
          <div className="prazno-ikona">📅</div>
          <p>Ni izpitov za ta filter. Dodaj prvi izpit!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrirani.map(iz => (
            <IzpitKartica
              key={iz._id}
              izpit={iz}
              predmeti={predmeti}
              onPreklopi={preклоpiOpravljeno}
              onIzbrisi={izbrisi}
              onVpiziOceno={vpiziOceno}
            />
          ))}
        </div>
      )}
    </>
  )
}
