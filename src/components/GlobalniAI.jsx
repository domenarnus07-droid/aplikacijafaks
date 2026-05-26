import { useState, useEffect, useRef } from 'react'
import { aiRazgovor } from '../api.js'
import GlasovniVnos from './GlasovniVnos.jsx'

const PRIVZETO_SPOROCILO = {
  role: 'assistant',
  content: 'Zdravo! 👋 Sem StudyOS AI asistent. Vprašaj me karkoli o snovi, matematiki, fiziki, programiranju ali čemerkoli drugem.',
}

const PREDLOGI = [
  'Razloži mi Newtonove zakone',
  'Kaj je Big O notacija?',
  'Kako deluje rekurzija?',
  'Pojasni mi integral',
  'Napiši Python kodo za urejanje',
]

export default function GlobalniAI() {
  const [odprt,       setOdprt]       = useState(false)
  const [minimiziran, setMinimiziran] = useState(false)
  const [sporocila,   setSporocila]   = useState([PRIVZETO_SPOROCILO])
  const [vhod,        setVhod]        = useState('')
  const [nalaga,      setNalaga]      = useState(false)
  const [unread,      setUnread]      = useState(0)
  const spodajRef = useRef(null)
  const vhodRef   = useRef(null)

  // Ctrl+Shift+A toggle
  useEffect(() => {
    const h = e => { if (e.ctrlKey && e.shiftKey && e.key === 'A') setOdprt(o => !o) }
    window.addEventListener('keydown', h)
    const h2 = () => setOdprt(o => !o)
    window.addEventListener('studyos:toggle-ai', h2)
    return () => { window.removeEventListener('keydown', h); window.removeEventListener('studyos:toggle-ai', h2) }
  }, [])

  useEffect(() => {
    if (odprt) {
      setUnread(0)
      setMinimiziran(false)
      setTimeout(() => vhodRef.current?.focus(), 80)
    }
  }, [odprt])

  useEffect(() => {
    if (odprt && !minimiziran) spodajRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sporocila, odprt, minimiziran])

  async function poslji(e) {
    e?.preventDefault()
    const txt = vhod.trim()
    if (!txt || nalaga) return

    // Preveri API ključ — pokaži sporočilo v chatu, ne toast
    const kljuc = localStorage.getItem('studyos-ai-kljuc')
    if (!kljuc) {
      setSporocila(prev => [...prev,
        { role: 'user', content: txt },
        { role: 'assistant', content: '⚠️ **API ključ ni nastavljen.**\n\nDa bi AI deloval, nastavi Anthropic API ključ v **Nastavitvah** (ikona zobnika v stranski vrstici).\n\n[→ Odpri Nastavitve](#nastavitve)', _napaka: true },
      ])
      setVhod('')
      return
    }

    const novSeznam = [...sporocila, { role: 'user', content: txt }]
    setSporocila(novSeznam)
    setVhod('')
    setNalaga(true)

    try {
      // Filtriraj samo user/assistant sporocila (brez napak)
      const zaPosiljanje = novSeznam
        .filter(s => (s.role === 'user' || s.role === 'assistant') && !s._napaka)
        .slice(-12)
        .map(s => ({ role: s.role, content: s.content }))

      const odgovor = await aiRazgovor(null, zaPosiljanje)
      setSporocila(prev => [...prev, { role: 'assistant', content: odgovor }])
      if (!odprt) setUnread(u => u + 1)
    } catch (err) {
      setSporocila(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Napaka: ${err.message}`,
        _napaka: true,
      }])
    } finally {
      setNalaga(false)
    }
  }

  function pocisti() { setSporocila([PRIVZETO_SPOROCILO]); setUnread(0) }

  function renderContent(text) {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/`([^`\n]+)`/g, '<code style="background:var(--ozadje3);padding:1px 5px;border-radius:4px;font-family:var(--mono);font-size:0.85em">$1</code>')
      .replace(/\n/g, '<br/>')
      .replace(/\[→ Odpri Nastavitve\]\(#nastavitve\)/g,
        '<a href="#" onclick="window.dispatchEvent(new CustomEvent(\'studyos:pojdi-stran\',{detail:\'nastavitve\'}));return false;" style="color:var(--modra);font-weight:600">→ Odpri Nastavitve</a>')
  }

  return (
    <>
      {/* Floating FAB gumb */}
      <button
        className={`globalni-ai-fab ${odprt ? 'ai-fab-odprt' : ''}`}
        onClick={() => setOdprt(o => !o)}
        title="AI asistent (Ctrl+Shift+A)"
      >
        {odprt
          ? <i className="ti ti-x" style={{ fontSize: '1.2rem' }} />
          : <>
              <i className="ti ti-sparkles" style={{ fontSize: '1.2rem' }} />
              {unread > 0 && <span className="ai-fab-znacka">{unread}</span>}
            </>
        }
      </button>

      {/* Chat panel */}
      {odprt && (
        <div className={`globalni-ai-panel ${minimiziran ? 'minimiziran' : ''}`}>
          {/* Glava */}
          <div className="globalni-ai-glava">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="ai-avatar-krogec">
                <i className="ti ti-sparkles" style={{ fontSize: '0.9rem' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>StudyOS AI</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--zelena)' }}>● Online</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="gumb-ikona" onClick={pocisti} title="Počisti pogovor" style={{ width: 28, height: 28 }}>
                <i className="ti ti-trash" style={{ fontSize: '0.78rem' }} />
              </button>
              <button className="gumb-ikona" onClick={() => setMinimiziran(m => !m)} title="Minimiziraj" style={{ width: 28, height: 28 }}>
                <i className={`ti ti-${minimiziran ? 'maximize' : 'minimize'}`} style={{ fontSize: '0.78rem' }} />
              </button>
              <button className="gumb-ikona" onClick={() => setOdprt(false)} title="Zapri" style={{ width: 28, height: 28 }}>
                <i className="ti ti-x" style={{ fontSize: '0.78rem' }} />
              </button>
            </div>
          </div>

          {!minimiziran && (
            <>
              {/* Sporočila */}
              <div className="globalni-ai-sporocila">
                {sporocila.map((s, i) => (
                  <div key={i} className={`ai-sporocilo ${s.role}${s._napaka ? ' ai-napaka' : ''}`}>
                    {s.role === 'assistant' && (
                      <div className="ai-sporocilo-avatar">
                        <i className="ti ti-sparkles" style={{ fontSize: '0.75rem' }} />
                      </div>
                    )}
                    <div
                      className="ai-sporocilo-vsebina"
                      dangerouslySetInnerHTML={{ __html: renderContent(s.content) }}
                    />
                  </div>
                ))}

                {/* Predlogi pri prvem sporočilu */}
                {sporocila.length === 1 && (
                  <div className="ai-predlogi">
                    {PREDLOGI.map((p, i) => (
                      <button key={i} className="ai-predlog-gumb"
                        onClick={() => { setVhod(p); setTimeout(() => vhodRef.current?.focus(), 0) }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tipkanje indikator */}
                {nalaga && (
                  <div className="ai-sporocilo assistant">
                    <div className="ai-sporocilo-avatar">
                      <i className="ti ti-sparkles" style={{ fontSize: '0.75rem' }} />
                    </div>
                    <div className="ai-sporocilo-vsebina ai-tipkanje">
                      <span /><span /><span />
                    </div>
                  </div>
                )}

                <div ref={spodajRef} />
              </div>

              {/* Vnosno polje */}
              <form className="globalni-ai-forma" onSubmit={poslji}>
                <GlasovniVnos onBesedilo={t => setVhod(v => v ? `${v} ${t}` : t)} />
                <input
                  ref={vhodRef}
                  className="globalni-ai-vhod"
                  placeholder="Vprašaj karkoli… (Enter)"
                  value={vhod}
                  onChange={e => setVhod(e.target.value)}
                  disabled={nalaga}
                />
                <button
                  type="submit"
                  className="gumb gumb-primarni"
                  style={{ padding: '8px 14px', flexShrink: 0 }}
                  disabled={!vhod.trim() || nalaga}
                >
                  <i className="ti ti-send" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
