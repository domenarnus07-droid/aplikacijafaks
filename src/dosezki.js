// ── Dosežki (Achievements) ────────────────────────────────────────────────────
// Definicije in pomožne funkcije za odklepanje dosežkov

export const DOSEZKI = [
  // Zapiski
  { id: 'prvi_zapisek',    ikona: '📝', ime: 'Pisač',            opis: 'Ustvari prvi zapisek',               kategorija: 'zapiski',  redkost: 'navaden'  },
  { id: '5_zapiskov',      ikona: '📚', ime: 'Zbiralec',         opis: 'Ustvari 5 zapiskov',                 kategorija: 'zapiski',  redkost: 'navaden'  },
  { id: '10_zapiskov',     ikona: '📖', ime: 'Bralec',           opis: 'Ustvari 10 zapiskov',                kategorija: 'zapiski',  redkost: 'redek'    },
  { id: '25_zapiskov',     ikona: '🗂️', ime: 'Arhivar',          opis: 'Ustvari 25 zapiskov',                kategorija: 'zapiski',  redkost: 'redek'    },
  { id: '50_zapiskov',     ikona: '🏛️', ime: 'Enciklopedist',   opis: 'Ustvari 50 zapiskov',                kategorija: 'zapiski',  redkost: 'epski'    },
  { id: 'wiki_link',       ikona: '🔗', ime: 'Pajek',            opis: 'Uporabi wiki link [[naslov]] v zapisku', kategorija: 'zapiski', redkost: 'redek' },
  { id: 'slika_zapisek',   ikona: '🖼️', ime: 'Vizualist',        opis: 'Vstavi sliko v zapisek',             kategorija: 'zapiski',  redkost: 'navaden'  },
  { id: 'dolg_zapisek',    ikona: '📜', ime: 'Pisatelj',         opis: 'Napiši zapisek z več kot 1000 znaki', kategorija: 'zapiski', redkost: 'navaden'  },

  // Naloge
  { id: 'prva_naloga',     ikona: '✅', ime: 'Akcionist',        opis: 'Opravi prvo nalogo',                 kategorija: 'naloge',   redkost: 'navaden'  },
  { id: '10_nalog',        ikona: '💪', ime: 'Delavec',          opis: 'Opravi 10 nalog',                    kategorija: 'naloge',   redkost: 'navaden'  },
  { id: '50_nalog',        ikona: '🏅', ime: 'Marljivi',         opis: 'Opravi 50 nalog',                    kategorija: 'naloge',   redkost: 'redek'    },
  { id: '100_nalog',       ikona: '🏆', ime: 'Prvak',            opis: 'Opravi 100 nalog',                   kategorija: 'naloge',   redkost: 'epski'    },
  { id: 'brez_zamude',     ikona: '⏰', ime: 'Točni',            opis: 'Opravi nalogo pred rokom',           kategorija: 'naloge',   redkost: 'navaden'  },

  // Pomodoro
  { id: 'prva_pomo',       ikona: '🍅', ime: 'Začetnik',         opis: 'Zaključi prvo fokus sejo',           kategorija: 'focus',    redkost: 'navaden'  },
  { id: '10_pomo',         ikona: '🔥', ime: 'Fokusiran',        opis: 'Zaključi 10 fokus sej',              kategorija: 'focus',    redkost: 'navaden'  },
  { id: '50_pomo',         ikona: '🌊', ime: 'V pretoku',        opis: 'Zaključi 50 fokus sej',              kategorija: 'focus',    redkost: 'redek'    },
  { id: '100_pomo',        ikona: '🧘', ime: 'Mojster fokusa',   opis: 'Zaključi 100 fokus sej',             kategorija: 'focus',    redkost: 'epski'    },
  { id: '4_pomo_dan',      ikona: '⚡', ime: 'Sprint',           opis: 'Naredi 4 fokus seje v enem dnevu',  kategorija: 'focus',    redkost: 'redek'    },

  // AI
  { id: 'ai_povzetek',     ikona: '🤖', ime: 'AI pomočnik',      opis: 'Ustvari AI povzetek zapiska',        kategorija: 'ai',       redkost: 'navaden'  },
  { id: 'ai_chat',         ikona: '💬', ime: 'Razgovornik',      opis: 'Pogovarjaj se z AI o zapisku',       kategorija: 'ai',       redkost: 'navaden'  },

  // Kviz
  { id: 'prvi_kviz',       ikona: '🃏', ime: 'Učenec',           opis: 'Zaključi prvi kviz',                 kategorija: 'kviz',     redkost: 'navadan'  },
  { id: 'kviz_100',        ikona: '🌟', ime: 'Profesor',         opis: 'Doseži 100% na kvizu',               kategorija: 'kviz',     redkost: 'redek'    },
  { id: '5_kvizov',        ikona: '🎓', ime: 'Ponavljalec',      opis: 'Zaključi 5 kvizov',                  kategorija: 'kviz',     redkost: 'redek'    },

  // Glasovni vnos
  { id: 'glasovni_vnos',   ikona: '🎤', ime: 'Govorec',          opis: 'Uporabi glasovni vnos',              kategorija: 'posebno',  redkost: 'navaden'  },

  // Predmeti
  { id: 'prvi_predmet',    ikona: '🎨', ime: 'Organizator',      opis: 'Dodaj prvi predmet',                 kategorija: 'posebno',  redkost: 'navaden'  },
  { id: '5_predmetov',     ikona: '🗓️', ime: 'Urejen',           opis: 'Dodaj 5 predmetov',                  kategorija: 'posebno',  redkost: 'navaden'  },

  // Streak
  { id: 'streak_3',        ikona: '🔥', ime: 'Na poti',          opis: '3 dni zapored aktivnosti',           kategorija: 'streak',   redkost: 'navaden'  },
  { id: 'streak_7',        ikona: '💎', ime: 'Teden',            opis: '7 dni zapored aktivnosti',           kategorija: 'streak',   redkost: 'redek'    },
  { id: 'streak_30',       ikona: '👑', ime: 'Mesec',            opis: '30 dni zapored aktivnosti',          kategorija: 'streak',   redkost: 'epski'    },
]

