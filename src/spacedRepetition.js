const KLJUC = 'studyos-sr-kartice'

export function beriKartice() {
  try { return JSON.parse(localStorage.getItem(KLJUC) || '[]') } catch { return [] }
}

export function shraniKartice(kartice) {
  try { localStorage.setItem(KLJUC, JSON.stringify(kartice)) } catch {}
}

export function karticeZaDanes() {
  const danes = new Date().toISOString().slice(0, 10)
  return beriKartice().filter(k => !k.nextReview || k.nextReview <= danes)
}

export function izracunajNaslednjiPregled(kartica, ocena) {
  // ocena: 0 (ne znam), 1 (težko), 2 (ok), 3 (zlahka)
  let { interval = 1, easeFactor = 2.5, repetitions = 0 } = kartica

  if (ocena < 2) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions++
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (3 - ocena) * (0.08 + (3 - ocena) * 0.02))
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    repetitions,
    nextReview: nextReview.toISOString().slice(0, 10),
  }
}

export function uvozIzZapiska(zapisek) {
  if (!zapisek?.vsebina) return []
  const kartice = []
  const vrstice = zapisek.vsebina.split('\n')

  let i = 0
  while (i < vrstice.length) {
    const v = vrstice[i].trim()
    if (/^Q:\s*.+/i.test(v)) {
      const vprasanje = v.replace(/^Q:\s*/i, '').trim()
      const odgovorVrstice = []
      i++
      while (i < vrstice.length && !/^Q:\s*/i.test(vrstice[i].trim())) {
        const av = vrstice[i].trim()
        if (/^A:\s*/i.test(av)) odgovorVrstice.push(av.replace(/^A:\s*/i, '').trim())
        else if (odgovorVrstice.length > 0 && av) odgovorVrstice.push(av)
        i++
      }
      if (odgovorVrstice.length > 0) {
        kartice.push({
          id: `sr-${zapisek._id}-${kartice.length}-${Date.now()}`,
          vprašanje: vprasanje,
          odgovor: odgovorVrstice.join('\n'),
          noteId: zapisek._id,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
          nextReview: new Date().toISOString().slice(0, 10),
        })
      }
      continue
    }
    i++
  }
  return kartice
}
