import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }) {
  const [ven, setVen] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVen(true), 1300)
    const t2 = setTimeout(() => onDone(),     1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className={`splash ${ven ? 'splash-ven' : ''}`}>
      <div className="splash-vsebina">
        <div className="splash-ikona">🎓</div>
        <div className="splash-ime">Study<span>OS</span></div>
        <div className="splash-vrstica">
          <div className="splash-napredek" />
        </div>
        <div className="splash-podnapis">FERI · IPT · {new Date().getFullYear()}</div>
      </div>
    </div>
  )
}
