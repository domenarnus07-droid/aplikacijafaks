import { useState, useRef } from 'react'
import { prikaziObvestilo } from '../toast.js'

const STUDYOS_KLJUCI = [
  'studyos-local-zapiski', 'studyos-local-naloge', 'studyos-local-urnik',
  'studyos-pomo-casi', 'studyos-pomo-sesije', 'studyos-zvoki',
  'studyos-ai-ponudnik', 'studyos-ai-kljuc-groq', 'studyos-ai-kljuc-gemini',
  'studyos-ai-kljuc-anthropic', 'studyos-ai-kljuc-ollama-url', 'studyos-ai-kljuc-ollama-model',
  'studyos-tema', 'studyos-barva-akcent', 'studyos-predmeti', 'studyos-ime',
  'studyos-ocene', 'studyos-oc-formule', 'studyos-cilji', 'studyos-sticky',
  'studyos-dash-config', 'studyos-aktivni-dnevi', 'studyos-sr-kartice',
  'studyos-projekti', 'studyos-projekti-naloge', 'studyos-izpiti',
  'studyos-tagi-cache', 'studyos-dash-cilj-ure',
]

function izvozBackup() {
  const data = {}
  STUDYOS_KLJUCI.forEach(k => {
    const v = localStorage.getItem(k)
    if (v !== null) data[k] = v
  })
  // also grab version history
  Object.keys(localStorage).filter(k => k.startsWith('studyos-verzije-')).forEach(k => {
    data[k] = localStorage.getItem(k)
  })
  return data
}

export default function BackupUvoz({ onZapri }) {
  const [uvazam, setUvazam] = useState(false)
  const [predogled, setPredogled] = useState(null)
  const vhodRef = useRef(null)

  function izvozi() {
    const data = izvozBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    const datum = new Date().toISOString().slice(0, 10)
    a.download = `studyos-backup-${datum}.json`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
    prikaziObvestilo('Backup shranjen ✓', 'uspeh')
  }

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        const veljavni = Object.keys(data).filter(k => k.startsWith('studyos-'))
        if (veljavni.length === 0) { prikaziObvestilo('Datoteka ni veljaven StudyOS backup', 'napaka'); return }
        setPredogled({ data, stevilo: veljavni.length })
      } catch {
        prikaziObvestilo('Napaka pri branju JSON datoteke', 'napaka')
      }
    }
    reader.readAsText(f)
  }

  function uvozi() {
    if (!predogled) return
    setUvazam(true)
    try {
      Object.entries(predogled.data).forEach(([k, v]) => {
        if (k.startsWith('studyos-')) localStorage.setItem(k, v)
      })
      prikaziObvestilo(`Uvoženo ${predogled.stevilo} nastavitev. Stran se bo osvežila…`, 'uspeh')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      prikaziObvestilo('Napaka pri uvozu: ' + err.message, 'napaka')
      setUvazam(false)
    }
  }

  function izbrisiVsePodatke() {
    if (!confirm('⚠️ POZOR: Izbrisati vse StudyOS podatke? Te akcije ni mogoče razveljaviti!')) return
    if (!confirm('Res izbrisati? Drugi klik za potrditev.')) return
    Object.keys(localStorage).filter(k => k.startsWith('studyos-')).forEach(k => localStorage.removeItem(k))
    prikaziObvestilo('Vsi podatki izbrisani. Stran se bo osvežila…', 'info')
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-naslov" style={{ margin: 0 }}>💾 Backup & Uvoz podatkov</div>
          <button className="gumb-ikona" onClick={onZapri}><i className="ti ti-x" /></button>
        </div>

        {/* Izvoz */}
        <div style={{ background: 'var(--ozadje2)', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
            <i className="ti ti-download" style={{ color: 'var(--zelena)', marginRight: 6 }} />
            Izvoz podatkov
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--besedilo3)', marginBottom: 12 }}>
            Shrani vse zapiske, naloge, ocene, nastavitve in ostale podatke kot JSON datoteko.
          </p>
          <button className="gumb gumb-primarni" style={{ background: 'var(--zelena)', borderColor: 'var(--zelena)' }} onClick={izvozi}>
            <i className="ti ti-download" /> Prenesi backup
          </button>
        </div>

        {/* Uvoz */}
        <div style={{ background: 'var(--ozadje2)', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
            <i className="ti ti-upload" style={{ color: 'var(--modra)', marginRight: 6 }} />
            Uvoz podatkov
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--besedilo3)', marginBottom: 12 }}>
            Obnovi podatke iz prej shranjenega backup-a. Obstoječi podatki bodo zamenjani.
          </p>

          {predogled ? (
            <div>
              <div style={{ padding: '10px 14px', background: 'var(--ozadje1)', borderRadius: 9, border: '1.5px solid var(--modra)33', marginBottom: 12, fontSize: '0.85rem' }}>
                <i className="ti ti-file-check" style={{ color: 'var(--modra)', marginRight: 6 }} />
                Najdenih <strong>{predogled.stevilo}</strong> nastavitev za uvoz
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="gumb gumb-sekundarni" onClick={() => { setPredogled(null); vhodRef.current && (vhodRef.current.value = '') }}>
                  Prekliči
                </button>
                <button className="gumb gumb-primarni" onClick={uvozi} disabled={uvazam}>
                  {uvazam ? '…' : '✓ Uvozi in osveži'}
                </button>
              </div>
            </div>
          ) : (
            <button className="gumb gumb-sekundarni" onClick={() => vhodRef.current?.click()}>
              <i className="ti ti-file-import" /> Izberi backup datoteko…
            </button>
          )}

          <input ref={vhodRef} type="file" accept=".json" style={{ display: 'none' }} onChange={onFileChange} />
        </div>

        {/* Brisanje */}
        <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 12, padding: '14px 18px', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--rdeca)', marginBottom: 4 }}>
            <i className="ti ti-trash" style={{ marginRight: 6 }} />
            Brisanje vseh podatkov
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--besedilo3)', marginBottom: 10 }}>
            Nepopravljivo briše vse lokalne podatke. Priporočamo backup pred brisanjem.
          </p>
          <button
            className="gumb"
            style={{ background: 'var(--rdeca)', color: '#fff', borderColor: 'var(--rdeca)', fontSize: '0.82rem', padding: '7px 14px' }}
            onClick={izbrisiVsePodatke}
          >
            <i className="ti ti-trash" /> Izbriši vse podatke
          </button>
        </div>
      </div>
    </div>
  )
}
