import { useState, useEffect } from 'react'

export default function ZivaUra() {
  const [cas, setCas] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCas(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const h  = String(cas.getHours()).padStart(2, '0')
  const m  = String(cas.getMinutes()).padStart(2, '0')
  const s  = String(cas.getSeconds()).padStart(2, '0')
  const dn = cas.toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="ziva-ura">
      <span className="ziva-ura-cas">{h}:{m}<span className="ziva-ura-sek">:{s}</span></span>
      <span className="ziva-ura-datum">{dn}</span>
    </div>
  )
}
