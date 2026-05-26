import { useState, useRef, useEffect } from 'react'

// Each sound = white-noise source + BiquadFilter(s) for colour
const ZVOKI = [
  {
    id: 'dez',       ime: 'Dež',       ikona: '🌧️',
    filter: { type: 'lowpass',  freq: 400,  Q: 1.2 },
    gain: 0.55,
  },
  {
    id: 'kavarna',   ime: 'Kavarna',   ikona: '☕',
    filter: { type: 'bandpass', freq: 700,  Q: 0.8 },
    gain: 0.45,
  },
  {
    id: 'knjiznica', ime: 'Knjižnica', ikona: '📚',
    filter: { type: 'lowpass',  freq: 1800, Q: 0.5 },
    gain: 0.25,
  },
  {
    id: 'ocean',     ime: 'Ocean',     ikona: '🌊',
    filter: { type: 'lowpass',  freq: 200,  Q: 1.0 },
    gain: 0.7,
    lfo: true,   // amplitude modulation for waves
  },
  {
    id: 'narava',    ime: 'Narava',    ikona: '🌿',
    filter: { type: 'lowpass',  freq: 600,  Q: 1.4 },
    gain: 0.5,
  },
]

// Build a short (2 s) white-noise buffer with a 50 ms cosine fade at both ends
// so the loop is click-free regardless of audio content
function noiseBuffer(ctx) {
  const sr  = ctx.sampleRate
  const len = sr * 2          // 2-second loop
  const buf = ctx.createBuffer(1, len, sr)
  const d   = buf.getChannelData(0)

  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1

  // Cosine fade – 50 ms at each end
  const fade = Math.floor(sr * 0.05)
  for (let i = 0; i < fade; i++) {
    const t = 0.5 - 0.5 * Math.cos(Math.PI * i / fade)  // 0 → 1
    d[i]           *= t
    d[len - 1 - i] *= t
  }
  return buf
}

// Extract YouTube video ID from any standard URL form
function ytId(url) {
  if (!url) return null
  const m = (url || '').match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  return m ? m[1] : null
}

