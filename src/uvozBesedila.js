/**
 * Walk a DOM node tree and convert it to clean Markdown text.
 * Handles nested tags (bold inside a paragraph, etc.) correctly.
 */
function _domNaMd(node, listDepth) {
  if (node.nodeType === 3 /* TEXT_NODE */) {
    // Collapse whitespace but keep meaningful spaces
    return node.textContent.replace(/\s+/g, ' ')
  }
  if (node.nodeType !== 1 /* ELEMENT_NODE */) return ''

  const tag      = node.tagName.toLowerCase()
  const children = () =>
    Array.from(node.childNodes).map(c => _domNaMd(c, listDepth)).join('')

  switch (tag) {
    case 'h1': return `# ${children().trim()}\n\n`
    case 'h2': return `## ${children().trim()}\n\n`
    case 'h3': return `### ${children().trim()}\n\n`
    case 'h4': return `#### ${children().trim()}\n\n`
    case 'h5': return `##### ${children().trim()}\n\n`
    case 'h6': return `###### ${children().trim()}\n\n`
    case 'p':  {
      const txt = children().trim()
      return txt ? `${txt}\n\n` : ''
    }
    case 'br': return '\n'
    case 'strong':
    case 'b':  return `**${children().trim()}**`
    case 'em':
    case 'i':  return `*${children().trim()}*`
    case 'u':  return children()
    case 'li': return `${'  '.repeat(listDepth || 0)}- ${children().trim()}\n`
    case 'ul':
    case 'ol': {
      const inner = Array.from(node.childNodes)
        .map(c => _domNaMd(c, (listDepth || 0) + 1))
        .join('')
      return inner + '\n'
    }
    case 'table': return children() + '\n'
    case 'thead':
    case 'tbody': return children()
    case 'tr': {
      const cells = Array.from(node.childNodes)
        .filter(c => c.nodeType === 1)
        .map(c => _domNaMd(c, 0).trim())
        .join(' | ')
      const isHead = node.querySelector('th')
      const sep    = isHead
        ? '\n' + Array.from(node.querySelectorAll('th')).map(() => '---').join(' | ')
        : ''
      return `| ${cells} |${sep}\n`
    }
    case 'th':
    case 'td': return children()
    case 'a':  {
      const href = node.getAttribute('href') || ''
      const txt  = children().trim()
      return href ? `[${txt}](${href})` : txt
    }
    case 'code': return `\`${children()}\``
    case 'pre':  return `\`\`\`\n${children().trim()}\n\`\`\`\n\n`
    case 'hr':   return '\n---\n\n'
    // Ignore purely layout/wrapper elements but keep their children
    case 'div':
    case 'span':
    case 'section':
    case 'article':
    case 'main':
    case 'body':   return children()
    default:       return children()
  }
}

