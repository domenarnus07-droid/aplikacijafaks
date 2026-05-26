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
    const mammoth = await import('mammoth')
    // convertToHtml keeps structure (headings, bold, lists, tables)
    const result = await mammoth.convertToHtml({ arrayBuffer })
    if (result.messages?.length) {
      console.info('mammoth warnings:', result.messages.map(m => m.message))
    }
    return _htmlNaMarkdown(result.value)
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
