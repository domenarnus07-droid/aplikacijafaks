import { useState, useEffect, useRef } from 'react'
import { pridobiZapiske, pridobiNaloge, ustvariZapisek, ustvariNalogo } from '../api.js'
import { prikaziObvestilo } from '../toast.js'

const UKAZI = [
  { vzorec: /^\/z\s+(.+)/,  ikona: '📝', opis: 'Nov zapisek: ',   tip: 'zapisek' },
  { vzorec: /^\/t\s+(.+)/,  ikona: '✅', opis: 'Nova naloga: ',   tip: 'naloga'  },
  { vzorec: /^\/nav\s+(.+)/,ikona: '🧭', opis: 'Pojdi na stran:', tip: 'nav'     },
]
const STRANI_NAV = ['pregled', 'zapiski', 'urnik', 'naloge', 'nastavitve']

export default function GlobalnoIskanje({ onZapri, onIzberiZapisek, onNavigiraj }) {
  const [iskanje, setIskanje] = useState('')
  const [zapiski, setZapiski] = useState([])
  const [naloge,  setNaloge]  = useState([])
  const [nalagam, setNalagam] = useState(true)
  const vhodRef = useRef(null)

  useEffect(() => {
    Promise.all([pridobiZapiske(), pridobiNaloge()])
      .then(([z, n]) => { setZapiski(z); setNaloge(n) })
      .finally(() => { setNalagam(false); setTimeout(() => vhodRef.current?.focus(), 30) })
  }, [])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onZapri() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onZapri])

  const q = iskanje.trim()
  const qL = q.toLowerCase()

  // ── Hitri ukazi z `/` ───────────────────────────────────────────────────────
  function jeUkaz() {
    return q.startsWith('/')
  }

  function najdiUkaz() {
    for (const u of UKAZI) {
      const m = q.match(u.vzorec)
      if (m) return { ...u, vrednost: m[1].trim() }
    }
    return null
  }

  function pokaziUkazniMeni() {
    if (!q.startsWith('/')) return false
    return !najdiUkaz() || q.endsWith(' ')
  }

  async function izvediUkaz(u) {
    if (u.tip === 'zapisek') {
      const nov = await ustvariZapisek({ naslov: u.vrednost, vsebina: '', oznaka: 'modra', predmet: '' })
      if (nov) {
        prikaziObvestilo(`Zapisek "${u.vrednost}" ustvarjen`, 'uspeh')
        localStorage.setItem('studyos-zadnji-zapisek', nov._id)
        if (onNavigiraj) onNavigiraj('zapiski')
      }
    } else if (u.tip === 'naloga') {
      const nova = await ustvariNalogo({ besedilo: u.vrednost, prioriteta: 'srednja', predmet: '' })
      if (nova) {
        prikaziObvestilo(`Naloga "${u.vrednost}" dodana`, 'uspeh')
        if (onNavigiraj) onNavigiraj('naloge')
      }
    } else if (u.tip === 'nav') {
      const stran = STRANI_NAV.find(s => s.startsWith(u.vrednost.toLowerCase()))
      if (stran && onNavigiraj) { onNavigiraj(stran); prikaziObvestilo(`Pojdi na ${stran}`, 'info') }
    }
    onZapri()
  }

  // ── Rezultati iskanja ───────────────────────────────────────────────────────
  const najdeniZapiski = q && !jeUkaz()
    ? zapiski.filter(z =>
        z.naslov.toLowerCase().includes(qL) ||
        z.vsebina?.toLowerCase().includes(qL)
      ).slice(0, 5)
    : []

  const najdeneNaloge = q && !jeUkaz()
    ? naloge.filter(n => n.besedilo.toLowerCase().includes(qL)).slice(0, 5)
    : []

  const noben = q && !jeUkaz() && najdeniZapiski.length === 0 && najdeneNaloge.length === 0

  // Resolved command (fully typed)
  const aktivniUkaz = najdiUkaz()

  return (
    <div className="gi-ozadje" onMouseDown={e => e.target === e.currentTarget && onZapri()}>
      <div className="gi-modal">

        {/* Vnosno polje */}
        <div className="gi-vhod-okvir">
          <i className={`ti ${jeUkaz() ? 'ti-terminal-2' : 'ti-search'}`}
             style={{ color: jeUkaz() ? 'var(--modra)' : 'var(--besedilo3)', fontSize: '1.1rem', flexShrink: 0 }} />
          <input
            ref={vhodRef}
            className="gi-vhod"
            placeholder="Išči… ali /z zapisek, /t naloga, /nav stran"
            value={iskanje}
            onChange={e => setIskanje(e.target.value)}
          />
          {iskanje && (
            <button className="gi-pocisti" onClick={() => setIskanje('')}>
              <i className="ti ti-x" />
            </button>
          )}
          <kbd className="gi-esc" onClick={onZapri}>Esc</kbd>
        </div>

        {/* Telo */}
        <div className="gi-telo">
          {nalagam ? (
            <div style={{ padding: 28, display: 'flex', justifyContent: 'center' }}>
              <div className="nalagalnik" />
            </div>

          ) : jeUkaz() ? (
            /* ── Ukazi ── */
            <div className="gi-skupina">
              {/* Razrešen ukaz — klikni za izvedbo */}
              {aktivniUkaz && (
                <button
                  className="gi-element"
                  style={{ background: 'var(--modra-svetla)', borderRadius: 8 }}
                  onClick={() => izvediUkaz(aktivniUkaz)}
                >
                  <span style={{ fontSize: '1.1rem' }}>{aktivniUkaz.ikona}</span>
                  <div className="gi-element-vsebina">
                    <span className="gi-element-naslov" style={{ color: 'var(--modra)' }}>
                      {aktivniUkaz.opis} „{aktivniUkaz.vrednost}"
                    </span>
                    <span className="gi-element-predogled">Pritisni Enter ali klikni za izvedbo</span>
                  </div>
                  <i className="ti ti-arrow-right" style={{ color: 'var(--modra)', flexShrink: 0 }} />
                </button>
              )}

              {/* Seznam ukazov */}
              <div className="gi-skupina-naslov" style={{ marginTop: aktivniUkaz ? 12 : 0 }}>
                <i className="ti ti-command" /> Razpoložljivi ukazi
              </div>
              {[
                { primer: '/z Naslov',       ikona: '📝', opis: 'Nov zapisek'           },
                { primer: '/t Besedilo',     ikona: '✅', opis: 'Nova naloga'           },
                { primer: '/nav nastavitve', ikona: '🧭', opis: 'Navigiraj na stran'   },
              ].map(u => (
                <div key={u.primer} className="gi-element" style={{ cursor: 'default' }}>
                  <span style={{ fontSize: '1rem' }}>{u.ikona}</span>
                  <div className="gi-element-vsebina">
                    <span className="gi-element-naslov">{u.opis}</span>
                    <span className="gi-element-predogled" style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>{u.primer}</span>
                  </div>
                </div>
              ))}
            </div>

          ) : noben ? (
            <div className="gi-prazno">
              <i className="ti ti-search-off" />
              <span>Ni rezultatov za „{iskanje}"</span>
            </div>

          ) : !q ? (
            /* ── Navodila ── */
            <div className="gi-navodila">
              {[
                ['Ctrl', 'K', 'Odpri iskanje'],
                ['Ctrl', 'N', 'Nov zapisek'],
                ['Ctrl', 'T', 'Nova naloga'],
              ].map(([k1, k2, opis]) => (
                <div key={k2} className="gi-navodila-vrstica">
                  <kbd>{k1}</kbd><span>+</span><kbd>{k2}</kbd>
                  <span className="gi-navodila-opis">{opis}</span>
                </div>
              ))}
              <div className="gi-navodila-vrstica" style={{ marginTop: 8, color: 'var(--besedilo3)', fontSize: '0.78rem' }}>
                <i className="ti ti-terminal-2" style={{ color: 'var(--modra)' }} />
                <span style={{ marginLeft: 6 }}>Hitri ukazi: <code style={{ fontFamily: 'var(--mono)', background: 'var(--ozadje2)', padding: '0 5px', borderRadius: 4 }}>/z</code> <code style={{ fontFamily: 'var(--mono)', background: 'var(--ozadje2)', padding: '0 5px', borderRadius: 4 }}>/t</code> <code style={{ fontFamily: 'var(--mono)', background: 'var(--ozadje2)', padding: '0 5px', borderRadius: 4 }}>/nav</code></span>
              </div>
            </div>

          ) : (
            /* ── Rezultati ── */
            <>
              {najdeniZapiski.length > 0 && (
                <div className="gi-skupina">
                  <div className="gi-skupina-naslov">
                    <i className="ti ti-notebook" /> Zapiski
                  </div>
                  {najdeniZapiski.map(z => (
                    <button
                      key={z._id}
                      className="gi-element"
                      onClick={() => { onIzberiZapisek(z); onZapri() }}
                    >
                      <span className={`oznaka oznaka-${z.oznaka}`} style={{ fontSize: '0.65rem', padding: '1px 7px', flexShrink: 0 }}>
                        {z.oznaka === 'modra' ? '📘' : z.oznaka === 'zelena' ? '📗' : '📙'}
                      </span>
                      <div className="gi-element-vsebina">
                        <span className="gi-element-naslov">
                          {z.pripeto && <i className="ti ti-pin" style={{ fontSize: '0.72rem', color: 'var(--modra)', marginRight: 4 }} />}
                          {z.naslov}
                        </span>
                        {z.vsebina && (
                          <span className="gi-element-predogled">
                            {z.vsebina.replace(/\n/g, ' ').substring(0, 90)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {najdeneNaloge.length > 0 && (
                <div className="gi-skupina">
                  <div className="gi-skupina-naslov">
                    <i className="ti ti-check" /> Naloge
                  </div>
                  {najdeneNaloge.map(n => (
                    <div key={n._id} className="gi-element" style={{ cursor: 'default' }}>
                      <span className={`prioriteta-pika prioriteta-${n.prioriteta}`} style={{ flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.875rem', flex: 1,
                        textDecoration: n.opravljeno ? 'line-through' : 'none',
                        opacity: n.opravljeno ? 0.55 : 1,
                      }}>
                        {n.pripeto && <i className="ti ti-pin" style={{ fontSize: '0.72rem', color: 'var(--modra)', marginRight: 4 }} />}
                        {n.besedilo}
                      </span>
                      {n.opravljeno && <span style={{ fontSize: '0.7rem', color: 'var(--zelena)', flexShrink: 0 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
