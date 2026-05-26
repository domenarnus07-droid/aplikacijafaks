import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Počisti stare SW registracije (preprečuje belo stran ob prvem zagonu)
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        // Samo registracije ki so za star SW (ne naš /sw.js)
        if (reg.active && !reg.active.scriptURL.endsWith('/sw.js')) {
          await reg.unregister()
        }
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      window.__swReg = reg

      // Obvesti o posodobitvi
      function checkWaiting() {
        if (reg.waiting) window.dispatchEvent(new CustomEvent('studyos:sw-update-ready'))
      }
      checkWaiting()

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('studyos:sw-update-ready'))
          }
        })
      })

      // Preveri posodobitve vsakih 30 minut
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000)

    } catch (err) {
      console.warn('SW registracija ni uspela:', err)
    }

    // Ko SW prevzame nadzor → reload
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload() }
    })
  })
}
