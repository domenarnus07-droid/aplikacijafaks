import { useState, useEffect } from 'react'

function parseKartice(vsebina) {
  if (!vsebina) return []
  const lines = vsebina.split('\n')
  const kartice = []
  let cur = null, ans = []
  for (const ln of lines) {
    const h = ln.match(/^#{1,3} (.+)$/)
    if (h) {
      if (cur !== null && ans.join('').trim()) kartice.push({ v: cur, o: ans.join('\n').trim() })
      cur = h[1]; ans = []
    } else if (cur !== null) { ans.push(ln) }
  }
  if (cur !== null && ans.join('').trim()) kartice.push({ v: cur, o: ans.join('\n').trim() })
  return kartice
}

// ── Spaced Repetition (poenostavljen SM-2) ────────────────────────────────────
function srKljuc(noteId) { return `studyos-sr-${noteId || 'default'}` }

function beriSR(noteId) {
  try { return JSON.parse(localStorage.getItem(srKljuc(noteId)) || '{}') } catch { return {} }
}
function hraniSR(noteId, data) {
  try { localStorage.setItem(srKljuc(noteId), JSON.stringify(data)) } catch {}
}

function danesDatum() { return new Date().toISOString().slice(0, 10) }

function karticaJeDolgovana(sr) {
  if (!sr || !sr.nextReview) return true  // Nova kartica
  return sr.nextReview <= danesDatum()
}

export default function Flashcards({ naslov, vsebina, noteId, onZapri }) {
  const kartice = parseKartice(vsebina)
  const [idx, setIdx]         = useState(0)
  const [obrnjena, setObrnjena] = useState(false)
  const [srData, setSrData]   = useState(() => beriSR(noteId))
  const [rezim, setRezim]     = useState('vse')    // 'vse' | 'danes'
  const [prikazano, setPrikazano] = useState(new Set())

  // Računamo kartice za danes
  const daneske = kartice.filter((_, i) => karticaJeDolgovana(srData[i]))
  const aktivneKartice = rezim === 'danes' ? daneske : kartice

  // Ko se rezim/kartice spremenijo, ponastavi idx
  useEffect(() => { setIdx(0); setObrnjena(false); setPrikazano(new Set()) }, [rezim])

  if (kartice.length === 0) return (
    <div className="fc-ozadje" onMouseDown={e => e.target === e.currentTarget && onZapri()}>
      <div className="fc-modal">
        <div className="fc-glava">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Flashcards — {naslov}</h2>
          <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
        </div>
        <div className="fc-prazno">
          <i className="ti ti-cards" />
          <p>Ni kartic. Dodaj <code>## Naslov</code> in besedilo pod njim v zapisek.</p>
        </div>
      </div>
    </div>
  )

  const kartica = aktivneKartice[idx]
  const realIdx = kartice.indexOf(kartica)  // index v originalnem nizu (za SR)
  const napredek = aktivneKartice.length > 0 ? Math.round((prikazano.size / aktivneKartice.length) * 100) : 100

  function naslednja() {
    setObrnjena(false)
    setPrikazano(s => new Set([...s, idx]))
    setTimeout(() => setIdx(i => (i + 1) % aktivneKartice.length), 50)
  }
  function prejsnja() {
    setObrnjena(false)
    setTimeout(() => setIdx(i => (i - 1 + aktivneKartice.length) % aktivneKartice.length), 50)
  }
  function premesaj() {
    const n = Math.floor(Math.random() * aktivneKartice.length)
    setIdx(n); setObrnjena(false)
  }

  // Spaced repetition: "Znam"
  function znam() {
    const sr = srData[realIdx] || { interval: 1, repetitions: 0 }
    const novInterval = Math.min(Math.ceil((sr.interval || 1) * 2.5), 365)
    const novDatum = new Date(danesDatum())
    novDatum.setDate(novDatum.getDate() + novInterval)
    const novo = {
      ...srData,
      [realIdx]: {
        interval: novInterval,
        repetitions: (sr.repetitions || 0) + 1,
        nextReview: novDatum.toISOString().slice(0, 10),
        zadnjicZnana: danesDatum(),
      }
    }
    setSrData(novo)
    hraniSR(noteId, novo)
    naslednja()
  }

  // Spaced repetition: "Ne znam"
  function neznam() {
    const novDatum = new Date(danesDatum())
    novDatum.setDate(novDatum.getDate() + 1)
    const novo = {
      ...srData,
      [realIdx]: {
        interval: 1,
        repetitions: 0,
        nextReview: novDatum.toISOString().slice(0, 10),
        zadnjicZnana: null,
      }
    }
    setSrData(novo)
    hraniSR(noteId, novo)
    naslednja()
  }

  function ponastaviSR() {
    if (!confirm('Ponastavi napredek ponavljanja za ta zapisek?')) return
    setSrData({})
    hraniSR(noteId, {})
  }

  const sr = kartica ? srData[realIdx] : null
  const dneDo = sr?.nextReview ? Math.ceil((new Date(sr.nextReview) - new Date(danesDatum())) / 86400000) : null

  if (aktivneKartice.length === 0 && rezim === 'danes') {
    return (
      <div className="fc-ozadje" onMouseDown={e => e.target === e.currentTarget && onZapri()}>
        <div className="fc-modal">
          <div className="fc-glava">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📚 {naslov}</h2>
            <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
          </div>
          <div className="fc-prazno" style={{ color: 'var(--zelena)' }}>
            <i className="ti ti-circle-check" />
            <p style={{ color: 'var(--zelena)', fontWeight: 700 }}>🎉 Vse kartice za danes opravljene!</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--besedilo3)' }}>Naslednje kartice bodo jutri.</p>
            <button className="gumb gumb-sekundarni" style={{ marginTop: 12 }} onClick={() => setRezim('vse')}>
              Pokaži vse kartice
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fc-ozadje" onMouseDown={e => e.target === e.currentTarget && onZapri()}>
      <div className="fc-modal">
        {/* Glava */}
        <div className="fc-glava">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📚 {naslov}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Danes/Vse preklop */}
            <button
              className={`gumb ${rezim === 'danes' ? 'gumb-primarni' : 'gumb-sekundarni'}`}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              onClick={() => setRezim(r => r === 'danes' ? 'vse' : 'danes')}
              title="Prikaži samo kartice za danes"
            >
              {daneske.length > 0 && (
                <span className="znacka" style={{ background: 'var(--rdeca)', marginRight: 4, fontSize: '0.65rem' }}>
                  {daneske.length}
                </span>
              )}
              {rezim === 'danes' ? '📅 Danes' : '📅 Vse'}
            </button>
            <span className="fc-napredek">{idx + 1} / {aktivneKartice.length}</span>
            <button className="gumb-ikona" style={{ width: 28, height: 28 }} onClick={ponastaviSR} title="Ponastavi napredek">
              <i className="ti ti-refresh" style={{ fontSize: '0.75rem' }} />
            </button>
            <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
          </div>
        </div>

        {/* SR info za to kartico */}
        {sr && (
          <div style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', textAlign: 'center', padding: '2px 0' }}>
            {sr.repetitions > 0
              ? `✓ Znano ${sr.repetitions}×${dneDo !== null ? ` · nasled. ponovitev čez ${dneDo} ${dneDo === 1 ? 'dan' : 'dni'}` : ''}`
              : '🆕 Nova kartica'}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--rob)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${napredek}%`, background: 'var(--zelena)', transition: 'width 0.3s ease', borderRadius: 99 }} />
        </div>

        {/* Flip kartica */}
        {kartica && (
          <div className="fc-kartica-okvir" onClick={() => setObrnjena(o => !o)}>
            <div className={`fc-kartica-notranjost ${obrnjena ? 'obrnjena' : ''}`}>
              <div className="fc-stran fc-spredaj">
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--besedilo3)', marginBottom: 12 }}>VPRAŠANJE</div>
                <div className="fc-vprasanje">{kartica.v}</div>
                <div className="fc-namig"><i className="ti ti-hand-click" /> Klikni za odgovor</div>
              </div>
              <div className="fc-stran fc-zadaj">
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--modra)', marginBottom: 12 }}>ODGOVOR</div>
                <div className="fc-odgovor">{kartica.o}</div>
              </div>
            </div>
          </div>
        )}

        {/* Spaced repetition gumbi (vidni ko je kartica obrnjena) */}
        {obrnjena && (
          <div className="fc-sr-gumbi">
            <button
              className="gumb fc-sr-neznam"
              style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              onClick={neznam}
            >
              <i className="ti ti-x" /> Ne znam
            </button>
            <button
              className="gumb fc-sr-znam"
              style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              onClick={znam}
            >
              <i className="ti ti-check" /> Znam ✓
            </button>
          </div>
        )}

        {/* Navigacijske kontrole */}
        <div className="fc-kontrole">
          <button className="gumb gumb-sekundarni" style={{ padding: '8px 14px' }} onClick={prejsnja}>
            <i className="ti ti-chevron-left" />
          </button>
          <button className="gumb gumb-sekundarni" style={{ padding: '8px 14px' }} onClick={premesaj} title="Premešaj">
            <i className="ti ti-arrows-shuffle" />
          </button>
          <button className="gumb gumb-sekundarni" style={{ padding: '8px 14px' }} onClick={() => { setObrnjena(false); setIdx(0); setPrikazano(new Set()) }} title="Začni znova">
            <i className="ti ti-rotate" />
          </button>
          <button className="gumb gumb-sekundarni" style={{ padding: '8px 14px' }} onClick={naslednja}>
            <i className="ti ti-chevron-right" />
          </button>
        </div>

        {/* Statistika SR */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '4px 0', fontSize: '0.72rem', color: 'var(--besedilo3)' }}>
          <span>
            <i className="ti ti-brain" /> {Object.values(srData).filter(s => s.repetitions > 0).length}/{kartice.length} naučenih
          </span>
          <span>
            <i className="ti ti-calendar" /> {daneske.length} za danes
          </span>
        </div>

      </div>
    </div>
  )
}
