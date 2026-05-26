import { useState, useRef, useEffect } from 'react'

const ZVOKI = [
  { id: 'dez',       ime: 'Dež',       ikona: '🌧️', tip: 'brown' },
  { id: 'kavarna',   ime: 'Kavarna',   ikona: '☕', tip: 'pink'  },
  { id: 'knjiznica', ime: 'Knjižnica', ikona: '📚', tip: 'white' },
  { id: 'ocean',     ime: 'Ocean',     ikona: '🌊', tip: 'ocean' },
  { id: 'narava',    ime: 'Narava',    ikona: '🌿', tip: 'brown2'},
]

function ustvariZvocniBuffer(ctx, tip) {
  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  if (tip === 'white') {
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15
  } else if (tip === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  } else if (tip === 'brown') {
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.5
    }
  } else if (tip === 'brown2') {
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.018 * white) / 1.018
      lastOut = data[i]
      data[i] *= 2.8
    }
  } else if (tip === 'ocean') {
    let phase = 0
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      const mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * phase / (ctx.sampleRate * 4))
      data[i] *= 2.5 * mod
      phase++
    }
  }
  return buffer
}

export default function StudyMusic() {
  const [odprt, setOdprt] = useState(false)
  const [glasnost, setGlasnost] = useState(50)
  const [aktivniZvoki, setAktivniZvoki] = useState(new Set())
  const ctxRef = useRef(null)
  const virovRef = useRef({})
  const ojacevalnikRef = useRef(null)

  function zagotoviFCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      ojacevalnikRef.current = ctxRef.current.createGain()
      ojacevalnikRef.current.gain.value = glasnost / 100
      ojacevalnikRef.current.connect(ctxRef.current.destination)
    }
    return ctxRef.current
  }

  function zageniZvok(zvok) {
    const ctx = zagotoviFCtx()
    const doStart = () => {
      try {
        if (virovRef.current[zvok.id]) {
          try { virovRef.current[zvok.id].stop() } catch {}
          delete virovRef.current[zvok.id]
        }
        const buffer = ustvariZvocniBuffer(ctx, zvok.tip)
        const vir = ctx.createBufferSource()
        vir.buffer = buffer
        vir.loop = true
        vir.connect(ojacevalnikRef.current)
        vir.start()
        virovRef.current[zvok.id] = vir
      } catch (e) { console.warn('Audio start error:', e) }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().then(doStart).catch(() => {})
    } else {
      doStart()
    }
  }

  function ustaviZvok(id) {
    if (virovRef.current[id]) {
      try { virovRef.current[id].stop() } catch {}
      delete virovRef.current[id]
    }
  }

  function preklopiZvok(zvok) {
    // Side effects (audio) must NOT go inside setState — do them here
    if (aktivniZvoki.has(zvok.id)) {
      ustaviZvok(zvok.id)
      setAktivniZvoki(prev => { const n = new Set(prev); n.delete(zvok.id); return n })
    } else {
      zageniZvok(zvok)
      setAktivniZvoki(prev => { const n = new Set(prev); n.add(zvok.id); return n })
    }
  }

  useEffect(() => {
    if (ojacevalnikRef.current) {
      ojacevalnikRef.current.gain.setTargetAtTime(glasnost / 100, ctxRef.current.currentTime, 0.02)
    }
  }, [glasnost])

  useEffect(() => {
    return () => {
      Object.keys(virovRef.current).forEach(id => {
        try { virovRef.current[id].stop() } catch {}
      })
      ctxRef.current?.close()
    }
  }, [])

  const karksoIgra = aktivniZvoki.size > 0

  return (
    <>
      <button
        className={`music-fab ${karksoIgra ? 'igra' : ''}`}
        onClick={() => setOdprt(o => !o)}
        title="Glasba za učenje"
      >
        <i className={`ti ${karksoIgra ? 'ti-player-pause' : 'ti-music'}`} />
      </button>

      {odprt && (
        <div className="music-panel">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>
            🎵 Glasba za učenje
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <i className="ti ti-volume" style={{ color: 'var(--besedilo3)', fontSize: '0.85rem' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--besedilo3)' }}>Glasnost: {glasnost}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={glasnost}
              onChange={e => setGlasnost(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--modra)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ZVOKI.map(z => (
              <button
                key={z.id}
                className={`music-zvok-gumb ${aktivniZvoki.has(z.id) ? 'aktiven' : ''}`}
                onClick={() => preklopiZvok(z)}
              >
                <span>{z.ikona}</span>
                <span>{z.ime}</span>
                {aktivniZvoki.has(z.id) && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.8 }}>▶</span>
                )}
              </button>
            ))}
          </div>

          {karksoIgra && (
            <button
              className="gumb gumb-sekundarni"
              style={{ marginTop: 12, width: '100%', fontSize: '0.8rem', padding: '7px' }}
              onClick={() => {
                aktivniZvoki.forEach(id => ustaviZvok(id))
                setAktivniZvoki(new Set())
              }}
            >
              <i className="ti ti-player-stop" /> Ustavi vse
            </button>
          )}
        </div>
      )}
    </>
  )
}