export const REDKOST_BARVA = {
  navaden: 'var(--besedilo3)',
  navadan: 'var(--besedilo3)',
  redek:   '#9b59b6',
  epski:   '#f39c12',
}

export const REDKOST_IME = {
  navaden: 'Navaden',
  navadan: 'Navaden',
  redek:   '💜 Redek',
  epski:   '🏆 Epski',
}

const KLJUC = 'studyos-dosezki'

export function beriOdklenjene() {
  try {
    const s = localStorage.getItem(KLJUC)
    return s ? JSON.parse(s) : {}
  } catch { return {} }
}

function shrani(odklenj) {
  try { localStorage.setItem(KLJUC, JSON.stringify(odklenj)) } catch {}
}

/**
 * Odkleni dosežek po ID. Vrne true če je bil ravnokar odklenjen (nov).
 * Avtomatično sproži studyos:dosezek event za popup v App.jsx.
 */
export function odkleniDosezek(id) {
  const odklenj = beriOdklenjene()
  if (odklenj[id]) return false
  odklenj[id] = new Date().toISOString()
  shrani(odklenj)
  // Fire notification event
  try {
    window.dispatchEvent(new CustomEvent('studyos:dosezek', { detail: { id } }))
  } catch {}
  return true
}

/**
 * Preveri in odkleni dosežke na podlagi statistik. Vrne seznam novih dosežkov.
 */
export function preveriDosezke({ zapiski = 0, nalogeDone = 0, pomoSeje = 0, predmeti = 0, kvizSkupaj = 0, kviz100 = false, streak = 0 }) {
  const novi = []
  const odklenj = beriOdklenjene()

  function poskusi(id) {
    if (!odklenj[id]) {
      odklenj[id] = new Date().toISOString()
      const def = DOSEZKI.find(d => d.id === id)
      if (def) novi.push(def)
    }
  }

  if (zapiski >= 1)  poskusi('prvi_zapisek')
  if (zapiski >= 5)  poskusi('5_zapiskov')
  if (zapiski >= 10) poskusi('10_zapiskov')
  if (zapiski >= 25) poskusi('25_zapiskov')
  if (zapiski >= 50) poskusi('50_zapiskov')

  if (nalogeDone >= 1)   poskusi('prva_naloga')
  if (nalogeDone >= 10)  poskusi('10_nalog')
  if (nalogeDone >= 50)  poskusi('50_nalog')
  if (nalogeDone >= 100) poskusi('100_nalog')

  if (pomoSeje >= 1)   poskusi('prva_pomo')
  if (pomoSeje >= 10)  poskusi('10_pomo')
  if (pomoSeje >= 50)  poskusi('50_pomo')
  if (pomoSeje >= 100) poskusi('100_pomo')

  if (predmeti >= 1) poskusi('prvi_predmet')
  if (predmeti >= 5) poskusi('5_predmetov')

  if (kvizSkupaj >= 1) poskusi('prvi_kviz')
  if (kvizSkupaj >= 5) poskusi('5_kvizov')
  if (kviz100) poskusi('kviz_100')

  if (streak >= 3)  poskusi('streak_3')
  if (streak >= 7)  poskusi('streak_7')
  if (streak >= 30) poskusi('streak_30')

  if (novi.length > 0) shrani(odklenj)
  return novi
}

/**
 * Izračuna streak iz array datumov 'YYYY-MM-DD' aktivnosti.
 */
export function izracunajStreak(datumi) {
  if (!datumi || datumi.length === 0) return 0
  const unique = [...new Set(datumi)].sort().reverse()
  const danes = new Date()
  danes.setHours(0, 0, 0, 0)
  let streak = 0
  let pricakovan = new Date(danes)
  for (const d of unique) {
    const dat = new Date(d)
    dat.setHours(0, 0, 0, 0)
    const diff = Math.round((pricakovan - dat) / 86400000)
    if (diff === 0 || diff === 1) {
      streak++
      pricakovan = new Date(dat)
      pricakovan.setDate(pricakovan.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}
