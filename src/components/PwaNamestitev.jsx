import { useState, useEffect } from 'react'

/**
 * PWA install prompt — shows a button when the browser supports PWA installation.
 * Handles the `beforeinstallprompt` event and triggers the native install dialog.
 */
export default function PwaNamestitev() {
  const [prompt,      setPrompt]      = useState(null)
  const [nameščeno,  setNamesceno]   = useState(false)
  const [prikazano,   setPrikazano]   = useState(false)

  useEffect(() => {
    // Check if already installed as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setNamesceno(true)
      return
    }

    const handler = e => {
      e.preventDefault()
      setPrompt(e)
      // Show the install button after a short delay so it doesn't flash on load
      setTimeout(() => setPrikazano(true), 1500)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Handle post-install
    window.addEventListener('appinstalled', () => {
      setNamesceno(true)
      setPrompt(null)
      setPrikazano(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function namesti() {
    if (!prompt) return
    const result = await prompt.prompt()
    if (result?.outcome === 'accepted') {
      setNamesceno(true)
      setPrompt(null)
      setPrikazano(false)
    }
  }

  if (nameščeno || !prikazano || !prompt) return null

  return (
    <button className="pwa-namesti-gumb" onClick={namesti} title="Namesti StudyOS kot namizno aplikacijo">
      <i className="ti ti-device-desktop-down" />
      <span>Namesti app</span>
    </button>
  )
}
