import { useEffect } from 'react'

const SKUPI = [
  { naslov: 'Navigacija', vnosi: [
    { tipke: ['Ctrl','K'], opis: 'Globalno iskanje' },
    { tipke: ['Ctrl','N'], opis: 'Nov zapisek' },
    { tipke: ['Ctrl','T'], opis: 'Nova naloga' },
    { tipke: ['?'],        opis: 'Prikaži bližnjice' },
    { tipke: ['Esc'],      opis: 'Zapri modal / iskanje' },
  ]},
  { naslov: 'Urejevalnik zapiskov', vnosi: [
    { tipke: ['Ctrl','B'], opis: 'Krepko besedilo' },
    { tipke: ['Ctrl','I'], opis: 'Ležeče besedilo' },
    { tipke: ['Ctrl','F'], opis: 'Celozaslonski način' },
    { tipke: ['Ctrl','P'], opis: 'Natisni / Izvozi PDF' },
    { tipke: ['Ctrl','E'], opis: 'Predogled Markdown' },
  ]},
  { naslov: 'Hitri ukazi (v iskanju)', vnosi: [
    { tipke: ['/z Naslov'],   opis: 'Ustvari nov zapisek' },
    { tipke: ['/t Besedilo'], opis: 'Ustvari novo nalogo' },
    { tipke: ['/nav Stran'],  opis: 'Navigiraj na stran' },
  ]},
]

export default function TipkovneBliznjice({ onZapri }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onZapri() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onZapri])

  return (
    <div className="bk-ozadje" onMouseDown={e => e.target === e.currentTarget && onZapri()}>
      <div className="bk-modal">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700 }}>⌨️ Tipkovne bližnjice</h2>
          <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
        </div>
        {SKUPI.map(sk => (
          <div key={sk.naslov} className="bk-skupina">
            <div className="bk-skupina-naslov">{sk.naslov}</div>
            {sk.vnosi.map((v, i) => (
              <div key={i} className="bk-vrstica">
                <div className="bk-tipke">
                  {v.tipke.map((t, j) => (
                    <span key={j} style={{ display:'flex', alignItems:'center', gap:3 }}>
                      {j > 0 && <span className="bk-plus">+</span>}
                      <kbd className="bk-tipka">{t}</kbd>
                    </span>
                  ))}
                </div>
                <span className="bk-opis">{v.opis}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ fontSize:'0.72rem', color:'var(--besedilo3)', textAlign:'center', marginTop:8 }}>
          Pritisni <kbd className="bk-tipka">?</kbd> kadarkoli za prikaz tega panela
        </div>
      </div>
    </div>
  )
}