/** Convert mammoth HTML output → clean Markdown using DOM parsing */
function _htmlNaMarkdown(html) {
  try {
    const div  = document.createElement('div')
    div.innerHTML = html
    const raw = _domNaMd(div, 0)
    return raw
      .replace(/\n{3,}/g, '\n\n')   // max 2 consecutive blank lines
      .replace(/ {2,}/g, ' ')        // collapse multiple spaces
      .trim()
  } catch {
    // DOMParser not available (SSR) – fall back to tag stripping
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

/**
 * Shared text-extraction utility.
 * Used by UvozDatoteke.jsx (modal) and Zapiski.jsx (drag-and-drop onto editor).
 */
export async function izvleciBesedilo(datoteka) {
  const arrayBuffer = await datoteka.arrayBuffer()
  const ime = datoteka.name.toLowerCase()

  if (ime.endsWith('.txt')) {
    return new TextDecoder().decode(arrayBuffer)
  }

  if (ime.endsWith('.pdf')) {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let besedilo = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const stran = await pdf.getPage(i)
      const vsebina = await stran.getTextContent()
      besedilo += vsebina.items.map(item => item.str).join(' ') + '\n\n'
    }
    return besedilo.trim()
  }

  if (ime.endsWith('.docx')) {
    const JSZip = (await import('jszip')).default
    const zip   = await JSZip.loadAsync(arrayBuffer)

    const xmlFile = zip.files['word/document.xml']
    if (!xmlFile) throw new Error('Ni veljavna DOCX datoteka')
    const xmlStr = await xmlFile.async('string')
    const doc    = new DOMParser().parseFromString(xmlStr, 'text/xml')

    // Word namespace URI
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

    // Reliable attribute getter for namespace-prefixed XML attributes
    const wAttr = (el, name) =>
      el?.getAttributeNS(W, name) ?? el?.getAttribute('w:' + name) ?? ''

    // All w:X in a subtree by local name
    const wAll  = (el, name) => Array.from(el.getElementsByTagNameNS(W, name))
    const wOne  = (el, name) => el.getElementsByTagNameNS(W, name)[0] ?? null

    // ── Text extraction from one w:p, preserving bold/italic ──────────────
    function paraToMd(p) {
      // Collect w:r elements that are direct runs of THIS paragraph,
      // not runs inside a nested table within the paragraph.
      const runs = wAll(p, 'r').filter(r => {
        let n = r.parentNode
        while (n && n !== p) {
          if (n.localName === 'tc') return false   // inside a table cell → skip
          n = n.parentNode
        }
        return true
      })

      return runs.map(r => {
        const tNodes = wAll(r, 't')
        let txt = tNodes.map(t => t.textContent).join('')
        if (!txt) return ''
        const rPr   = wOne(r, 'rPr')
        const bold  = rPr && wOne(rPr, 'b')  !== null
        const ital  = rPr && wOne(rPr, 'i')  !== null
        if (bold && ital) return `***${txt}***`
        if (bold)         return `**${txt}**`
        if (ital)         return `*${txt}*`
        return txt
      }).join('')
    }

    // ── Heading style → Markdown prefix ───────────────────────────────────
    function headingPrefix(styleId) {
      if (!styleId) return ''
      const s = styleId.toLowerCase().replace(/[-_\s]/g, '')
      if (s === 'heading1' || s === 'naslov1' || s === 'title'    || s === '1') return '# '
      if (s === 'heading2' || s === 'naslov2' || s === 'subtitle' || s === '2') return '## '
      if (s === 'heading3' || s === 'naslov3' || s === '3') return '### '
      if (s === 'heading4' || s === 'naslov4' || s === '4') return '#### '
      if (s === 'heading5' || s === 'naslov5' || s === '5') return '##### '
      if (s === 'heading6' || s === 'naslov6' || s === '6') return '###### '
      return ''
    }

    // ── Walk body's direct children (w:p and w:tbl) ───────────────────────
    const bodyEl = wOne(doc, 'body') || doc.documentElement
    const lines  = []

    Array.from(bodyEl.childNodes).forEach(el => {
      if (el.nodeType !== 1) return          // skip text/comment nodes
      const ln = el.localName

      if (ln === 'p') {
        const pPr     = wOne(el, 'pPr')
        const pStyle  = pPr ? wOne(pPr, 'pStyle') : null
        const styleId = pStyle ? wAttr(pStyle, 'val') : ''
        const prefix  = headingPrefix(styleId)

        // List detection via w:numPr / w:ilvl
        const numPr  = pPr ? wOne(pPr, 'numPr') : null
        const ilvlEl = numPr ? wOne(numPr, 'ilvl') : null
        const depth  = ilvlEl ? parseInt(wAttr(ilvlEl, 'val') || '0', 10) : -1

        const txt = paraToMd(el).trim()
        if (!txt) { lines.push(''); return }

        if (depth >= 0) {
          lines.push('  '.repeat(depth) + '- ' + txt)
        } else if (prefix) {
          lines.push(prefix + txt)
          lines.push('')
        } else {
          lines.push(txt)
          lines.push('')
        }

      } else if (ln === 'tbl') {
        wAll(el, 'tr').forEach((row, ri) => {
          // only direct w:tc children of this row
          const cells = Array.from(row.childNodes)
            .filter(n => n.nodeType === 1 && n.localName === 'tc')
            .map(tc =>
              wAll(tc, 'p')
                // only paragraphs directly inside this cell (not nested tables)
                .filter(p => {
                  let n = p.parentNode
                  while (n && n !== tc) {
                    if (n.localName === 'tbl') return false
                    n = n.parentNode
                  }
                  return true
                })
                .map(p => paraToMd(p).trim())
                .filter(Boolean)
                .join(' ')
            )
          lines.push('| ' + cells.join(' | ') + ' |')
          if (ri === 0) lines.push('| ' + cells.map(() => '---').join(' | ') + ' |')
        })
        lines.push('')
      }
    })

    return lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  if (ime.endsWith('.xlsx') || ime.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(arrayBuffer)
    let besedilo = ''
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      besedilo += `=== ${sheetName} ===\n`
      besedilo += XLSX.utils.sheet_to_csv(sheet) + '\n\n'
    }
    return besedilo.trim()
  }

  if (ime.endsWith('.pptx') || ime.endsWith('.ppt')) {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(arrayBuffer)
    let besedilo = ''
    const slideKeys = Object.keys(zip.files)
      .filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)?.[0] || '0')
        const nb = parseInt(b.match(/\d+/)?.[0] || '0')
        return na - nb
      })
    for (let i = 0; i < slideKeys.length; i++) {
      const xml = await zip.files[slideKeys[i]].async('string')
      const doc = new DOMParser().parseFromString(xml, 'text/xml')
      const teksti = Array.from(doc.querySelectorAll('a\\:t, t'))
        .map(t => t.textContent.trim())
        .filter(Boolean)
      if (teksti.length > 0) {
        besedilo += `--- Diapozitiv ${i + 1} ---\n${teksti.join(' ')}\n\n`
      }
    }
    return besedilo.trim()
  }

  throw new Error('Nepodprta vrsta datoteke')
}

/** Returns true for file types this utility can handle */
export function jePodprtaTip(datoteka) {
  const ime = datoteka.name.toLowerCase()
  return (
    ime.endsWith('.pdf')  ||
    ime.endsWith('.docx') ||
    ime.endsWith('.xlsx') ||
    ime.endsWith('.xls')  ||
    ime.endsWith('.pptx') ||
    ime.endsWith('.ppt')  ||
    ime.endsWith('.txt')
  )
}
