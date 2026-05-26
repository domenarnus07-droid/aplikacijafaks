import { useState, useRef } from 'react'
import { prikaziObvestilo } from '../toast.js'
import { izvleciBesedilo } from '../uvozBesedila.js'

const SPREJETI_TIPI = '.pdf,.docx,.xlsx,.xls,.pptx,.ppt,.txt'

export default function UvozDatoteke({ onZapri, onUvoz }) {
  const [nalaganje, setNalaganje] = useState(false)
  const [imeDatoteke, setImeDatoteke] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const vhodRef = useRef(null)

  async function obdelajDatoteko(datoteka) {
    if (!datoteka) return
    setImeDatoteke(datoteka.name)
    setNalaganje(true)
    try {
      const besedilo = await izvleciBesedilo(datoteka)
      if (!besedilo || !besedilo.trim()) {
        prikaziObvestilo('Datoteka je prazna ali ni besedila', 'napaka')
        setNalaganje(false)
        return
      }
      const naslov = datoteka.name.replace(/\.[^.]+$/, '')
      onUvoz(naslov, besedilo)
      prikaziObvestilo(`Uvoženo: ${naslov}`, 'uspeh')
      onZapri()
    } catch (err) {
      prikaziObvestilo('Napaka pri uvozu: ' + err.message, 'napaka')
      setNalaganje(false)
    }
  }

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (f) obdelajDatoteko(f)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) obdelajDatoteko(f)
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-naslov" style={{ margin: 0 }}>📎 Uvozi datoteko</div>
          <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
        </div>

        <div
          className={`uvoz-datoteke-zona ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => vhodRef.current?.click()}
        >
          {nalaganje ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="nalagalnik" style={{ margin: 0 }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--besedilo3)' }}>
                Obdelujem: {imeDatoteke}
              </span>
            </div>
          ) : (
            <>
              <i className="ti ti-upload" style={{ fontSize: '2.5rem', color: 'var(--modra)', marginBottom: 8 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Povleci datoteko sem ali klikni</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--besedilo3)' }}>
                PDF, DOCX, XLSX, PPTX, TXT
              </div>
            </>
          )}
        </div>

        <input
          ref={vhodRef}
          type="file"
          accept={SPREJETI_TIPI}
          style={{ display: 'none' }}
          onChange={onFileChange}
        />

        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
        </div>
      </div>
    </div>
  )
}
