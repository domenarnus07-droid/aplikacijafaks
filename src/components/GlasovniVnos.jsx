import { useState, useRef } from 'react'
import { prikaziObvestilo } from '../toast.js'

/**
 * Glasovni vnos — browser Speech Recognition API
 * Props:
 *   onBesedilo(text) — called with recognized text
 *   jezik           — BCP-47 language tag, default 'sl-SI'
 *   style           — extra button styles
 */
export default function GlasovniVnos({ onBesedilo, jezik = 'sl-SI', style = {} }) {
  const [poslusam, setPoslusam] = useState(false)
  const recRef = useRef(null)

  const podprt = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  if (!podprt) return null

  function toggle() {
    if (poslusam) {
      recRef.current?.stop()
      setPoslusam(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = jezik
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 1

    r.onresult = e => {
      const besedilo = e.results[0]?.[0]?.transcript || ''
      if (besedilo) onBesedilo(besedilo)
      setPoslusam(false)
    }
    r.onerror = err => {
      if (err.error !== 'aborted') prikaziObvestilo(`Glasovni vnos: ${err.error}`, 'napaka')
      setPoslusam(false)
    }
    r.onend = () => setPoslusam(false)

    recRef.current = r
    r.start()
    setPoslusam(true)
  }

  return (
    <button
      type="button"
      className={`gumb-ikona${poslusam ? ' aktiven' : ''}`}
      onClick={toggle}
      title={poslusam ? 'Ustavi snemanje…' : `Glasovni vnos (${jezik})`}
      style={{ color: poslusam ? 'var(--rdeca)' : undefined, ...style }}
    >
      <i className={`ti ${poslusam ? 'ti-microphone-off' : 'ti-microphone'}`}
         style={poslusam ? { animation: 'mikPulz 1s ease infinite' } : {}} />
    </button>
  )
}
