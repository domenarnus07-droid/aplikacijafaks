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
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
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
