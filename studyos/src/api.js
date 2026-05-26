const BASE = 'http://localhost:5000/api'

// ─── Toast helper ────────────────────────────────────────────────────────────
export function showToast(message, type = 'error') {
  const existing = document.getElementById('studyos-toast')
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.id = 'studyos-toast'
  el.textContent = message
  el.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:12px 20px; border-radius:10px; font-family:'Space Grotesk',sans-serif;
    font-size:14px; font-weight:500; box-shadow:0 4px 24px rgba(0,0,0,.25);
    background:${type === 'error' ? '#EF4444' : type === 'success' ? '#22C55E' : '#2563EB'};
    color:#fff; transition:opacity .3s;
  `
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }, 3200)
}

async function request(url, options = {}) {
  try {
    const res = await fetch(BASE + url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.status === 204 ? null : res.json()
  } catch (err) {
    showToast(err.message)
    throw err
  }
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export const getNotes = () => request('/notes')
export const createNote = (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) })
export const updateNote = (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteNote = (id) => request(`/notes/${id}`, { method: 'DELETE' })

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks = () => request('/tasks')
export const createTask = (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) })
export const updateTask = (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' })

// ─── Schedule ────────────────────────────────────────────────────────────────
export const getSchedule = () => request('/schedule')
export const createEvent = (data) => request('/schedule', { method: 'POST', body: JSON.stringify(data) })
export const updateEvent = (id, data) => request(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteEvent = (id) => request(`/schedule/${id}`, { method: 'DELETE' })
