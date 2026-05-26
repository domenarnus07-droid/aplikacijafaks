import { useState, useEffect, useCallback } from 'react'
import { pridobiZapiske } from '../api.js'
import { odkleniDosezek } from '../dosezki.js'
import { beriKartice, shraniKartice, karticeZaDanes, izracunajNaslednjiPregled } from '../spacedRepetition.js'

// ── Razčleni kartice iz zapiskov ──────────────────────────────────────────────
function razcleniKartice(zapiski) {
  const kartice = []

  for (const z of zapiski) {
    if (!z.vsebina || !z.vsebina.trim()) continue
    const vrstice = z.vsebina.split('\n')

    // Oblika 1: Q: ... / A: ...
    let i = 0
    while (i < vrstice.length) {
      const v = vrstice[i].trim()
      if (/^Q:\s*.+/i.test(v)) {
        const vprasanje = v.replace(/^Q:\s*/i, '').trim()
        const odgovorVrstice = []
        i++
        while (i < vrstice.length && !/^Q:\s*/i.test(vrstice[i].trim())) {
          const av = vrstice[i].trim()
          if (/^A:\s*/i.test(av)) odgovorVrstice.push(av.replace(/^A:\s*/i, '').trim())
          else if (odgovorVrstice.length > 0 && av) odgovorVrstice.push(av)
          i++
        }
        if (odgovorVrstice.length > 0) {
          kartice.push({ id: `${z._id}-q-${kartice.length}`, spredaj: vprasanje, zadaj: odgovorVrstice.join('\n'), zapisek: z.naslov, predmet: z.predmet })
        }
        continue
      }
      i++
    }

    // Oblika 2: ## Naslov + naslednji odstavek
    const razdelki = z.vsebina.split(/\n(?=#{1,3}\s)/)
    for (const razdelek of razdelki) {
      const vrs = razdelek.split('\n').map(v => v.trim()).filter(Boolean)
      if (vrs.length < 2) continue
      const naslov = vrs[0].replace(/^#{1,3}\s+/, '').trim()
      if (!naslov || naslov.length < 3 || naslov.length > 120) continue
      const vsebina = vrs.slice(1).filter(v => !v.startsWith('#')).join('\n').trim()
      if (!vsebina || vsebina.length < 5) continue
      // Avoid duplicate with Q: A: mode
      const obstojecaSpredaj = kartice.some(k => k.spredaj === naslov && k.zapisek === z.naslov)
      if (!obstojecaSpredaj) {
        kartice.push({ id: `${z._id}-h-${kartice.length}`, spredaj: naslov, zadaj: vsebina.slice(0, 500), zapisek: z.naslov, predmet: z.predmet })
      }
    }

    // Oblika 3: **Termin** — definicija
    for (const vrstica of vrstice) {
      const ujemanje = vrstica.match(/^\*\*([^*]{3,60})\*\*\s*[—–-]\s*(.{5,})$/)
      if (ujemanje) {
        const spredaj = ujemanje[1].trim()
        const zadaj = ujemanje[2].trim()
        const obstojecaSpredaj = kartice.some(k => k.spredaj === spredaj && k.zapisek === z.naslov)
        if (!obstojecaSpredaj) {
          kartice.push({ id: `${z._id}-t-${kartice.length}`, spredaj, zadaj, zapisek: z.naslov, predmet: z.predmet })
        }
      }
    }
  }

  return kartice
}

function mesaj(s) {
  return s ? s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<em>$1</em>') : ''
}

// ── Rezultati ─────────────────────────────────────────────────────────────────
function RezultatiPogled({ tocne, zmotne, skupaj, onPonoviZmotne, onNovKviz, zmotneKartice }) {
  const procent = skupaj ? Math.round((tocne / skupaj) * 100) : 0
  let ocena = '😐'
  if (procent >= 90) ocena = '🏆'
  else if (procent >= 70) ocena = '🎯'
  else if (procent >= 50) ocena = '📚'
  else ocena = '💪'

  return (
    <div className="kviz-rezultati">
      <div className="kviz-ocena">{ocena}</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>{procent}%</h2>
      <p style={{ color: 'var(--besedilo2)', marginBottom: 20 }}>
        {tocne} pravilnih od {skupaj} kartic
      </p>

      {/* Napredek lok */}
      <div style={{ position: 'relative', width: 120, height: 60, margin: '0 auto 24px' }}>
        <svg viewBox="0 0 120 60" style={{ overflow: 'visible' }}>
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="var(--rob)" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={procent >= 70 ? 'var(--zelena)' : procent >= 40 ? 'var(--rumena)' : 'var(--rdeca)'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${procent * 1.57} 157`}
          />
        </svg>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontWeight: 800, fontSize: '1.1rem' }}>
          {procent}%
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--zelena)15', borderRadius: 12, border: '1.5px solid var(--zelena)' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--zelena)' }}>{tocne}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>Pravilno</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--rdeca)15', borderRadius: 12, border: '1.5px solid var(--rdeca)' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--rdeca)' }}>{zmotne}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>Napačno</div>
        </div>
      </div>

      {zmotneKartice.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', marginBottom: 10 }}>Ponovi te kartice:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
            {zmotneKartice.map(k => (
              <div key={k.id} style={{ padding: '8px 12px', background: 'var(--rdeca)10', border: '1px solid var(--rdeca)30', borderRadius: 8, fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600 }}>{k.spredaj}</span>
                <span style={{ color: 'var(--besedilo3)', marginLeft: 8 }}>— {k.zadaj.slice(0, 60)}{k.zadaj.length > 60 ? '…' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {zmotne > 0 && (
          <button className="gumb gumb-sekundarni" onClick={onPonoviZmotne}>
            <i className="ti ti-refresh" /> Ponovi napačne ({zmotne})
          </button>
        )}
        <button className="gumb gumb-primarni" onClick={onNovKviz}>
          <i className="ti ti-player-play" /> Nov kviz
        </button>
      </div>
    </div>
  )
}

// ── Kartica ───────────────────────────────────────────────────────────────────
function Kartica({ kartica, obrnjeno, onObrni }) {
  return (
    <div className={`kviz-kartica ${obrnjeno ? 'obrnjena' : ''}`} onClick={onObrni}>
      <div className="kviz-kartica-notranjost">
        <div className="kviz-kartica-spredaj">
          <div className="kviz-kartica-oznaka">
            <i className="ti ti-help-circle" /> Vprašanje
          </div>
          <div className="kviz-kartica-besedilo" dangerouslySetInnerHTML={{ __html: mesaj(kartica.spredaj) }} />
          <div className="kviz-kartica-namig">Klikni za odgovor</div>
        </div>
        <div className="kviz-kartica-zadaj">
          <div className="kviz-kartica-oznaka" style={{ color: 'var(--zelena)' }}>
            <i className="ti ti-check" /> Odgovor
          </div>
          <div className="kviz-kartica-besedilo" dangerouslySetInnerHTML={{ __html: mesaj(kartica.zadaj) }} />
        </div>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', textAlign: 'center', marginTop: 8 }}>
        iz: <em>{kartica.zapisek}</em>
      </div>
    </div>
  )
}

// ── Nastavitve kviza ──────────────────────────────────────────────────────────
function NastavitveKviza({ kartice, predmeti, onZacni }) {
  const [maks,        setMaks]        = useState(20)
  const [izbrPredmet, setIzbrPredmet] = useState('')
  const [nakljucno,   setNakljucno]   = useState(true)

  const filtrirane = kartice.filter(k => !izbrPredmet || k.predmet === izbrPredmet)

  return (
    <div className="kviz-nastavitve">
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🃏</div>
      <h2 style={{ fontWeight: 800, marginBottom: 6 }}>Globalni kviz</h2>
      <p style={{ color: 'var(--besedilo2)', marginBottom: 24, fontSize: '0.9rem' }}>
        {filtrirane.length} kartic iz {new Set(filtrirane.map(k => k.zapisek)).size} zapiskov
      </p>

      {filtrirane.length === 0 ? (
        <div className="prazno-stanje">
          <div className="prazno-ikona">📝</div>
          <p>Ni kartic. Dodaj vsebino v zapiske:</p>
          <ul style={{ textAlign: 'left', marginTop: 10, lineHeight: 2, fontSize: '0.85rem', color: 'var(--besedilo2)' }}>
            <li>Začni vrstico z <code>Q:</code> in odgovor z <code>A:</code></li>
            <li>Uporabi <code>## Naslov</code> + odstavek</li>
            <li>Napiši <code>**termin** — definicija</code></li>
          </ul>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 360, margin: '0 auto 28px' }}>
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Predmet</label>
              <select className="vhod izbira" value={izbrPredmet} onChange={e => setIzbrPredmet(e.target.value)}>
                <option value="">Vsi predmeti ({kartice.length} kartic)</option>
                {predmeti.map(p => {
                  const st = kartice.filter(k => k.predmet === p.id).length
                  return st > 0 ? <option key={p.id} value={p.id}>{p.ikona} {p.ime} ({st})</option> : null
                })}
              </select>
            </div>
            <div className="vnosna-vrstica" style={{ marginBottom: 0 }}>
              <label className="vnosna-oznaka">Število kartic</label>
              <input className="vhod" type="number" min={1} max={filtrirane.length} value={maks}
                onChange={e => setMaks(Math.max(1, Math.min(filtrirane.length, +e.target.value)))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={nakljucno} onChange={e => setNakljucno(e.target.checked)}
                style={{ width: 16, height: 16 }} />
              Naključni vrstni red
            </label>
          </div>
          <button
            className="gumb gumb-primarni"
            style={{ padding: '11px 32px', fontSize: '1rem' }}
            onClick={() => onZacni(filtrirane, maks, nakljucno)}
          >
            <i className="ti ti-player-play" /> Začni kviz
          </button>
        </>
      )}
    </div>
  )
}

// ── SR Ponavljanje ────────────────────────────────────────────────────────────
function SRPonavljanje() {
  const [kartice, setKartice] = useState(() => karticeZaDanes())
  const [indeks, setIndeks] = useState(0)
  const [obrnjeno, setObrnjeno] = useState(false)
  const [koncano, setKoncano] = useState(false)

  const vse = beriKartice()
  const danes = new Date().toISOString().slice(0, 10)
  const skupajZaDanes = vse.filter(k => !k.nextReview || k.nextReview <= danes).length

  function oceni(ocena) {
    const kartica = kartice[indeks]
    const posodobljene = beriKartice().map(k => {
      if (k.id !== kartica.id) return k
      return { ...k, ...izracunajNaslednjiPregled(k, ocena) }
    })
    shraniKartice(posodobljene)

    if (indeks + 1 >= kartice.length) {
      setKoncano(true)
    } else {
      setIndeks(i => i + 1)
      setObrnjeno(false)
    }
  }

  if (vse.length === 0) {
    return (
      <div className="prazno-stanje">
        <div className="prazno-ikona">🗂️</div>
        <p>Ni kartic za ponavljanje.</p>
        <p style={{ fontSize: '0.8rem', marginTop: 6 }}>
          Kartice se ustvarijo avtomatično iz zapiskov s Q:/A: pari.<br />
          Lahko jih tudi uvozite iz zavihka Kviz.
        </p>
      </div>
    )
  }

  if (skupajZaDanes === 0 || koncano) {
    return (
      <div className="prazno-stanje">
        <div className="prazno-ikona">✅</div>
        <p style={{ fontWeight: 700, fontSize: '1rem' }}>Vse kartice pregledane!</p>
        <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Skupaj kartic: {vse.length}</p>
        <button className="gumb gumb-primarni" style={{ marginTop: 16 }}
          onClick={() => { setKartice(karticeZaDanes()); setIndeks(0); setObrnjeno(false); setKoncano(false) }}>
          <i className="ti ti-refresh" /> Osveži
        </button>
      </div>
    )
  }

  const kartica = kartice[indeks]
  if (!kartica) return null

  return (
    <div className="kviz-igra">
      <div className="kviz-napredek-okvir">
        <div className="kviz-napredek-vrstica">
          <div className="kviz-napredek-polnilo" style={{ width: `${(indeks / kartice.length) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--besedilo3)', marginTop: 4 }}>
          <span>Kartica {indeks + 1} / {kartice.length}</span>
          <span>SR interval: {kartica.interval || 1} dni</span>
        </div>
      </div>

      <div className="sr-kartica" onClick={() => setObrnjeno(true)}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--besedilo3)', marginBottom: 8 }}>
          {obrnjeno ? '✅ Odgovor' : '❓ Vprašanje'}
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.6 }}>
          {obrnjeno ? kartica.odgovor : kartica.vprašanje}
        </div>
        {!obrnjeno && (
          <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', marginTop: 12 }}>Klikni za odgovor</div>
        )}
      </div>

      {obrnjeno ? (
        <div className="sr-ocena-gumbi">
          <button className="gumb" style={{ background: '#ef4444', color: '#fff' }} onClick={() => oceni(0)}>
            <i className="ti ti-brain" /> 0<br /><span style={{ fontSize: '0.68rem' }}>Ne znam</span>
          </button>
          <button className="gumb" style={{ background: '#f59e0b', color: '#fff' }} onClick={() => oceni(1)}>
            <i className="ti ti-mood-confuzed" /> 1<br /><span style={{ fontSize: '0.68rem' }}>Težko</span>
          </button>
          <button className="gumb" style={{ background: '#3b82f6', color: '#fff' }} onClick={() => oceni(2)}>
            <i className="ti ti-mood-happy" /> 2<br /><span style={{ fontSize: '0.68rem' }}>Ok</span>
          </button>
          <button className="gumb" style={{ background: '#22c55e', color: '#fff' }} onClick={() => oceni(3)}>
            <i className="ti ti-star" /> 3<br /><span style={{ fontSize: '0.68rem' }}>Zlahka</span>
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button className="gumb gumb-primarni" style={{ padding: '11px 32px' }} onClick={() => setObrnjeno(true)}>
            <i className="ti ti-eye" /> Pokaži odgovor
          </button>
        </div>
      )}
    </div>
  )
}

// ── Glavna stran ──────────────────────────────────────────────────────────────
export default function GlobalniKviz() {
  const [vsaKartice,  setVsaKartice]  = useState([])
  const [kartice,     setKartice]     = useState([])    // aktivne v kvizu
  const [indeks,      setIndeks]      = useState(0)
  const [obrnjeno,    setObrnjeno]    = useState(false)
  const [tocne,       setTocne]       = useState(0)
  const [zmotne,      setZmotne]      = useState(0)
  const [zmotneK,     setZmotneK]     = useState([])
  const [faza,        setFaza]        = useState('nastavitve')  // 'nastavitve' | 'kviz' | 'rezultati'
  const [nalaga,      setNalaga]      = useState(true)
  const [predmeti,    setPredmeti]    = useState([])
  const [zavihek,     setZavihek]     = useState('kviz')  // 'kviz' | 'sr'

  useEffect(() => {
    const shranPred = JSON.parse(localStorage.getItem('studyos-predmeti') || '[]')
    setPredmeti(shranPred)
    pridobiZapiske().then(zs => {
      setVsaKartice(razcleniKartice(zs))
    }).finally(() => setNalaga(false))
  }, [])

  // Tipkovnica
  useEffect(() => {
    if (faza !== 'kviz') return
    const h = e => {
      if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setObrnjeno(true) }
      if (e.key === 'ArrowRight' && obrnjeno) { e.preventDefault(); oceni(true) }
      if (e.key === 'ArrowLeft'  && obrnjeno) { e.preventDefault(); oceni(false) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [faza, obrnjeno, indeks])

  function zacniKviz(filtrirane, maks, nakljucno) {
    let k = [...filtrirane]
    if (nakljucno) k = k.sort(() => Math.random() - 0.5)
    k = k.slice(0, maks)
    setKartice(k)
    setIndeks(0)
    setObrnjeno(false)
    setTocne(0)
    setZmotne(0)
    setZmotneK([])
    setFaza('kviz')
  }

  function oceni(pravilno) {
    const trenutna = kartice[indeks]
    if (pravilno) {
      setTocne(t => t + 1)
    } else {
      setZmotne(m => m + 1)
      setZmotneK(z => [...z, trenutna])
    }
    if (indeks + 1 >= kartice.length) {
      setFaza('rezultati')
      // Shrani statistike za dosežke
      const noveTocne = pravilno ? tocne + 1 : tocne
      const skupajK = kartice.length
      const procent = skupajK ? Math.round((noveTocne / skupajK) * 100) : 0
      const kv = JSON.parse(localStorage.getItem('studyos-kviz-statistike') || '{"skupaj":0,"100procent":0}')
      kv.skupaj = (kv.skupaj || 0) + 1
      if (procent === 100) kv['100procent'] = (kv['100procent'] || 0) + 1
      localStorage.setItem('studyos-kviz-statistike', JSON.stringify(kv))
      odkleniDosezek('prvi_kviz')
      if (kv.skupaj >= 5) odkleniDosezek('5_kvizov')
      if (procent === 100) odkleniDosezek('kviz_100')
    } else {
      setIndeks(i => i + 1)
      setObrnjeno(false)
    }
  }

  function ponoviZmotne() {
    const k = [...zmotneK].sort(() => Math.random() - 0.5)
    setKartice(k)
    setIndeks(0)
    setObrnjeno(false)
    setTocne(0)
    setZmotne(0)
    setZmotneK([])
    setFaza('kviz')
  }

  if (nalaga) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="nalagalnik" /></div>

  const trenutna = kartice[indeks]

  const srKarticeSt = (() => {
    try {
      const danes = new Date().toISOString().slice(0, 10)
      return beriKartice().filter(k => !k.nextReview || k.nextReview <= danes).length
    } catch { return 0 }
  })()

  return (
    <div className="kviz-okvir">
      <div className="stran-glava">
        <h1 className="stran-naslov">
          <i className="ti ti-cards" style={{ color: 'var(--modra)', marginRight: 8 }} />
          Kviz
        </h1>
        {faza === 'kviz' && zavihek === 'kviz' && (
          <button className="gumb gumb-sekundarni" style={{ padding: '7px 14px', fontSize: '0.82rem' }}
            onClick={() => setFaza('nastavitve')}>
            <i className="ti ti-x" /> Zapri kviz
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="filtri" style={{ marginBottom: 20 }}>
        <button className={`filter-gumb ${zavihek === 'kviz' ? 'aktiven' : ''}`} onClick={() => setZavihek('kviz')}>
          <i className="ti ti-cards" /> Kviz
        </button>
        <button className={`filter-gumb ${zavihek === 'sr' ? 'aktiven' : ''}`} onClick={() => setZavihek('sr')}>
          <i className="ti ti-refresh" /> Ponavljanje (SR)
          {srKarticeSt > 0 && (
            <span className="znacka" style={{ marginLeft: 6 }}>{srKarticeSt}</span>
          )}
        </button>
      </div>

      {zavihek === 'sr' && <SRPonavljanje />}

      {zavihek === 'kviz' && faza === 'nastavitve' && (
        <NastavitveKviza kartice={vsaKartice} predmeti={predmeti} onZacni={zacniKviz} />
      )}

      {zavihek === 'kviz' && faza === 'kviz' && trenutna && (
        <div className="kviz-igra">
          {/* Napredek */}
          <div className="kviz-napredek-okvir">
            <div className="kviz-napredek-vrstica">
              <div className="kviz-napredek-polnilo" style={{ width: `${(indeks / kartice.length) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--besedilo3)', marginTop: 4 }}>
              <span>Kartica {indeks + 1} / {kartice.length}</span>
              <span style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--zelena)' }}>✓ {tocne}</span>
                <span style={{ color: 'var(--rdeca)' }}>✗ {zmotne}</span>
              </span>
            </div>
          </div>

          {/* Kartica */}
          <Kartica kartica={trenutna} obrnjeno={obrnjeno} onObrni={() => setObrnjeno(true)} />

          {/* Gumbi za oceno */}
          {obrnjeno ? (
            <div className="kviz-gumbi">
              <button className="gumb kviz-gumb-ne" onClick={() => oceni(false)}>
                <i className="ti ti-x" /> Ne znam
              </button>
              <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', alignSelf: 'center', textAlign: 'center' }}>
                ← / →
              </div>
              <button className="gumb kviz-gumb-da" onClick={() => oceni(true)}>
                <i className="ti ti-check" /> Znam
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <button className="gumb gumb-primarni" style={{ padding: '11px 32px' }} onClick={() => setObrnjeno(true)}>
                <i className="ti ti-eye" /> Pokaži odgovor
              </button>
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--besedilo3)' }}>ali pritisni Space</div>
            </div>
          )}
        </div>
      )}

      {zavihek === 'kviz' && faza === 'rezultati' && (
        <RezultatiPogled
          tocne={tocne}
          zmotne={zmotne}
          skupaj={kartice.length}
          zmotneKartice={zmotneK}
          onPonoviZmotne={ponoviZmotne}
          onNovKviz={() => setFaza('nastavitve')}
        />
      )}
    </div>
  )
}