export default function StudyMusic() {
  const [odprt,        setOdprt]        = useState(false)
  const [glasnost,     setGlasnost]     = useState(50)
  const [aktivni,      setAktivni]      = useState(new Set())
  const [ytUrl,        setYtUrl]        = useState('')
  const [ytViden,      setYtViden]      = useState(null)   // confirmed video ID
  const [ytVnos,       setYtVnos]       = useState(false)

  const ctxRef    = useRef(null)
  const gainRef   = useRef(null)          // master gain
  const nodesRef  = useRef({})            // id → { src, filter, lfoOsc?, lfoGain? }
  const glasRef   = useRef(glasnost)
  const bufRef    = useRef(null)          // shared noise buffer (created once per ctx)

  useEffect(() => { glasRef.current = glasnost }, [glasnost])

  // Mutual exclusion with other FABs
  useEffect(() => {
    const h = e => { if (e.detail !== 'glasba') setOdprt(false) }
    window.addEventListener('studyos:fab-odprt', h)
    return () => window.removeEventListener('studyos:fab-odprt', h)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll()
  }, [])

  // ── AudioContext helpers ─────────────────────────────────────────────────────

  function getCtx() {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)()
      const gain = ctx.createGain()
      gain.gain.value = glasRef.current / 100
      gain.connect(ctx.destination)
      ctxRef.current  = ctx
      gainRef.current = gain
      bufRef.current  = null   // reset buffer for new context
    }
    return ctxRef.current
  }

  function getBuf(ctx) {
    if (!bufRef.current) bufRef.current = noiseBuffer(ctx)
    return bufRef.current
  }

  // ── Start / stop individual sounds ──────────────────────────────────────────

  function startSound(zvok) {
    const ctx = getCtx()

    const doStart = () => {
      try {
        // Kill any existing instance for this id
        stopSoundNodes(zvok.id)

        const buf  = getBuf(ctx)
        const src  = ctx.createBufferSource()
        src.buffer = buf
        src.loop   = true

        const flt  = ctx.createBiquadFilter()
        flt.type            = zvok.filter.type
        flt.frequency.value = zvok.filter.freq
        flt.Q.value         = zvok.filter.Q

        const localGain = ctx.createGain()
        localGain.gain.value = zvok.gain

        src.connect(flt)

        const entry = { src, filter: flt, localGain }

        if (zvok.lfo) {
          // Ocean: slow amplitude oscillation (one wave ≈ 4 s)
          const lfoOsc  = ctx.createOscillator()
          const lfoGain = ctx.createGain()
          lfoOsc.type            = 'sine'
          lfoOsc.frequency.value = 0.25   // 4-second wave cycle
          lfoGain.gain.value     = 0.4    // modulation depth
          lfoOsc.connect(lfoGain)
          lfoGain.connect(localGain.gain) // modulate localGain
          localGain.gain.value = 0.45     // DC offset so it stays audible
          lfoOsc.start()
          entry.lfoOsc  = lfoOsc
          entry.lfoGain = lfoGain
        }

        flt.connect(localGain)
        localGain.connect(gainRef.current)
        src.start(0)

        nodesRef.current[zvok.id] = entry
      } catch (e) {
        console.warn('Audio start error:', e)
      }
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(doStart)
    } else {
      doStart()
    }
  }

  function stopSoundNodes(id) {
    const e = nodesRef.current[id]
    if (!e) return
    try { e.src.stop() }       catch {}
    try { e.lfoOsc?.stop() }   catch {}
    delete nodesRef.current[id]
  }

  function stopAll() {
    Object.keys(nodesRef.current).forEach(stopSoundNodes)
    try { ctxRef.current?.close() } catch {}
    ctxRef.current  = null
    gainRef.current = null
    bufRef.current  = null
  }

  function toggle(zvok) {
    if (aktivni.has(zvok.id)) {
      stopSoundNodes(zvok.id)
      setAktivni(prev => { const n = new Set(prev); n.delete(zvok.id); return n })
    } else {
      startSound(zvok)
      setAktivni(prev => { const n = new Set(prev); n.add(zvok.id); return n })
    }
  }

  // ── Live volume update ───────────────────────────────────────────────────────

  useEffect(() => {
    if (gainRef.current && ctxRef.current?.state !== 'closed') {
      gainRef.current.gain.setTargetAtTime(glasnost / 100, ctxRef.current.currentTime, 0.05)
    }
  }, [glasnost])

  // ── YouTube helpers ──────────────────────────────────────────────────────────

  function potrdiYt() {
    const id = ytId(ytUrl.trim())
    if (id) { setYtViden(id); setYtVnos(false) }
  }

  function odstraniYt() { setYtViden(null); setYtUrl(''); setYtVnos(false) }

  // ── FAB logic ────────────────────────────────────────────────────────────────

  const karksoIgra = aktivni.size > 0 || !!ytViden

  function odpriPanel() {
    const nov = !odprt
    if (nov) window.dispatchEvent(new CustomEvent('studyos:fab-odprt', { detail: 'glasba' }))
    setOdprt(nov)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <button
        className={`music-fab ${karksoIgra ? 'igra' : ''}`}
        onClick={odpriPanel}
        title="Glasba za učenje"
      >
        <i className={`ti ${karksoIgra ? 'ti-player-pause' : 'ti-music'}`} />
      </button>

      {odprt && (
        <div className="music-panel" style={{ width: 280 }}>

          {/* Naslov + zapri */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🎵 Glasba za učenje</span>
            <button className="gumb-ikona" style={{ width: 24, height: 24 }} onClick={() => setOdprt(false)}>
              <i className="ti ti-x" style={{ fontSize: '0.75rem' }} />
            </button>
          </div>

          {/* Glasnost */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <i className="ti ti-volume" style={{ color: 'var(--besedilo3)', fontSize: '0.8rem' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--besedilo3)' }}>Glasnost: {glasnost}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={glasnost}
              onChange={e => setGlasnost(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0891b2' }}
            />
          </div>

          {/* Ambient zvoki */}
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--besedilo3)', marginBottom: 6 }}>
            Ambientni zvoki
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {ZVOKI.map(z => (
              <button
                key={z.id}
                className={`music-zvok-gumb ${aktivni.has(z.id) ? 'aktiven' : ''}`}
                onClick={() => toggle(z)}
              >
                <span>{z.ikona}</span>
                <span style={{ flex: 1 }}>{z.ime}</span>
                {aktivni.has(z.id) && (
                  <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>▶ predvaja</span>
                )}
              </button>
            ))}
          </div>

          {aktivni.size > 0 && (
            <button
              className="gumb gumb-sekundarni"
              style={{ width: '100%', fontSize: '0.78rem', padding: '6px', marginBottom: 12 }}
              onClick={() => {
                Object.keys(nodesRef.current).forEach(stopSoundNodes)
                setAktivni(new Set())
              }}
            >
              <i className="ti ti-player-stop" /> Ustavi vse zvoke
            </button>
          )}

          {/* Separator */}
          <div style={{ borderTop: '1px solid var(--rob)', margin: '4px 0 12px' }} />

          {/* YouTube */}
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--besedilo3)', marginBottom: 8 }}>
            YouTube player
          </div>

          {ytViden ? (
            <div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--rob)', marginBottom: 8 }}>
                <iframe
                  width="100%" height="158"
                  src={`https://www.youtube-nocookie.com/embed/${ytViden}?autoplay=1&rel=0&modestbranding=1`}
                  title="YouTube player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              </div>
              <button className="gumb gumb-sekundarni" style={{ width: '100%', fontSize: '0.78rem', padding: '6px' }} onClick={odstraniYt}>
                <i className="ti ti-x" /> Odstrani video
              </button>
            </div>
          ) : ytVnos ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                className="vhod"
                style={{ fontSize: '0.78rem', padding: '7px 10px' }}
                placeholder="Prilepi YouTube URL…"
                value={ytUrl}
                onChange={e => setYtUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && potrdiYt()}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="gumb gumb-primarni" style={{ flex: 1, fontSize: '0.78rem', padding: '6px' }} onClick={potrdiYt}>
                  <i className="ti ti-player-play" /> Predvajaj
                </button>
                <button className="gumb gumb-sekundarni" style={{ padding: '6px 10px' }} onClick={() => setYtVnos(false)}>
                  <i className="ti ti-x" />
                </button>
              </div>
            </div>
          ) : (
            <button
              className="gumb gumb-sekundarni"
              style={{ width: '100%', fontSize: '0.78rem', padding: '7px' }}
              onClick={() => setYtVnos(true)}
            >
              <i className="ti ti-brand-youtube" style={{ color: '#ff0000' }} /> Dodaj YouTube video
            </button>
          )}

        </div>
      )}
    </>
  )
}
