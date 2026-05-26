// ── StudyOS Service Worker ────────────────────────────────────────────────────
// Strategija: lokalne datoteke NIKOLI ne cachiramo (vedno svežo iz strežnika),
// CDN vire (pisave, ikone, KaTeX...) cachiramo za offline delovanje.
const CDN_CACHE = 'studyos-cdn-v1'

// ── Install: takoj prevzemi nadzor ───────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting()  // Takoj aktiviraj — ne čakaj na staro verzijo
})

// ── Activate: počisti stare cache-e ──────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(
        ks.filter(k => k !== CDN_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // Takoj prevzami vse odprte zavihke
  )
})

// ── Message ───────────────────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (e.data?.type === 'GET_VERSION')  e.source?.postMessage({ type: 'VERSION', version: CDN_CACHE })
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // 1. API klici → vedno omrežje, nikoli cache
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ napaka: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    )
    return
  }

  // 2. CDN viri (pisave, ikone, knjižnice) → cache-first
  const jeCDN = url.origin !== self.location.origin
  if (jeCDN) {
    e.respondWith(
      caches.open(CDN_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached
          return fetch(e.request).then(res => {
            if (res?.status === 200) cache.put(e.request, res.clone())
            return res
          }).catch(() => new Response('', { status: 503 }))
        })
      )
    )
    return
  }

  // 3. Lokalne datoteke (HTML, JS, CSS, slike) → VEDNO omrežje
  // Nikoli ne cachiramo — tako vedno dobimo zadnjo verzijo
  // Ob neuspehu poskusi iz CDN cacha (ne bo tam) ali vrni napako
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(cached =>
        cached || new Response('Offline', { status: 503 })
      )
    )
  )
})

// ── Opomniki za roke nalog ────────────────────────────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'studyos-opomniki') e.waitUntil(preveriOpomnikE())
})

async function preveriOpomnikE() {
  const jutri = new Date(); jutri.setDate(jutri.getDate() + 1); jutri.setHours(0, 0, 0, 0)
  try {
    const naloge = await fetch('/api/naloge').then(r => r.json())
    for (const n of naloge) {
      if (n.opravljeno || !n.rok) continue
      const d = new Date(n.rok); d.setHours(0, 0, 0, 0)
      if (d.getTime() === jutri.getTime()) {
        self.registration.showNotification('📚 Rok jutri!', {
          body: n.besedilo, icon: '/icon.svg', tag: `rok-${n._id}`, data: { url: '/#/naloge' },
        })
      }
    }
  } catch {}
}

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      const c = cs.find(x => x.focus)
      if (c) { c.focus(); c.navigate(url) } else clients.openWindow(url)
    })
  )
})
