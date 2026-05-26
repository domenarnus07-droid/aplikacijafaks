import { useState, useEffect, useRef, useCallback } from 'react'
import {
  pridobiZapiske, ustvariZapisek, posodobiZapisek, izbrisiZapisek, povzemiZapisek, aiRazgovor, generirajFlashcards
} from '../api.js'
import { prikaziObvestilo } from '../toast.js'
import { useApp } from '../App.jsx'
import Flashcards from '../components/Flashcards.jsx'
import GlasovniVnos from '../components/GlasovniVnos.jsx'
import { odkleniDosezek } from '../dosezki.js'
import PredlogeZapiskov from '../components/PredlogeZapiskov.jsx'
import UvozDatoteke from '../components/UvozDatoteke.jsx'
import { izvleciBesedilo, jePodprtaTip } from '../uvozBesedila.js'

// ── Version history ────────────────────────────────────────────────────────────
function shraniVerzijo(id, vsebina, naslov) {
  try {
    const kljuc = `studyos-verzije-${id}`
    const star = JSON.parse(localStorage.getItem(kljuc) || '[]')
    if (star.length > 0 && star[0].vsebina === vsebina) return
    const nova = { datum: new Date().toISOString(), vsebina, naslov }
    localStorage.setItem(kljuc, JSON.stringify([nova, ...star].slice(0, 5)))
  } catch {}
}
function beriVerzije(id) {
  try { return JSON.parse(localStorage.getItem(`studyos-verzije-${id}`) || '[]') } catch { return [] }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMd(raw, wikiZapiski = []) {
  if (!raw) return ''

  // 1. Extract placeholders before HTML escaping
  const ph = {}
  let idx = 0
  const pid = () => `\x00PH${idx++}\x00`

  // Mermaid blocks
  let s = raw.replace(/```mermaid\r?\n([\s\S]*?)```/g, (_, code) => {
    const id = pid()
    ph[id] = `<div class="mermaid">${code.trim()}</div>`
    return id
  })

  // Code blocks (with highlight.js if available)
  s = s.replace(/```(\w*)\r?\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = pid()
    const raw = code.replace(/^\n/, '')
    let body = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    if (window.hljs) {
      try {
        body = lang
          ? window.hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value
          : window.hljs.highlightAuto(raw).value
      } catch {}
    }
    ph[id] = `<pre><code class="hljs${lang ? ` language-${lang}` : ''}">${body}</code></pre>`
    return id
  })

  // Block math $$...$$
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const id = pid()
    try {
      ph[id] = window.katex
        ? `<div class="math-block">${window.katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`
        : `<div class="math-block"><code>$$${math.trim()}$$</code></div>`
    } catch { ph[id] = `<div class="math-block"><code>${math.trim()}</code></div>` }
    return id
  })

  // Inline math $...$
  s = s.replace(/\$([^$\n]{1,200})\$/g, (_, math) => {
    const id = pid()
    try {
      ph[id] = window.katex
        ? window.katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
        : `<code class="math-inline">${math.trim()}</code>`
    } catch { ph[id] = `<code class="math-inline">${math.trim()}</code>` }
    return id
  })

  // Images (before HTML escape so src survives)
  s = s.replace(/!\[([^\]]*)\]\(((?:data:|https?:)[^)]+)\)/g, (_, alt, src) => {
    const id = pid()
    ph[id] = `<img src="${src}" alt="${alt || 'slika'}" class="md-slika" />`
    return id
  })

  // 2. HTML escape
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // 3. Headings
  s = s.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  s = s.replace(/^### (.+)$/gm,  '<h3>$1</h3>')
  s = s.replace(/^## (.+)$/gm,   '<h2>$1</h2>')
  s = s.replace(/^# (.+)$/gm,    '<h1>$1</h1>')

  // 4. HR
  s = s.replace(/^---+$/gm, '<hr>')

  // 5. Blockquote
  s = s.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // 6. Inline formatting
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  s = s.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
  s = s.replace(/\*([^*\n]+)\*/g,     '<em>$1</em>')
  s = s.replace(/__(.+?)__/g,         '<strong>$1</strong>')
  s = s.replace(/_([^_\n]+)_/g,       '<em>$1</em>')
  s = s.replace(/~~(.+?)~~/g,         '<del>$1</del>')
  s = s.replace(/`([^`]+)`/g,         '<code>$1</code>')

  // Wiki links [[Naslov]]
  s = s.replace(/\[\[([^\]]+)\]\]/g, (_, naslov) => {
    const found = wikiZapiski.find(z => z.naslov.toLowerCase() === naslov.toLowerCase())
    const id = found ? found._id : ''
    const exists = !!found
    return `<a href="#" class="wiki-link${exists ? '' : ' wiki-link-manjka'}" data-wiki-naslov="${naslov}" data-wiki-id="${id}">${naslov}</a>`
  })

  // 7. Interactive checkboxes (before list processing)
  let cbIdx = 0
  s = s.replace(/^- \[([ xX])\] (.+)$/gm, (_, checked, text) => {
    const i = cbIdx++
    const isChecked = checked !== ' '
    return `<div class="md-cb-item"><input type="checkbox" class="md-checkbox" data-idx="${i}" ${isChecked ? 'checked' : ''}><span class="${isChecked ? 'md-cb-done' : ''}">${text}</span></div>`
  })

  // 8. Tables (| col | col |)
  s = s.replace(/((?:^\|[^\n]+\|\s*\n?)+)/gm, (block) => {
    const rows = block.trim().split('\n').filter(r => r.trim())
    if (rows.length < 1) return block
    const isSep = (r) => /^\|[\s\-:|]+\|$/.test(r.trim())
    let html = '<table class="md-tabela">'
    let thead = true
    rows.forEach((row, ri) => {
      if (isSep(row)) { html += '</thead><tbody>'; thead = false; return }
      if (ri === 0 && !isSep(row)) html += thead ? '<thead>' : ''
      const cells = row.trim().slice(1, -1).split('|')
      const tag = (thead && ri === 0) ? 'th' : 'td'
      html += `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`
    })
    html += thead ? '</thead>' : '</tbody>'
    html += '</table>'
    return html
  })

  // 9. Lists
  const lines = s.split('\n')
  const out = []; let inUl = false, inOl = false, olNum = 0
  for (const ln of lines) {
    const ulM = ln.match(/^[-*•] (.+)$/)
    const olM = ln.match(/^\d+\. (.+)$/)
    if (ulM) {
      if (inOl) { out.push('</ol>'); inOl = false }
      if (!inUl) { out.push('<ul>'); inUl = true }
      out.push(`<li>${ulM[1]}</li>`)
    } else if (olM) {
      if (inUl) { out.push('</ul>'); inUl = false }
      if (!inOl) { out.push('<ol>'); inOl = true }
      out.push(`<li>${olM[1]}</li>`)
    } else {
      if (inUl) { out.push('</ul>'); inUl = false }
      if (inOl) { out.push('</ol>'); inOl = false }
      out.push(ln)
    }
  }
  if (inUl) out.push('</ul>')
  if (inOl) out.push('</ol>')
  s = out.join('\n')

  // 10. Paragraphs
  s = s.split(/\n\n+/).map(b => {
    const t = b.trim(); if (!t) return ''
    if (/^<(h[1-6]|ul|ol|pre|hr|blockquote|table|div)/.test(t)) return t
    if (/^\x00PH\d+\x00$/.test(t)) return t
    return `<p>${t.replace(/\n/g, '<br>')}</p>`
  }).join('\n')

  // 11. Restore placeholders
  for (const [id, html] of Object.entries(ph)) {
    s = s.split(id).join(html)
  }

  return s
}

const OZNAKE = [
  { vrednost: 'modra',  oznaka: '📘 Splošno' },
  { vrednost: 'zelena', oznaka: '📗 Naloge'  },
  { vrednost: 'rumena', oznaka: '📙 Izpiti'  },
]

const BARVE_ZAPISKI = [
  { barva: '',        oznaka: '⬜', title: 'Privzeto'  },
  { barva: '#FEF9C3', oznaka: '🟡', title: 'Rumena'    },
  { barva: '#DCFCE7', oznaka: '🟢', title: 'Zelena'    },
  { barva: '#DBEAFE', oznaka: '🔵', title: 'Modra'     },
  { barva: '#FEE2E2', oznaka: '🔴', title: 'Rdeča'     },
  { barva: '#F3E8FF', oznaka: '🟣', title: 'Vijolična' },
]

const SABLONE = [
  {
    ime: '📋 Predavanja',
    vsebina: `# Predavanja\n\n**Predmet:**  \n**Datum:**  \n**Profesor:**  \n\n---\n\n## Snov\n\n\n\n## Ključne točke\n\n- \n- \n- \n\n## Vprašanja\n\n- \n`,
  },
  {
    ime: '📝 Izpit',
    vsebina: `# Izpit\n\n**Predmet:**  \n**Datum izpita:**  \n**Oblika:**  \n\n---\n\n## Snov za učenje\n\n\n\n## Formule / definicije\n\n\`\`\`\n\n\`\`\`\n\n## Primeri nalog\n\n1. \n2. \n3. \n`,
  },
  {
    ime: '🚀 Projekt',
    vsebina: `# Projekt\n\n**Ime projekta:**  \n**Rok oddaje:**  \n**Skupinski člani:**  \n\n---\n\n## Opis\n\n\n\n## Cilji\n\n- \n- \n\n## Naloge\n\n- [ ] \n- [ ] \n- [ ] \n\n## Viri\n\n- \n`,
  },
]

function formatDatum(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ── Markdown orodna vrstica ───────────────────────────────────────────────────
function MdOrodnaVrstica({ onVstavi, onSablona }) {
  const [sablonaOdprta, setSablonaOdprta] = useState(false)

  const gumbi = [
    { oznaka: 'B',   pred: '**',  za: '**',  title: 'Krepko (Ctrl+B)'  },
    { oznaka: 'I',   pred: '*',   za: '*',   title: 'Ležeče (Ctrl+I)'  },
    { oznaka: '~~',  pred: '~~',  za: '~~',  title: 'Prečrtano'        },
    null,
    { oznaka: 'H1',  pred: '# ',  za: '',    title: 'Naslov 1',        vrstica: true },
    { oznaka: 'H2',  pred: '## ', za: '',    title: 'Naslov 2',        vrstica: true },
    { oznaka: 'H3',  pred: '###', za: '',    title: 'Naslov 3',        vrstica: true },
    null,
    { oznaka: '— List',  pred: '- ',    za: '',       title: 'Seznam',       vrstica: true },
    { oznaka: '☐',       pred: '- [ ] ', za: '',       title: 'Checkbox',     vrstica: true },
    { oznaka: '| tabela',pred: '| Col1 | Col2 |\n| --- | --- |\n| ', za: ' |  |', title: 'Tabela' },
    { oznaka: '$…$',     pred: '$',     za: '$',       title: 'Enačba (inline)' },
    { oznaka: '$$',      pred: '$$\n',  za: '\n$$',    title: 'Enačba (blok)' },
    { oznaka: '`kod`',   pred: '`',     za: '`',       title: 'Vrstična koda' },
    { oznaka: '```',     pred: '```\n', za: '\n```',   title: 'Kodni blok'   },
    { oznaka: '> citat', pred: '> ',    za: '',        title: 'Citat',        vrstica: true },
    { oznaka: '---',     pred: '\n---\n', za: '',      title: 'Ločilo'        },
  ]

  return (
    <div className="md-orodna-vrstica">
      {gumbi.map((g, i) =>
        g === null
          ? <div key={`loc-${i}`} className="md-orodna-locilo" />
          : (
            <button
              key={g.oznaka}
              className="md-orodna-gumb"
              title={g.title}
              onMouseDown={e => { e.preventDefault(); onVstavi(g.pred, g.za, g.vrstica) }}
            >
              {g.oznaka}
            </button>
          )
      )}

      <div className="md-orodna-locilo" />

      {/* Šablone */}
      <div className="sablone-okvir">
        <button
          className="md-orodna-gumb"
          title="Vstavi šablono"
          onMouseDown={e => { e.preventDefault(); setSablonaOdprta(o => !o) }}
          style={{ display: 'flex', alignItems: 'center', gap: 3 }}
        >
          <i className="ti ti-template" style={{ fontSize: '0.85rem' }} /> Šablona
        </button>
        {sablonaOdprta && (
          <div className="sablone-meni">
            {SABLONE.map(s => (
              <button
                key={s.ime}
                className="sablona-element"
                onMouseDown={e => { e.preventDefault(); onSablona(s.vsebina); setSablonaOdprta(false) }}
              >
                {s.ime}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tag input component ───────────────────────────────────────────────────────
function TagiVhod({ tagi = [], onChange }) {
  const [vhod, setVhod] = useState('')

  function dodajTag(val) {
    const tag = val.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || tagi.includes(tag)) { setVhod(''); return }
    onChange([...tagi, tag])
    setVhod('')
  }

  function odstraniTag(t) { onChange(tagi.filter(x => x !== t)) }

  return (
    <div className="tagi-vhod-okvir">
      <i className="ti ti-tags" style={{ color: 'var(--besedilo3)', fontSize: '0.8rem', flexShrink: 0 }} />
      {tagi.map(t => (
        <span key={t} className="tag tag-urednik">
          #{t}
          <button onClick={() => odstraniTag(t)} className="tag-zapri">×</button>
        </span>
      ))}
      <input
        className="tagi-vhod"
        placeholder="Dodaj tag…"
        value={vhod}
        onChange={e => setVhod(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); dodajTag(vhod) }
          if (e.key === 'Backspace' && !vhod && tagi.length > 0) onChange(tagi.slice(0, -1))
        }}
        onBlur={() => vhod.trim() && dodajTag(vhod)}
      />
    </div>
  )
}

export default function Zapiski() {
  const { aktivniPredmet, setAktivniPredmet, predmeti, aktivniTag, setVseTagi } = useApp()
  const [zapiski,   setZapiski]   = useState([])
  const [aktivni,   setAktivni]   = useState(null)
  const [iskanje,   setIskanje]   = useState('')
  const [nalaga,    setNalaga]    = useState(true)
  const [shranjeno, setShranjeno] = useState(false)
  const [predogled, setPredogled] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [flashcardsOdprte, setFlashcardsOdprte] = useState(false)
  const [dragNad, setDragNad] = useState(false)
  const [aiNalaga,      setAiNalaga]      = useState(false)
  const [verzijeOdprte, setVerzijeOdprte] = useState(false)
  const [chatOdprt,     setChatOdprt]     = useState(false)
  const [chatSporocila, setChatSporocila] = useState([])
  const [chatVhod,      setChatVhod]      = useState('')
  const [fokusNacin,    setFokusNacin]    = useState(false)
  const [predlogeOdprte, setPredlogeOdprte] = useState(false)
  const [uvozOdprt, setUvozOdprt] = useState(false)
  const [fcNalaga,      setFcNalaga]      = useState(false)
  const [chatNalaga,  setChatNalaga]  = useState(false)
  const chatSpodajRef = useRef(null)
  const debounceRef  = useRef(null)
  const aktivniRef   = useRef(null)
  const novZapisekRef = useRef(null)
  const textareaRef  = useRef(null)
  const predogledRef = useRef(null)

  // Fullscreen
  function toggleFullscreen() {
    setFullscreen(f => {
      document.documentElement.classList.toggle('zapiski-fullscreen', !f)
      return !f
    })
  }

  useEffect(() => { return () => document.documentElement.classList.remove('zapiski-fullscreen') }, [])
  useEffect(() => {
    const h = e => { if (e.key === 'Escape' && fullscreen) { setFullscreen(false); document.documentElement.classList.remove('zapiski-fullscreen') } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fullscreen])

  // Mermaid post-render
  useEffect(() => {
    if (!predogled) return
    if (!window.mermaid) return
    setTimeout(() => { try { window.mermaid.run() } catch {} }, 80)
  }, [predogled, aktivni?.vsebina])

  // Naloži zapiske
  useEffect(() => {
    pridobiZapiske().then(zs => {
      setZapiski(zs)
      // Update global tag cache for sidebar
      const tagiCount = {}
      zs.forEach(z => (z.tagi || []).forEach(t => { tagiCount[t] = (tagiCount[t] || 0) + 1 }))
      const sorted = Object.entries(tagiCount).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t)
      try { localStorage.setItem('studyos-tagi-cache', JSON.stringify(sorted)) } catch {}
      setVseTagi?.(sorted)
      const zadnjiId = localStorage.getItem('studyos-zadnji-zapisek')
      if (zadnjiId) {
        const najden = zs.find(z => z._id === zadnjiId)
        if (najden) { setAktivni(najden); aktivniRef.current = najden }
      }
    }).finally(() => setNalaga(false))
  }, [])

  useEffect(() => { aktivniRef.current = aktivni }, [aktivni])

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current)
      const a = aktivniRef.current
      if (a && a._id && a._spremenjen) {
        posodobiZapisek(a._id, {
          naslov: a.naslov, vsebina: a.vsebina, oznaka: a.oznaka,
          predmet: a.predmet, barvaOzadja: a.barvaOzadja || '',
          pripeto: !!a.pripeto, tagi: a.tagi || [],
        })
      }
    }
  }, [])

  useEffect(() => { novZapisekRef.current = novZapisek })
  useEffect(() => {
    const h = () => novZapisekRef.current?.()
    window.addEventListener('studyos:nov-zapisek', h)
    return () => window.removeEventListener('studyos:nov-zapisek', h)
  }, [])

  function sprozShranjevanje() {
    setShranjeno(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const z = aktivniRef.current
      if (!z || !z._id) return
      const res = await posodobiZapisek(z._id, {
        naslov: z.naslov, vsebina: z.vsebina, oznaka: z.oznaka,
        predmet: z.predmet, barvaOzadja: z.barvaOzadja || '',
        pripeto: !!z.pripeto, tagi: z.tagi || [],
      })
      if (res) {
        setShranjeno(true)
        shraniVerzijo(z._id, z.vsebina, z.naslov)
        setZapiski(zs => zs.map(s => s._id === res._id ? { ...res, _spremenjen: false } : s))
        setTimeout(() => setShranjeno(false), 2500)
      }
    }, 1000)
  }

  function spremeniPolje(polje, vrednost) {
    setAktivni(a => {
      const nov = { ...a, [polje]: vrednost, _spremenjen: true }
      aktivniRef.current = nov
      sprozShranjevanje()
      return nov
    })
    setZapiski(zs => zs.map(z => z._id === aktivni?._id ? { ...z, [polje]: vrednost } : z))
  }

  function izberiZapisek(zapisek) {
    clearTimeout(debounceRef.current)
    const cur = aktivniRef.current
    if (cur && cur._id && cur._spremenjen) {
      posodobiZapisek(cur._id, {
        naslov: cur.naslov, vsebina: cur.vsebina, oznaka: cur.oznaka,
        predmet: cur.predmet, barvaOzadja: cur.barvaOzadja || '',
        pripeto: !!cur.pripeto, tagi: cur.tagi || [],
      })
    }
    setAktivni(zapisek)
    setShranjeno(false)
    setPredogled(false)
    localStorage.setItem('studyos-zadnji-zapisek', zapisek._id)
  }

  async function novZapisek() {
    const privzetiPredmet = localStorage.getItem('studyos-privzeti-predmet') || ''
    const nov = await ustvariZapisek({
      naslov: 'Nov zapisek', vsebina: '', oznaka: 'modra',
      predmet: aktivniPredmet || privzetiPredmet, tagi: [],
    })
    if (nov) {
      setZapiski(zs => {
        const novi = [nov, ...zs]
        // Achievement check
        odkleniDosezek('prvi_zapisek')
        if (novi.length >= 5)  odkleniDosezek('5_zapiskov')
        if (novi.length >= 10) odkleniDosezek('10_zapiskov')
        if (novi.length >= 25) odkleniDosezek('25_zapiskov')
        if (novi.length >= 50) odkleniDosezek('50_zapiskov')
        return novi
      })
      setAktivni(nov)
      setPredogled(false)
      localStorage.setItem('studyos-zadnji-zapisek', nov._id)
      prikaziObvestilo('Zapisek ustvarjen', 'uspeh')
    }
  }

  async function izbrisiAktivni() {
    if (!aktivni) return
    if (!confirm(`Izbriši zapisek "${aktivni.naslov}"?`)) return
    const ok = await izbrisiZapisek(aktivni._id)
    if (ok) {
      setZapiski(zs => zs.filter(z => z._id !== aktivni._id))
      setAktivni(null)
      localStorage.removeItem('studyos-zadnji-zapisek')
      prikaziObvestilo('Zapisek izbrisan', 'uspeh')
    }
  }

  function izvozi() {
    if (!aktivni) return
    const vsebina = `# ${aktivni.naslov}\n\n${aktivni.vsebina}`
    const blob = new Blob([vsebina], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${aktivni.naslov.replace(/[^a-zA-Z0-9čšž ]/g, '').trim() || 'zapisek'}.md`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
    prikaziObvestilo('Zapisek izvožen kot .md', 'uspeh')
  }

  function natisniPDF() {
    if (!aktivni) return
    const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>${aktivni.naslov}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <style>body{font-family:system-ui,sans-serif;line-height:1.75;padding:40px;max-width:720px;margin:0 auto;color:#0f172a}
    h1{font-size:2rem;font-weight:800;margin-bottom:8px}h2{font-size:1.4rem;margin-top:28px}h3{font-size:1.1rem;margin-top:20px}
    pre{background:#f1f5f9;padding:16px;border-radius:8px;overflow-x:auto}code{font-family:monospace;font-size:.88em;background:#f1f5f9;padding:1px 5px;border-radius:3px}
    blockquote{border-left:3px solid #2563eb;padding:8px 16px;margin:12px 0;color:#475569;background:#eff6ff}
    ul{padding-left:22px}p{margin-bottom:12px}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f1f5f9;font-weight:700}
    .math-block{text-align:center;margin:16px 0}.md-cb-item{display:flex;align-items:center;gap:8px;margin:4px 0}
    </style>
  </head><body>
    <h1>${aktivni.naslov}</h1>
    <div style="font-size:.8rem;color:#64748b;margin-bottom:28px">${new Date().toLocaleDateString('sl-SI',{day:'numeric',month:'long',year:'numeric'})}</div>
    ${renderMd(aktivni.vsebina, zapiski)}
  </body></html>`
    const win = window.open('', '_blank', 'width=800,height=900')
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 300) }
    prikaziObvestilo('Odpiranje tiskalniškega pogovora…', 'info')
  }

  function kopirajLink() {
    if (!aktivni) return
    const url = `${window.location.origin}/#/zapiski?z=${aktivni._id}`
    navigator.clipboard.writeText(url).then(() => prikaziObvestilo('Povezava kopirana v odložišče', 'uspeh'))
  }

  async function preklopiPripeto() {
    if (!aktivni) return
    const novVal = !aktivni.pripeto
    const res = await posodobiZapisek(aktivni._id, { pripeto: novVal })
    if (res) {
      setAktivni(a => ({ ...a, pripeto: novVal }))
      setZapiski(zs => zs.map(z => z._id === aktivni._id ? { ...z, pripeto: novVal } : z))
      prikaziObvestilo(novVal ? 'Zapisek pripen 📌' : 'Zapisek odpipen', 'uspeh')
    }
  }

  async function posljiChatSporocilo(e) {
    e?.preventDefault()
    if (!chatVhod.trim() || chatNalaga) return
    const novoSporocilo = { role: 'user', content: chatVhod.trim() }
    const posodobljena = [...chatSporocila, novoSporocilo]
    setChatSporocila(posodobljena)
    setChatVhod('')
    setChatNalaga(true)
    setTimeout(() => chatSpodajRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    try {
      const odgovor = await aiRazgovor(
        aktivni?.vsebina || '',
        posodobljena.map(m => ({ role: m.role, content: m.content }))
      )
      setChatSporocila(prev => [...prev, { role: 'assistant', content: odgovor }])
      setTimeout(() => chatSpodajRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      prikaziObvestilo(`AI: ${err.message}`, 'napaka')
    } finally {
      setChatNalaga(false)
    }
  }

  async function aiPovzemi() {
    if (!aktivni?.vsebina?.trim()) { prikaziObvestilo('Ni vsebine za povzetek', 'napaka'); return }
    setAiNalaga(true)
    try {
      const povzetek = await povzemiZapisek(aktivni.vsebina)
      if (povzetek) {
        const dodaj = `\n\n---\n\n## ✨ AI povzetek\n\n${povzetek}`
        spremeniPolje('vsebina', (aktivni.vsebina || '') + dodaj)
        prikaziObvestilo('Povzetek dodan na konec zapiseka', 'uspeh')
      }
    } catch (err) {
      prikaziObvestilo(`AI napaka: ${err.message}`, 'napaka')
    } finally {
      setAiNalaga(false)
    }
  }

  function vstavi(pred, za = '', prefixVrstica = false) {
    const ta = textareaRef.current
    if (!ta) return
    const zac   = ta.selectionStart
    const konec = ta.selectionEnd
    const star  = aktivni?.vsebina || ''

    let novVal
    if (prefixVrstica) {
      const predVrstico = star.lastIndexOf('\n', zac - 1) + 1
      novVal = star.slice(0, predVrstico) + pred + star.slice(predVrstico)
    } else {
      const sel = star.slice(zac, konec)
      novVal = star.slice(0, zac) + pred + sel + za + star.slice(konec)
    }

    spremeniPolje('vsebina', novVal)
    requestAnimationFrame(() => {
      ta.focus()
      if (prefixVrstica) {
        ta.setSelectionRange(zac + pred.length, konec + pred.length)
      } else {
        ta.setSelectionRange(zac + pred.length, konec + pred.length)
      }
    })
  }

  function vstavljSablono(vsebina) {
    if (!aktivni) return
    if (aktivni.vsebina && !confirm('Zamenjati obstoječo vsebino s šablono?')) return
    spremeniPolje('vsebina', vsebina)
    prikaziObvestilo('Šablona vstavljena', 'uspeh')
  }

  // Interactive checkboxes and wiki links in preview
  function handlePreviewClick(e) {
    // Checkbox toggle
    if (e.target.type === 'checkbox' && e.target.classList.contains('md-checkbox')) {
      e.preventDefault()
      const cbIdx = parseInt(e.target.dataset.idx)
      let ci = 0
      const novVsebina = (aktivni?.vsebina || '').replace(
        /^(- \[)([ xX])(\] .+)$/gm,
        (match, pre, checked, post) => {
          if (ci === cbIdx) { ci++; return `${pre}${checked !== ' ' ? ' ' : 'x'}${post}` }
          ci++; return match
        }
      )
      spremeniPolje('vsebina', novVsebina)
      return
    }
    // Wiki link navigation
    const wikiLink = e.target.closest?.('.wiki-link')
    if (wikiLink) {
      e.preventDefault()
      const naslov = wikiLink.dataset.wikiNaslov
      const id     = wikiLink.dataset.wikiId
      const cilj = id
        ? zapiski.find(z => z._id === id)
        : zapiski.find(z => z.naslov.toLowerCase() === naslov?.toLowerCase())
      if (cilj) { izberiZapisek(cilj) }
      else { prikaziObvestilo(`Zapisek "${naslov}" ne obstaja`, 'napaka') }
    }
  }

  // File drag & drop — text and images
  function onDragOverEditor(e) { e.preventDefault(); setDragNad(true) }
  function onDragLeaveEditor()  { setDragNad(false) }
  async function onDropEditor(e) {
    e.preventDefault(); setDragNad(false)
    const files = Array.from(e.dataTransfer.files)
    const textFile = files.find(f => f.name.endsWith('.md') || f.name.endsWith('.txt'))
    const imgFile  = files.find(f => f.type.startsWith('image/'))
    const docFile  = files.find(f => jePodprtaTip(f) && !f.name.toLowerCase().endsWith('.txt'))

    if (textFile) {
      const vsebina = await textFile.text()
      if (!aktivni) return
      const obstoječa = aktivni.vsebina || ''
      spremeniPolje('vsebina', obstoječa ? obstoječa + '\n\n' + vsebina : vsebina)
      prikaziObvestilo(`"${textFile.name}" vstavljen v zapisek`, 'uspeh')
    } else if (imgFile && aktivni) {
      const reader = new FileReader()
      reader.onload = ev => {
        const ime = imgFile.name.replace(/\.[^.]+$/, '')
        spremeniPolje('vsebina', (aktivni.vsebina || '') + `\n\n![${ime}](${ev.target.result})\n`)
        prikaziObvestilo(`Slika "${imgFile.name}" dodana`, 'uspeh')
      }
      reader.readAsDataURL(imgFile)
    } else if (docFile && aktivni) {
      prikaziObvestilo(`Uvažam "${docFile.name}"…`, 'info')
      try {
        const besedilo = await izvleciBesedilo(docFile)
        if (!besedilo || !besedilo.trim()) {
          prikaziObvestilo('Datoteka je prazna ali ni besedila', 'napaka')
          return
        }
        const obstoječa = aktivni.vsebina || ''
        spremeniPolje('vsebina', obstoječa ? obstoječa + '\n\n' + besedilo : besedilo)
        prikaziObvestilo(`"${docFile.name}" dodan v zapisek`, 'uspeh')
      } catch (err) {
        prikaziObvestilo('Napaka pri uvozu: ' + err.message, 'napaka')
      }
    } else {
      prikaziObvestilo('Podprte so .md, .txt, .pdf, .docx, .xlsx, .pptx in slike', 'napaka')
    }
  }

  // Paste images from clipboard
  function onPasteTextarea(e) {
    const items = Array.from(e.clipboardData?.items || [])
    const imgItem = items.find(item => item.type.startsWith('image/'))
    if (imgItem && aktivni) {
      e.preventDefault()
      const file = imgItem.getAsFile()
      const reader = new FileReader()
      reader.onload = ev => {
        const pos = textareaRef.current?.selectionStart ?? (aktivni.vsebina || '').length
        const star = aktivni.vsebina || ''
        const vstavek = `\n![slika](${ev.target.result})\n`
        spremeniPolje('vsebina', star.slice(0, pos) + vstavek + star.slice(pos))
        prikaziObvestilo('Slika prilepljena iz odložišča', 'uspeh')
      }
      reader.readAsDataURL(file)
    }
  }

  function onKeyDownTextarea(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); vstavi('**', '**'); return }
      if (e.key === 'i') { e.preventDefault(); vstavi('*', '*'); return }
      if (e.key === 'f') { e.preventDefault(); toggleFullscreen(); return }
      if (e.key === 'p') { e.preventDefault(); natisniPDF(); return }
      if (e.key === 'e') { e.preventDefault(); setPredogled(p => !p); return }
    }
  }

  const filtrirani = zapiski
    .filter(z => !aktivniPredmet || z.predmet === aktivniPredmet)
    .filter(z => !aktivniTag || (z.tagi || []).includes(aktivniTag))
    .filter(z => !iskanje || z.naslov.toLowerCase().includes(iskanje.toLowerCase()) ||
                              z.vsebina?.toLowerCase().includes(iskanje.toLowerCase()) ||
                              (z.tagi || []).some(t => t.toLowerCase().includes(iskanje.toLowerCase())))
    .sort((a, b) => {
      if (a.pripeto !== b.pripeto) return a.pripeto ? -1 : 1
      return 0
    })

  // Fokus način: esc zapre
  useEffect(() => {
    if (!fokusNacin) return
    const h = e => { if (e.key === 'Escape') setFokusNacin(false) }
    document.body.classList.add('fokus-nacin')
    window.addEventListener('keydown', h)
    return () => {
      document.body.classList.remove('fokus-nacin')
      window.removeEventListener('keydown', h)
    }
  }, [fokusNacin])

  return (
    <>
    <div className={`zapiski-okvir${fokusNacin ? ' fokus-nacin-okvir' : ''}`}>
      {/* ── Levi panel ─────────────────────────────────────────────── */}
      <div className="zapiski-levo">
        <div className="zapiski-levo-glava">
          {aktivniPredmet && (() => {
            const p = predmeti.find(x => x.id === aktivniPredmet)
            return p ? (
              <div className="predmet-filter-pill" style={{ '--pill-barva': p.barva }}>
                <span className="predmet-filter-pill-ikona">{p.ikona}</span>
                <span className="predmet-filter-pill-ime">{p.ime}</span>
                <button className="predmet-filter-pill-zapri" onClick={() => setAktivniPredmet(null)}>
                  <i className="ti ti-x" />
                </button>
              </div>
            ) : null
          })()}

          <div className="zapiski-iskanje">
            <i className="ti ti-search iskanje-ikona" />
            <input
              className="vhod"
              placeholder="Iskanje zapiskov, tagov…"
              value={iskanje}
              onChange={e => setIskanje(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="gumb gumb-primarni" style={{ flex: 1, justifyContent: 'center' }} onClick={novZapisek}>
              <i className="ti ti-plus" /> Nov zapisek
            </button>
            <button className="gumb gumb-sekundarni" style={{ padding: '9px 11px' }} onClick={() => setUvozOdprt(true)} title="Uvozi datoteko (PDF, DOCX, XLSX, PPTX, TXT)">
              <i className="ti ti-paperclip" />
            </button>
          </div>
        </div>

        <div className="zapiski-seznam">
          {nalaga ? (
            <div className="nalagalnik" />
          ) : filtrirani.length === 0 ? (
            <div className="prazno-stanje" style={{ padding: '32px 12px' }}>
              <div className="prazno-ikona">📝</div>
              <p>Ni zapiskov. Ustvari prvega!</p>
            </div>
          ) : (
            filtrirani.map(z => (
              <div
                key={z._id}
                className={`zapisek-vnos ${aktivni?._id === z._id ? 'aktiven' : ''}`}
                style={z.barvaOzadja ? { borderLeft: `3px solid ${z.barvaOzadja}` } : {}}
                onClick={() => izberiZapisek(z)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {z.pripeto && <i className="ti ti-pin pin-ikona" />}
                  <span className="zapisek-vnos-naslov">{z.naslov || 'Brez naslova'}</span>
                </div>
                <div className="zapisek-vnos-spodaj">
                  <span className={`oznaka oznaka-${z.oznaka}`} style={{ fontSize: '0.65rem', padding: '1px 7px' }}>
                    {OZNAKE.find(o => o.vrednost === z.oznaka)?.oznaka ?? z.oznaka}
                  </span>
                  <span className="zapisek-vnos-datum">{formatDatum(z.posodobljen)}</span>
                </div>
                {(z.tagi || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                    {(z.tagi || []).slice(0, 3).map(t => (
                      <span key={t} className="tag" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>#{t}</span>
                    ))}
                    {(z.tagi || []).length > 3 && <span style={{ fontSize: '0.6rem', color: 'var(--besedilo3)' }}>+{z.tagi.length - 3}</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Desni panel ──────────────────────────────────────────── */}
      <div className="zapiski-desno">
        {aktivni ? (
          <>
            {/* Orodna vrstica */}
            <div className="urednik-orodna-vrstica">
              <input
                className="urednik-naslov-vhod"
                value={aktivni.naslov}
                onChange={e => spremeniPolje('naslov', e.target.value)}
                placeholder="Naslov zapiseka…"
              />

              <select
                className="vhod izbira"
                style={{ width: 'auto', fontSize: '0.78rem', padding: '5px 8px' }}
                value={aktivni.oznaka}
                onChange={e => spremeniPolje('oznaka', e.target.value)}
              >
                {OZNAKE.map(o => <option key={o.vrednost} value={o.vrednost}>{o.oznaka}</option>)}
              </select>

              <select
                className="vhod izbira"
                style={{ width: 'auto', fontSize: '0.78rem', padding: '5px 8px' }}
                value={aktivni.predmet}
                onChange={e => spremeniPolje('predmet', e.target.value)}
              >
                <option value="">Brez predmeta</option>
                {predmeti.map(p => <option key={p.id} value={p.id}>{p.ikona} {p.ime}</option>)}
              </select>

              {/* Barvni picker */}
              <div className="nota-barve" title="Barva ozadja">
                {BARVE_ZAPISKI.map(b => (
                  <div
                    key={b.barva}
                    className={`nota-barva-krog ${aktivni.barvaOzadja === b.barva ? 'izbrana' : ''}`}
                    style={{ background: b.barva || 'var(--ozadje2)', borderColor: b.barva ? b.barva : 'var(--rob)' }}
                    title={b.title}
                    onClick={() => spremeniPolje('barvaOzadja', b.barva)}
                  />
                ))}
              </div>

              <span className={`shranjeno-znacka ${shranjeno ? 'vidno' : ''}`}>
                <i className="ti ti-circle-check" /> Shranjeno
              </span>

              {/* AI Povzemi */}
              <button
                className={`gumb-ikona ${aiNalaga ? 'aktiven' : ''}`}
                onClick={aiPovzemi}
                title="✨ AI povzetek (nastavi API ključ v Nastavitvah)"
                disabled={aiNalaga}
                style={{ color: 'var(--vijolicna)' }}
              >
                {aiNalaga
                  ? <div className="nalagalnik" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  : <i className="ti ti-sparkles" />
                }
              </button>

              {/* AI chat */}
              <button
                className={`gumb-ikona ${chatOdprt ? 'aktiven' : ''}`}
                onClick={() => { setChatOdprt(o => !o); if (!chatOdprt) setVerzijeOdprte(false) }}
                title="AI razgovor o zapisku (nastavi API ključ v Nastavitvah)"
                style={{ color: chatOdprt ? 'var(--vijolicna)' : undefined }}
              >
                <i className="ti ti-message-chatbot" />
              </button>

              {/* Predloge */}
              <button
                className="gumb-ikona"
                onClick={() => setPredlogeOdprte(true)}
                title="Vstavi predlogo"
              >
                <i className="ti ti-template" />
              </button>

              {/* AI generiraj kartice */}
              <button
                className="gumb-ikona"
                onClick={async () => {
                  if (!aktivni?.vsebina?.trim()) { prikaziObvestilo('Zapisek je prazen', 'napaka'); return }
                  setFcNalaga(true)
                  try {
                    const txt = await generirajFlashcards(aktivni.vsebina)
                    if (txt) {
                      const nova = aktivni.vsebina + '\n\n---\n\n' + txt
                      setVsebina(nova)
                      setSprozShranjevanje(true)
                      odkleniDosezek('ai_povzetek')
                      prikaziObvestilo('AI kartice generirane in dodane v zapisek ✓', 'uspeh')
                    }
                  } catch (e) { prikaziObvestilo(`Napaka: ${e.message}`, 'napaka') }
                  finally { setFcNalaga(false) }
                }}
                title="AI generiraj flashcard kartice"
                style={{ color: fcNalaga ? 'var(--modra)' : undefined }}
                disabled={fcNalaga}
              >
                {fcNalaga
                  ? <div className="nalagalnik" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  : <i className="ti ti-cards" />
                }
              </button>

              {/* Fokus način */}
              <button
                className={`gumb-ikona ${fokusNacin ? 'aktiven' : ''}`}
                onClick={() => setFokusNacin(f => !f)}
                title={fokusNacin ? 'Zapri fokus način (Esc)' : 'Fokus način — celozaslonski urednik'}
                style={{ color: fokusNacin ? 'var(--zelena)' : undefined }}
              >
                <i className={`ti ti-${fokusNacin ? 'minimize' : 'maximize'}`} />
              </button>

              {/* Zgodovina verzij */}
              <button
                className={`gumb-ikona ${verzijeOdprte ? 'aktiven' : ''}`}
                onClick={() => { setVerzijeOdprte(o => !o); if (!verzijeOdprte) setChatOdprt(false) }}
                title="Zgodovina verzij"
              >
                <i className="ti ti-history" />
              </button>

              {/* Pin */}
              <button
                className={`gumb-ikona ${aktivni.pripeto ? 'aktiven' : ''}`}
                onClick={preklopiPripeto}
                title={aktivni.pripeto ? 'Odpni zapisek' : 'Pripni zapisek'}
              >
                <i className="ti ti-pin" />
              </button>

              {/* Predogled */}
              <button
                className={`gumb-ikona ${predogled ? 'aktiven' : ''}`}
                onClick={() => setPredogled(p => !p)}
                title={predogled ? 'Uredi' : 'Predogled (Ctrl+E)'}
              >
                <i className={`ti ${predogled ? 'ti-edit' : 'ti-eye'}`} />
              </button>

              {/* Flashcards */}
              <button className="gumb-ikona" onClick={() => setFlashcardsOdprte(true)} title="Učne kartice">
                <i className="ti ti-cards" />
              </button>

              {/* Kopiraj link */}
              <button className="gumb-ikona" onClick={kopirajLink} title="Kopiraj globoko povezavo">
                <i className="ti ti-link" />
              </button>

              {/* Deli — kopiraj vsebino kot Markdown */}
              <button
                className="gumb-ikona"
                onClick={() => {
                  if (!aktivni) return
                  const md = `# ${aktivni.naslov}\n\n${aktivni.vsebina || ''}`
                  navigator.clipboard.writeText(md)
                    .then(() => prikaziObvestilo('Vsebina kopirana v odložišče (Markdown) ✓', 'uspeh'))
                    .catch(() => prikaziObvestilo('Kopiranje ni uspelo', 'napaka'))
                }}
                title="Kopiraj vsebino kot Markdown"
              >
                <i className="ti ti-share" />
              </button>

              {/* PDF */}
              <button className="gumb-ikona" onClick={natisniPDF} title="Natisni / PDF (Ctrl+P)">
                <i className="ti ti-printer" />
              </button>

              {/* Glasovni vnos */}
              {!predogled && (
                <GlasovniVnos
                  onBesedilo={txt => {
                    const ta = textareaRef.current
                    const pos = ta ? ta.selectionStart : (aktivni.vsebina || '').length
                    const star = aktivni.vsebina || ''
                    const vstavek = star ? ` ${txt}` : txt
                    spremeniPolje('vsebina', star.slice(0, pos) + vstavek + star.slice(pos))
                  }}
                  title="Glasovni vnos — diktiranje v zapisek (sl-SI)"
                />
              )}

              {/* Fullscreen */}
              <button
                className={`gumb-ikona ${fullscreen ? 'aktiven' : ''}`}
                onClick={toggleFullscreen}
                title="Celozaslonski način (Ctrl+F)"
              >
                <i className={`ti ti-${fullscreen ? 'minimize' : 'maximize'}`} />
              </button>

              {/* Export .md */}
              <button className="gumb-ikona" onClick={izvozi} title="Izvozi kot .md">
                <i className="ti ti-download" />
              </button>

              <button className="gumb-ikona rdeca" onClick={izbrisiAktivni} title="Izbriši zapisek">
                <i className="ti ti-trash" />
              </button>
            </div>

            {/* Tag vhod */}
            <TagiVhod
              tagi={aktivni.tagi || []}
              onChange={tagi => spremeniPolje('tagi', tagi)}
            />

            {/* Markdown toolbar (samo pri urejanju) */}
            {!predogled && (
              <MdOrodnaVrstica
                onVstavi={vstavi}
                onSablona={vstavljSablono}
              />
            )}

            {/* AI chat panel */}
            {chatOdprt && (
              <div className="ai-chat-panel">
                <div className="ai-chat-glava">
                  <i className="ti ti-message-chatbot" style={{ color: 'var(--vijolicna)' }} />
                  <span>AI razgovor — {aktivni.naslov}</span>
                  <button
                    className="gumb-ikona"
                    onClick={() => { setChatSporocila([]); prikaziObvestilo('Pogovor počiščen', 'info') }}
                    title="Počisti pogovor"
                    style={{ width: 24, height: 24, marginLeft: 'auto' }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: '0.7rem' }} />
                  </button>
                  <button className="gumb-ikona" onClick={() => setChatOdprt(false)} style={{ width: 24, height: 24 }}>
                    <i className="ti ti-x" style={{ fontSize: '0.7rem' }} />
                  </button>
                </div>

                <div className="ai-chat-sporocila">
                  {chatSporocila.length === 0 && (
                    <div className="ai-chat-intro">
                      <i className="ti ti-sparkles" style={{ fontSize: '1.5rem', color: 'var(--vijolicna)', marginBottom: 8 }} />
                      <p>Vprašaj karkoli o tem zapisku.</p>
                      <div className="ai-chat-predlogi">
                        {['Razloži mi ključne pojme', 'Napiši testna vprašanja', 'Povzemi v 3 točkah', 'Kaj je najpomembnejše?'].map(p => (
                          <button key={p} className="ai-chat-predlog" onClick={() => { setChatVhod(p) }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatSporocila.map((m, i) => (
                    <div key={i} className={`ai-chat-balon ${m.role}`}>
                      {m.role === 'assistant' && (
                        <div className="ai-chat-avatar"><i className="ti ti-sparkles" /></div>
                      )}
                      <div className="ai-chat-vsebina">{m.content}</div>
                    </div>
                  ))}
                  {chatNalaga && (
                    <div className="ai-chat-balon assistant">
                      <div className="ai-chat-avatar"><i className="ti ti-sparkles" /></div>
                      <div className="ai-chat-vsebina ai-chat-tipka">
                        <span /><span /><span />
                      </div>
                    </div>
                  )}
                  <div ref={chatSpodajRef} />
                </div>

                <form onSubmit={posljiChatSporocilo} className="ai-chat-vhod-okvir">
                  <GlasovniVnos onBesedilo={txt => setChatVhod(v => v ? `${v} ${txt}` : txt)} />
                  <input
                    className="ai-chat-vhod"
                    placeholder="Vprašaj AI o zapisku…"
                    value={chatVhod}
                    onChange={e => setChatVhod(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && posljiChatSporocilo(e)}
                    disabled={chatNalaga}
                  />
                  <button
                    type="submit"
                    className="gumb gumb-primarni"
                    style={{ padding: '8px 14px', flexShrink: 0 }}
                    disabled={!chatVhod.trim() || chatNalaga}
                  >
                    <i className="ti ti-send" />
                  </button>
                </form>
              </div>
            )}

            {/* Verzije panel */}
            {verzijeOdprte && (() => {
              const verzije = beriVerzije(aktivni._id)
              return (
                <div className="verzije-panel">
                  <div className="verzije-glava">
                    <span><i className="ti ti-history" /> Zadnjih {verzije.length} verzij</span>
                    <button className="gumb-ikona" onClick={() => setVerzijeOdprte(false)} style={{ width: 24, height: 24 }}>
                      <i className="ti ti-x" style={{ fontSize: '0.75rem' }} />
                    </button>
                  </div>
                  {verzije.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--besedilo3)', padding: '8px 0' }}>Ni shranjenih verzij.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {verzije.map((v, i) => (
                        <div key={i} className="verzija-vnos">
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                              {new Date(v.datum).toLocaleString('sl-SI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--besedilo3)', marginTop: 2 }}>
                              {v.vsebina.length} znakov
                            </div>
                          </div>
                          <button
                            className="gumb gumb-sekundarni"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => {
                              if (confirm('Obnovi to verzijo? Trenutna vsebina bo izgubljena.')) {
                                spremeniPolje('vsebina', v.vsebina)
                                setVerzijeOdprte(false)
                                prikaziObvestilo('Verzija obnovljena', 'uspeh')
                              }
                            }}
                          >
                            Obnovi
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Editor ali Predogled */}
            {predogled ? (
              <div
                ref={predogledRef}
                className="md-predogled"
                style={aktivni.barvaOzadja ? { background: aktivni.barvaOzadja } : {}}
                onClick={handlePreviewClick}
                dangerouslySetInnerHTML={{
                  __html: renderMd(aktivni.vsebina, zapiski) ||
                    '<p style="color:var(--besedilo3);font-style:italic">Ni vsebine za prikaz.</p>'
                }}
              />
            ) : (
              <div
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onDragOver={onDragOverEditor}
                onDragLeave={onDragLeaveEditor}
                onDrop={onDropEditor}
              >
                <textarea
                  ref={textareaRef}
                  className={`urednik-besedilo ${dragNad ? 'editor-drag-nad' : ''}`}
                  value={aktivni.vsebina}
                  onChange={e => spremeniPolje('vsebina', e.target.value)}
                  onKeyDown={onKeyDownTextarea}
                  onPaste={onPasteTextarea}
                  placeholder={`Začni pisati…\n\nPodpira **krepko**, *ležeče*, # naslove, - sezname, \`kodo\`,\ntabele, $matematiko$, \`\`\`mermaid\`\`\` diagrame\n\nSamodejno shranjuje vsako sekundo.`}
                  spellCheck={false}
                  style={aktivni.barvaOzadja ? { background: aktivni.barvaOzadja } : {}}
                />
                {/* Status bar */}
                <div className="zapiski-statusna">
                  {(() => {
                    const besede = (aktivni.vsebina || '').trim().split(/\s+/).filter(Boolean).length
                    const min = Math.max(1, Math.ceil(besede / 200))
                    return <><span>{besede} {besede === 1 ? 'beseda' : 'besed'}</span><span>·</span><span>~{min} min branja</span></>
                  })()}
                  {aktivni.vsebina && <span style={{ marginLeft: 'auto' }}>{aktivni.vsebina.length} znakov</span>}
                </div>
              </div>
            )}

            {flashcardsOdprte && (
              <Flashcards
                naslov={aktivni.naslov}
                vsebina={aktivni.vsebina}
                noteId={aktivni._id}
                onZapri={() => setFlashcardsOdprte(false)}
              />
            )}
            {fullscreen && <div className="fs-indikator"><i className="ti ti-minimize" /> Esc za izhod · Ctrl+F za preklop</div>}
          </>
        ) : (
          <div className="urednik-brez-izbire">
            <i className="ti ti-notebook" />
            <p>Izberi zapisek ali ustvari novega.</p>
            <button className="gumb gumb-primarni" onClick={novZapisek}>
              <i className="ti ti-plus" /> Nov zapisek
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Predloge modal */}
    {predlogeOdprte && (
      <PredlogeZapiskov
        onZapri={() => setPredlogeOdprte(false)}
        onIzberi={predloga => {
          setVsebina(predloga.vsebina)
          setSprozShranjevanje(true)
          setPredlogeOdprte(false)
          setPredogled(false)
          prikaziObvestilo(`Predloga "${predloga.ime}" vstavljena ✓`, 'uspeh')
        }}
      />
    )}

    {/* Uvoz datoteke modal */}
    {uvozOdprt && (
      <UvozDatoteke
        onZapri={() => setUvozOdprt(false)}
        onUvoz={async (naslov, vsebina) => {
          const nov = await ustvariZapisek({
            naslov,
            vsebina,
            oznaka: 'modra',
            predmet: aktivniPredmet || '',
            tagi: [],
          })
          if (nov) {
            setZapiski(zs => [nov, ...zs])
            setAktivni(nov)
            setPredogled(false)
            localStorage.setItem('studyos-zadnji-zapisek', nov._id)
          }
        }}
      />
    )}
    </>
  )
}
