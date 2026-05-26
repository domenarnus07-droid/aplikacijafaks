import { useState, useRef, useEffect, useCallback } from 'react'
import { prikaziObvestilo } from '../toast.js'

const KLJUC = 'studyos-miselni-vzoreci'

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
}

function beriVzorce() {
  try { return JSON.parse(localStorage.getItem(KLJUC) || '[]') } catch { return [] }
}
function shraniVzorce(v) {
  try { localStorage.setItem(KLJUC, JSON.stringify(v)) } catch {}
}

function novVzorec(naslov = 'Nov miselni vzorec') {
  const koreniId = genId()
  return {
    _id: genId(),
    naslov,
    ustvarjen: new Date().toISOString(),
    vozlisca: [{ id: koreniId, besedilo: naslov, x: 400, y: 280, barva: '#2563EB', starsi: null }],
    povezave: [],
  }
}

const BARVE_VOZ = ['#2563EB','#22C55E','#EF4444','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316']

export default function MiselniVzorec() {
  const [vzorci, setVzorci] = useState(beriVzorce)
  const [aktivniId, setAktivniId] = useState(() => {
    const saved = beriVzorce()
    return saved[0]?._id || null
  })
  const [vlecemVoz, setVlecemVoz] = useState(null)
  const [vleceniOffset, setVleceniOffset] = useState({ x: 0, y: 0 })
  const [urejanjeId, setUrejanjeId] = useState(null)
  const [novoBesd, setNovoBesd] = useState('')
  const [povezujem, setPovezujem] = useState(null) // id vozlišča, od katerega vlečemo povezavo
  const [izbranBarva, setIzbranBarva] = useState('#22C55E')
  const svgRef = useRef(null)
  const urejanjeRef = useRef(null)

  const aktivni = vzorci.find(v => v._id === aktivniId) || null

  function shraniIn(noviVzorci) {
    setVzorci(noviVzorci)
    shraniVzorce(noviVzorci)
  }

  function posodobiAktivni(fn) {
    const novi = vzorci.map(v => v._id === aktivniId ? fn(v) : v)
    shraniIn(novi)
  }

  function dodajVzorec() {
    const nov = novVzorec()
    const novi = [...vzorci, nov]
    shraniIn(novi)
    setAktivniId(nov._id)
    prikaziObvestilo('Nov miselni vzorec ustvarjen', 'uspeh')
  }

  function izbrisiVzorec(id) {
    if (!confirm('Izbriši ta miselni vzorec?')) return
    const novi = vzorci.filter(v => v._id !== id)
    shraniIn(novi)
    if (aktivniId === id) setAktivniId(novi[0]?._id || null)
  }

  function dodajVozlisce(starsId) {
    if (!besediloRef.current?.value.trim() && !novoBesd.trim()) return
    const tekst = besediloRef.current?.value.trim() || novoBesd.trim()
    const stars = aktivni?.vozlisca.find(v => v.id === starsId)
    const nov = {
      id: genId(),
      besedilo: tekst,
      x: stars ? stars.x + 180 + Math.random() * 40 - 20 : 400,
      y: stars ? stars.y + (Math.random() * 120 - 60) : 280,
      barva: izbranBarva,
      starsi: starsId,
    }
    posodobiAktivni(v => ({
      ...v,
      vozlisca: [...v.vozlisca, nov],
      povezave: starsId ? [...v.povezave, { od: starsId, do: nov.id }] : v.povezave,
    }))
    setNovoBesd('')
    if (besediloRef.current) besediloRef.current.value = ''
  }

  function izbrisiVozlisce(id) {
    if (aktivni?.vozlisca[0]?.id === id) { prikaziObvestilo('Korenskega vozlišča ni mogoče izbrisati', 'napaka'); return }
    posodobiAktivni(v => ({
      ...v,
      vozlisca: v.vozlisca.filter(voz => voz.id !== id),
      povezave: v.povezave.filter(p => p.od !== id && p.do !== id),
    }))
  }

  function dodajPovezavo(doId) {
    if (!povezujem || povezujem === doId) { setPovezujem(null); return }
    const obstoječa = aktivni?.povezave.find(p =>
      (p.od === povezujem && p.do === doId) || (p.od === doId && p.do === povezujem)
    )
    if (obstoječa) { setPovezujem(null); return }
    posodobiAktivni(v => ({ ...v, povezave: [...v.povezave, { od: povezujem, do: doId }] }))
    setPovezujem(null)
  }

  function zacniVlecenje(e, id) {
    if (povezujem) { dodajPovezavo(id); return }
    e.preventDefault()
    const svgRect = svgRef.current?.getBoundingClientRect()
    const voz = aktivni?.vozlisca.find(v => v.id === id)
    if (!voz || !svgRect) return
    setVlecemVoz(id)
    setVleceniOffset({
      x: e.clientX - svgRect.left - voz.x,
      y: e.clientY - svgRect.top  - voz.y,
    })
  }

  function onMouseMove(e) {
    if (!vlecemVoz) return
    const svgRect = svgRef.current?.getBoundingClientRect()
    if (!svgRect) return
    const x = e.clientX - svgRect.left  - vleceniOffset.x
    const y = e.clientY - svgRect.top - vleceniOffset.y
    posodobiAktivni(v => ({
      ...v,
      vozlisca: v.vozlisca.map(voz => voz.id === vlecemVoz ? { ...voz, x, y } : voz),
    }))
  }

  function onMouseUp() { setVlecemVoz(null) }

  function zacniUrejanje(id) {
    setUrejanjeId(id)
    setTimeout(() => urejanjeRef.current?.focus(), 50)
  }

  function koncanjeUrejanja(id, novBesedilo) {
    if (!novBesedilo.trim()) return
    posodobiAktivni(v => ({
      ...v,
      vozlisca: v.vozlisca.map(voz => voz.id === id ? { ...voz, besedilo: novBesedilo } : voz),
    }))
    setUrejanjeId(null)
  }

  const besediloRef = useRef(null)

  if (vzorci.length === 0 || !aktivni) {
    return (
      <>
        <div className="stran-glava">
          <h1 className="stran-naslov">Miselni vzorci</h1>
        </div>
        <div className="prazno-stanje" style={{ marginTop: 60 }}>
          <div className="prazno-ikona">🗺️</div>
          <p>Ni miselnih vzorcev. Ustvari prvega!</p>
          <button className="gumb gumb-primarni" style={{ marginTop: 16 }} onClick={dodajVzorec}>
            <i className="ti ti-plus" /> Nov miselni vzorec
          </button>
        </div>
      </>
    )
  }

  const W = 900, H = 560

  return (
    <>
      <div className="stran-glava">
        <div>
          <h1 className="stran-naslov">Miselni vzorci</h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.875rem', marginTop: 4 }}>
            Vizualno povezovanje idej
          </p>
        </div>
        <button className="gumb gumb-primarni" onClick={dodajVzorec}>
          <i className="ti ti-plus" /> Nov vzorec
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {vzorci.map(v => (
          <div key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            <button
              className={`filter-gumb ${aktivniId === v._id ? 'aktiven' : ''}`}
              onClick={() => setAktivniId(v._id)}
              style={{ borderRadius: '8px 0 0 8px' }}
            >
              🗺️ {v.naslov}
            </button>
            <button
              className="gumb-ikona rdeca"
              style={{ borderRadius: '0 8px 8px 0', border: '1px solid var(--rob)', borderLeft: 'none', height: 34 }}
              onClick={() => izbrisiVzorec(v._id)}
            >
              <i className="ti ti-x" style={{ fontSize: '0.65rem' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Orodna vrstica */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          ref={besediloRef}
          className="vhod"
          style={{ flex: 1, minWidth: 160, maxWidth: 260 }}
          placeholder="Novo vozlišče…"
          value={novoBesd}
          onChange={e => setNovoBesd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && dodajVozlisce(aktivni?.vozlisca[0]?.id)}
        />
        <div style={{ display: 'flex', gap: 5 }}>
          {BARVE_VOZ.map(b => (
            <button key={b} onClick={() => setIzbranBarva(b)}
              style={{
                width: 22, height: 22, borderRadius: '50%', background: b, border: `3px solid ${izbranBarva === b ? 'var(--ozadje1)' : 'transparent'}`,
                boxShadow: izbranBarva === b ? `0 0 0 2px ${b}` : 'none', cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <button
          className="gumb gumb-primarni"
          style={{ padding: '7px 14px' }}
          onClick={() => dodajVozlisce(aktivni?.vozlisca[0]?.id)}
          title="Dodaj vezano na korensko vozlišče"
        >
          <i className="ti ti-plus" /> Dodaj
        </button>
        <button
          className={`gumb ${povezujem ? 'gumb-primarni' : 'gumb-sekundarni'}`}
          style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          onClick={() => setPovezujem(null)}
          title={povezujem ? 'Prekini dodajanje povezave' : 'Klikni vozlišče za dodajanje povezave'}
        >
          {povezujem
            ? <><i className="ti ti-x" /> Prekini</>
            : <><i className="ti ti-arrow-ramp-right" /> Poveži</>
          }
        </button>
        {povezujem && (
          <span style={{ fontSize: '0.8rem', color: 'var(--modra)', fontWeight: 600 }}>
            Klikni ciljno vozlišče…
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginBottom: 10 }}>
        💡 Povleci vozlišča za premik · Dvojni klik za urejanje · Desni klik za brisanje · Gumb "Poveži" + klikni dve vozlišči
      </div>

      {/* SVG platno */}
      <div className="mv-platno-okvir">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="mv-platno"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: vlecemVoz ? 'grabbing' : povezujem ? 'crosshair' : 'default' }}
        >
          {/* Mreža */}
          <defs>
            <pattern id="mreza" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--rob)" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#mreza)" />

          {/* Povezave */}
          {aktivni.povezave.map((p, i) => {
            const od = aktivni.vozlisca.find(v => v.id === p.od)
            const do_ = aktivni.vozlisca.find(v => v.id === p.do)
            if (!od || !do_) return null
            return (
              <line
                key={i}
                x1={od.x} y1={od.y} x2={do_.x} y2={do_.y}
                stroke="var(--besedilo3)"
                strokeWidth="1.5"
                strokeDasharray="none"
                opacity="0.6"
              />
            )
          })}

          {/* Vozlišča */}
          {aktivni.vozlisca.map(voz => {
            const jeKoreni = aktivni.vozlisca[0]?.id === voz.id
            const bLen     = voz.besedilo.length
            const rx       = Math.max(38, Math.min(90, bLen * 5.5 + 20))
            const ry       = jeKoreni ? 24 : 20
            return (
              <g
                key={voz.id}
                transform={`translate(${voz.x},${voz.y})`}
                onMouseDown={e => zacniVlecenje(e, voz.id)}
                onClick={() => povezujem && dodajPovezavo(voz.id)}
                onDoubleClick={() => zacniUrejanje(voz.id)}
                onContextMenu={e => { e.preventDefault(); izbrisiVozlisce(voz.id) }}
                style={{ cursor: vlecemVoz === voz.id ? 'grabbing' : povezujem ? 'pointer' : 'grab' }}
              >
                <ellipse
                  rx={rx} ry={ry}
                  fill={voz.barva}
                  opacity="0.92"
                  stroke={povezujem === voz.id ? '#fff' : 'none'}
                  strokeWidth="3"
                  filter={jeKoreni ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' : 'drop-shadow(0 1px 4px rgba(0,0,0,0.18))'}
                />
                {urejanjeId === voz.id ? (
                  <foreignObject x={-rx} y={-ry} width={rx * 2} height={ry * 2}>
                    <input
                      xmlns="http://www.w3.org/1999/xhtml"
                      ref={urejanjeRef}
                      defaultValue={voz.besedilo}
                      style={{
                        width: '100%', height: '100%', background: 'transparent',
                        border: 'none', outline: 'none', textAlign: 'center',
                        fontFamily: 'inherit', fontSize: jeKoreni ? '0.9rem' : '0.78rem',
                        fontWeight: jeKoreni ? '800' : '600', color: '#fff',
                      }}
                      onBlur={e => koncanjeUrejanja(voz.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') koncanjeUrejanja(voz.id, e.target.value) }}
                    />
                  </foreignObject>
                ) : (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={jeKoreni ? 13 : 11}
                    fontWeight={jeKoreni ? '800' : '600'}
                    fontFamily="inherit"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {voz.besedilo.length > 16 ? voz.besedilo.slice(0, 15) + '…' : voz.besedilo}
                  </text>
                )}

                {/* Gumb za dodajanje otroka */}
                {!povezujem && (
                  <g transform={`translate(${rx - 8}, ${-ry + 8})`}
                    onClick={e => { e.stopPropagation(); setPovezujem(voz.id) }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r="9" fill="var(--ozadje1)" stroke={voz.barva} strokeWidth="1.5" opacity="0.9" />
                    <text textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={voz.barva} fontWeight="800">+</text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legenda */}
      <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--besedilo3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>Vozlišča: {aktivni.vozlisca.length}</span>
        <span>Povezave: {aktivni.povezave.length}</span>
        <span>💡 Desni klik za brisanje vozlišča</span>
      </div>
    </>
  )
}
