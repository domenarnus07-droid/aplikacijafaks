import { useState } from 'react'
import { prikaziObvestilo } from '../toast.js'

const BASE = 'http://localhost:5000/api/auth'

function veljavenEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim()) }

// ── Pozabljeno geslo ─────────────────────────────────────────────────────────
function PozabljenoGeslo({ onNazaj }) {
  const [poslan, setPoslan] = useState(false)
  const [email,  setEmail]  = useState('')
  const [napaka, setNapaka] = useState('')

  function posreduj() {
    if (!veljavenEmail(email)) { setNapaka('Vnesi veljaven e-mail naslov'); return }
    setNapaka('')
    setPoslan(true)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ozadje0)', padding: 20,
    }}>
      <div style={{
        background: 'var(--ozadje1)', border: '1.5px solid var(--rob)',
        borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400,
        boxShadow: 'var(--senca-lg)',
      }}>
        <button onClick={onNazaj} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--besedilo3)', fontSize: '0.85rem', marginBottom: 24, padding: 0,
        }}>
          <i className="ti ti-arrow-left" /> Nazaj na prijavo
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, background: '#F59E0B22', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', margin: '0 auto 12px',
          }}>🔑</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Pozabljeno geslo</h2>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.5 }}>
            Vnesi e-mail in poslali ti bomo navodila za ponastavitev.
          </p>
        </div>

        {!poslan ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', display: 'block', marginBottom: 5 }}>
                E-mail naslov
              </label>
              <input className="vhod" type="text" placeholder="tvoj@email.com"
                value={email} onChange={e => { setEmail(e.target.value); setNapaka('') }}
                autoFocus inputMode="email" autoComplete="email"
                onKeyDown={e => e.key === 'Enter' && posreduj()} />
              {napaka && <div style={{ color: 'var(--rdeca)', fontSize: '0.78rem', marginTop: 5 }}>{napaka}</div>}
            </div>
            <button onClick={posreduj} style={{
              height: 46, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'var(--modra)', color: '#fff', border: 'none', borderRadius: 10,
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <i className="ti ti-send" /> Pošlji navodila
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>📬</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>E-mail poslan!</div>
            <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 20 }}>
              Preverite mapo <strong>{email}</strong>.
            </p>
            <button className="gumb gumb-sekundarni" style={{ margin: '0 auto' }} onClick={onNazaj}>
              <i className="ti ti-arrow-left" /> Nazaj
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Glavna prijava ────────────────────────────────────────────────────────────
export default function Prijava({ onPrijava }) {
  const [nacin,      setNacin]      = useState('prijava')
  const [email,      setEmail]      = useState('')
  const [geslo,      setGeslo]      = useState('')
  const [nalaga,     setNalaga]     = useState(false)
  const [vidnoGeslo, setVidnoGeslo] = useState(false)
  const [pozabljeno, setPozabljeno] = useState(false)
  const [napake,     setNapake]     = useState({})

  if (pozabljeno) return <PozabljenoGeslo onNazaj={() => setPozabljeno(false)} />

  function validiraj() {
    const n = {}
    const jeAdmin = email.trim().toLowerCase() === 'admin'
    if (!email.trim())
      n.email = nacin === 'prijava' ? 'Vnesi uporabniško ime ali e-mail' : 'E-mail je obvezen'
    else if (nacin === 'registracija' && !veljavenEmail(email))
      n.email = 'Vnesi veljaven e-mail (npr. ime@domena.com)'
    else if (nacin === 'prijava' && !jeAdmin && !veljavenEmail(email))
      n.email = 'Vnesi veljaven e-mail naslov'
    if (!geslo)                n.geslo = 'Geslo je obvezno'
    else if (geslo.length < 4) n.geslo = 'Geslo mora imeti vsaj 4 znake'
    setNapake(n)
    return Object.keys(n).length === 0
  }

  async function posreduj(e) {
    e.preventDefault()
    if (!validiraj()) return
    setNalaga(true)
    try {
      const r = await fetch(`${BASE}/${nacin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim().toLowerCase(), geslo }),
        signal: AbortSignal.timeout(6000),
      })
      const d = await r.json()
      if (!r.ok) {
        prikaziObvestilo(d.napaka || 'Napaka pri prijavi', 'napaka')
        return
      }
      if (nacin === 'registracija') {
        prikaziObvestilo('Račun ustvarjen! Prijavi se.', 'uspeh')
        setNacin('prijava')
        setGeslo('')
        return
      }
      localStorage.setItem('studyos-jwt',      d.zeton)
      localStorage.setItem('studyos-username', d.username)
      localStorage.setItem('studyos-vloga',    d.vloga)
      prikaziObvestilo(`Dobrodošel, ${d.username}! 👋`, 'uspeh')
      onPrijava({ username: d.username, vloga: d.vloga })
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        prikaziObvestilo('Strežnik se ne odziva — zaženi server (npm run dev)', 'napaka')
      } else {
        prikaziObvestilo('Napaka pri povezavi s strežnikom', 'napaka')
      }
    } finally {
      setNalaga(false)
    }
  }

  const vhod = (k) => ({
    onFocus: () => setNapake(n => ({ ...n, [k]: undefined })),
  })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ozadje0)', padding: 20,
    }}>
      <div style={{
        background: 'var(--ozadje1)', border: '1.5px solid var(--rob)',
        borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400,
        boxShadow: 'var(--senca-lg)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--modra)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 12px',
          }}>🎓</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Study<span style={{ color: 'var(--modra)' }}>OS</span>
          </h1>
          <p style={{ color: 'var(--besedilo3)', fontSize: '0.85rem', marginTop: 4 }}>
            Osebni delovni prostor za študente
          </p>
        </div>

        {/* Preklop */}
        <div style={{
          display: 'flex', background: 'var(--ozadje2)', borderRadius: 10,
          padding: 4, marginBottom: 24, gap: 4,
        }}>
          {[{ k: 'prijava', l: 'Prijava' }, { k: 'registracija', l: 'Registracija' }].map(({ k, l }) => (
            <button key={k} onClick={() => { setNacin(k); setNapake({}) }} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              background: nacin === k ? 'var(--ozadje1)' : 'transparent',
              color: nacin === k ? 'var(--besedilo1)' : 'var(--besedilo3)',
              boxShadow: nacin === k ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>

        {/* Forma */}
        <form onSubmit={posreduj} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* E-mail */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)', display: 'block', marginBottom: 5 }}>
              {nacin === 'prijava' ? 'Uporabniško ime ali e-mail' : 'E-mail naslov'}
            </label>
            <input
              className="vhod"
              type="text"
              placeholder="tvoj@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
              inputMode="email"
              style={{ borderColor: napake.email ? 'var(--rdeca)' : undefined }}
              {...vhod('email')}
            />
            {napake.email && (
              <div style={{ color: 'var(--rdeca)', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '0.8rem' }} /> {napake.email}
              </div>
            )}
          </div>

          {/* Geslo */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--besedilo3)' }}>Geslo</label>
              {nacin === 'prijava' && (
                <button type="button" onClick={() => setPozabljeno(true)} style={{
                  fontSize: '0.75rem', color: 'var(--modra)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}>Pozabljeno geslo?</button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="vhod"
                type={vidnoGeslo ? 'text' : 'password'}
                placeholder="vsaj 4 znake"
                value={geslo}
                onChange={e => setGeslo(e.target.value)}
                autoComplete={nacin === 'prijava' ? 'current-password' : 'new-password'}
                style={{ paddingRight: 42, borderColor: napake.geslo ? 'var(--rdeca)' : undefined }}
                {...vhod('geslo')}
              />
              <button type="button" onClick={() => setVidnoGeslo(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--besedilo3)', padding: 0, fontSize: '1rem',
              }} title={vidnoGeslo ? 'Skrij' : 'Prikaži'}>
                <i className={`ti ${vidnoGeslo ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
            </div>
            {napake.geslo && (
              <div style={{ color: 'var(--rdeca)', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '0.8rem' }} /> {napake.geslo}
              </div>
            )}
          </div>

          <button type="submit"
            style={{
              marginTop: 4, height: 46,
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: nalaga ? 'var(--modra2)' : 'var(--modra)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: '0.95rem', fontWeight: 600, cursor: nalaga ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s', fontFamily: 'inherit',
              overflow: 'hidden', whiteSpace: 'nowrap',
            }}
            disabled={nalaga}
          >
            {nalaga ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'vrti .7s linear infinite',
                  display: 'inline-block',
                }} />
                Počakaj…
              </span>
            ) : (
              nacin === 'prijava' ? '→ Prijava' : '→ Ustvari račun'
            )}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--rob)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => onPrijava({ username: 'Gost', vloga: 'gost', lokalno: true })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--besedilo3)', fontSize: '0.78rem', textDecoration: 'underline' }}
          >
            Nadaljuj brez prijave (lokalni način)
          </button>
        </div>
      </div>
    </div>
  )
}
