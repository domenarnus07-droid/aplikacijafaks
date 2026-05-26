import { useState } from 'react'

export const PREDLOGE = [
  {
    id: 'predavanje',
    ime: 'Predavanje',
    ikona: '📖',
    opis: 'Strukturirani zapiski iz predavanja',
    vsebina: `# Predavanje: [Naslov predavanja]

**Predmet:**
**Datum:**
**Profesor:**

---

## 📌 Ključne točke

-
-
-

## 📝 Podrobni zapiski

### [Razdelek 1]

### [Razdelek 2]

### [Razdelek 3]

## ❓ Vprašanja in razjasnitve

-

## 🔗 Viri in literatura

-

## 📌 Povzetek

> Kratki povzetek ključnih ugotovitev predavanja.
`,
  },
  {
    id: 'laboratorij',
    ime: 'Laboratorij',
    ikona: '🔬',
    opis: 'Protokol in rezultati laboratorijske vaje',
    vsebina: `# Lab: [Naslov vaje]

**Predmet:**
**Datum:**
**Skupina:**

---

## 🎯 Cilj vaje

## 🧪 Materiali in oprema

-
-

## 📋 Postopek

1.
2.
3.

## 📊 Meritve in rezultati

| Parameter | Vrednost | Enota |
|-----------|----------|-------|
|           |          |       |
|           |          |       |

## 📈 Analiza

## ✅ Zaključek

## ⚠️ Opombe in napake

`,
  },
  {
    id: 'izpit',
    ime: 'Priprava na izpit',
    ikona: '📝',
    opis: 'Strukturirana priprava na izpit',
    vsebina: `# Izpit: [Predmet]

**Datum izpita:**
**Obseg snovi:**

---

## 📚 Ključni pojmi

**Pojem 1** — definicija

**Pojem 2** — definicija

**Pojem 3** — definicija

## 📐 Formule in enačbe

$$F = ma$$

## ❓ Možna vprašanja

Q: Kaj je ...?
A:

Q: Razloži ...
A:

Q: Kako deluje ...?
A:

## 💡 Trike in nasveti

-
-

## ✅ Kontrolni seznam

- [ ] Preberi poglavje X
- [ ] Reši naloge Y
- [ ] Ponovi formule Z
`,
  },
  {
    id: 'projektne_naloge',
    ime: 'Projektna naloga',
    ikona: '💻',
    opis: 'Načrt in dokumentacija projekta',
    vsebina: `# Projekt: [Ime projekta]

**Predmet:**
**Rok:**
**Skupina:**

---

## 🎯 Opis in cilji

## 📋 Zahteve

### Funkcionalne
-

### Nefunkcionalne
-

## 🏗️ Arhitektura

## 📅 Terminski plan

| Naloga | Rok | Status |
|--------|-----|--------|
|        |     |        |

## 🔧 Tehnologije

-

## 📝 Opombe

`,
  },
  {
    id: 'brainstorm',
    ime: 'Brainstorm',
    ikona: '💡',
    opis: 'Prosto razmišljanje in ideje',
    vsebina: `# 💡 Brainstorm: [Tema]

**Datum:**

---

## Ideje (brez filtriranja!)

-
-
-
-
-

## Obetavne ideje

-
-

## Naslednji koraki

- [ ]
- [ ]
`,
  },
  {
    id: 'sestanek',
    ime: 'Sestanek',
    ikona: '🤝',
    opis: 'Zapisnik sestanka ali konzultacij',
    vsebina: `# Sestanek: [Tema]

**Datum:**
**Udeleženci:**
**Trajanje:**

---

## 📋 Dnevni red

1.
2.
3.

## 🗒️ Zapiski

### 1. [Točka 1]

### 2. [Točka 2]

## ✅ Akcijske točke

| Naloga | Odgovorna oseba | Rok |
|--------|----------------|-----|
|        |                |     |

## 💬 Odprta vprašanja

-
`,
  },
  {
    id: 'cheatsheet',
    ime: 'Cheat sheet',
    ikona: '⚡',
    opis: 'Hitri pregled ključnih pojmov',
    vsebina: `# Cheat Sheet: [Predmet/Tema]

---

## 🔑 Ključne formule

$$[formula]$$

## 📌 Ključni pojmi

**Pojem** — opis

## 💻 Koda

\`\`\`python
# Primer kode
\`\`\`

## 🗂️ Algoritem

1. Korak 1
2. Korak 2
3. Korak 3

## ⚠️ Pogoste napake

-
`,
  },
]

export default function PredlogeZapiskov({ onIzberi, onZapri }) {
  const [izbrana, setIzbrana] = useState(null)

  return (
    <div className="modal-ozadje" onClick={e => e.target === e.currentTarget && onZapri()}>
      <div className="modal" style={{ maxWidth: 640, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-naslov">
          <i className="ti ti-template" style={{ color: 'var(--modra)', marginRight: 8 }} />
          Predloge zapiskov
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--besedilo3)', marginBottom: 18 }}>
          Izberi predlogo in začni pisati — vsebino prilagodi po svojih potrebah.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
          {PREDLOGE.map(p => (
            <button
              key={p.id}
              className={`predloga-kartica ${izbrana?.id === p.id ? 'izbrana' : ''}`}
              onClick={() => setIzbrana(p)}
            >
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>{p.ikona}</div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{p.ime}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--besedilo3)', lineHeight: 1.4 }}>{p.opis}</div>
              {izbrana?.id === p.id && (
                <div style={{ position: 'absolute', top: 8, right: 8, color: 'var(--modra)', fontSize: '0.9rem' }}>
                  <i className="ti ti-check-circle" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Preview */}
        {izbrana && (
          <div style={{ background: 'var(--ozadje2)', border: '1.5px solid var(--rob)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--besedilo3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Predogled — {izbrana.ime}
            </div>
            <pre style={{ fontSize: '0.75rem', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', color: 'var(--besedilo2)', margin: 0 }}>
              {izbrana.vsebina.slice(0, 500)}{izbrana.vsebina.length > 500 ? '\n…' : ''}
            </pre>
          </div>
        )}

        <div className="modal-dno">
          <button className="gumb gumb-sekundarni" onClick={onZapri}>Prekliči</button>
          <button
            className="gumb gumb-primarni"
            disabled={!izbrana}
            onClick={() => izbrana && onIzberi(izbrana)}
          >
            <i className="ti ti-template" /> Uporabi predlogo
          </button>
        </div>
      </div>
    </div>
  )
}
