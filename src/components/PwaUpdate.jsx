import { useState, useEffect } from 'react'

export default function PwaUpdate() {
  const [updateReady, setUpdateReady] = useState(false)
  const [posodabljam, setPosodabljam] = useState(false)

  useEffect(() => {
    // Listen for update event from main.jsx
    const h = () => setUpdateReady(true)
    window.addEventListener('studyos:sw-update-ready', h)

    // Check immediately if there's already a waiting SW
    if (window.__swReg?.waiting) setUpdateReady(true)

    return () => window.removeEventListener('studyos:sw-update-ready', h)
  }, [])

  function posodobi() {
    setPosodabljam(true)
    const reg = window.__swReg
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      // controllerchange in main.jsx will reload the page
    } else {
      window.location.reload()
    }
  }

  if (!updateReady) return null

  return (
    <div className="pwa-update-vrstica">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulz-zelen 1.5s ease infinite' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Nova verzija StudyOS</span>
      </div>
      <button className="pwa-update-gumb" onClick={posodobi} disabled={posodabljam}>
        {posodabljam
          ? <><div className="nalagalnik" style={{ width: 12, height: 12, borderWidth: 2, borderColor: 'white', borderTopColor: 'transparent' }} /> Posodabljam…</>
          : <><i className="ti ti-refresh" /> Posodobi zdaj</>
        }
      </button>
    </div>
  )
}
