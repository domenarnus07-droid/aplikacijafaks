import { useState, useEffect } from 'react'
import { getSchedule, createEvent, updateEvent, deleteEvent } from '../api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8) // 8..17
const CELL_H = 64 // px per hour

const COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#DB2777', '#65A30D',
]

const empty = { title: '', day: 0, hour: 8, duration: 1, color: COLORS[0], subject: '' }

export default function Schedule() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSchedule()
      .then(d => setEvents(d || []))
      .finally(() => setLoading(false))
  }, [])

  function openNew(day, hour) {
    setForm({ ...empty, day: day ?? 0, hour: hour ?? 8 })
    setModal('new')
  }

  function openEdit(ev) {
    setForm({ title: ev.title, day: ev.day, hour: ev.hour, duration: ev.duration, color: ev.color, subject: ev.subject || '' })
    setModal(ev)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (modal === 'new') {
        const created = await createEvent({ ...form, day: Number(form.day), hour: Number(form.hour), duration: Number(form.duration) })
        setEvents(e => [...e, created])
      } else {
        const updated = await updateEvent(modal._id, { ...form, day: Number(form.day), hour: Number(form.hour), duration: Number(form.duration) })
        setEvents(e => e.map(x => x._id === updated._id ? updated : x))
      }
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return
    await deleteEvent(id)
    setEvents(e => e.filter(x => x._id !== id))
  }

  if (loading) return <div className="spinner" />

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Schedule</h1>
          <p className="page-subtitle">{events.length} event{events.length !== 1 ? 's' : ''} this week</p>
        </div>
        <button className="btn btn-primary" onClick={() => openNew()}>+ Add event</button>
      </div>

      {/* Grid */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:`52px repeat(5, 1fr)`, borderBottom:'1px solid var(--border-light)' }}>
          <div style={{ padding:'12px 8px', background:'var(--bg2)' }} />
          {DAYS.map((d, i) => (
            <div
              key={d}
              style={{ padding:'12px 10px', background:'var(--bg2)', borderLeft:'1px solid var(--border-light)', textAlign:'center', cursor:'pointer', transition:'background var(--transition)' }}
              onClick={() => openNew(i, 8)}
              title="Click to add event"
            >
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text1)' }}>{d.slice(0,3)}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div style={{ position:'relative', display:'grid', gridTemplateColumns:`52px repeat(5, 1fr)` }}>
          {/* Hour labels */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            {HOURS.map(h => (
              <div key={h} style={{ height: CELL_H, borderBottom:'1px solid var(--border-light)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:4 }}>
                <span style={{ fontSize:11, color:'var(--text3)', fontWeight:600 }}>{String(h).padStart(2,'0')}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((_, dayIdx) => (
            <div
              key={dayIdx}
              style={{ borderLeft:'1px solid var(--border-light)', position:'relative', cursor:'pointer' }}
              onClick={() => openNew(dayIdx, 8)}
            >
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{ height: CELL_H, borderBottom:'1px solid var(--border-light)', transition:'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={e => { e.stopPropagation(); openNew(dayIdx, h) }}
                />
              ))}

              {/* Events */}
              {events.filter(e => e.day === dayIdx).map(ev => {
                const top = (ev.hour - 8) * CELL_H
                const height = Math.max(ev.duration, 0.5) * CELL_H - 4
                return (
                  <div
                    key={ev._id}
                    onClick={e => { e.stopPropagation(); openEdit(ev) }}
                    style={{
                      position:'absolute',
                      top: top + 2,
                      left: 4,
                      right: 4,
                      height,
                      background: ev.color || 'var(--blue)',
                      borderRadius: 8,
                      padding:'6px 10px',
                      cursor:'pointer',
                      overflow:'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,.2)',
                      transition:'transform .15s, box-shadow .15s',
                      zIndex: 2,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.2)' }}
                  >
                    <div style={{ fontSize:12, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                    {ev.subject && <div style={{ fontSize:11, color:'rgba(255,255,255,.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.subject}</div>}
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.7)' }}>{String(ev.hour).padStart(2,'0')}:00 – {String(ev.hour + ev.duration).padStart(2,'0')}:00</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop:16, display:'flex', gap:12, flexWrap:'wrap' }}>
        {events.map(ev => ev.subject).filter((s, i, a) => s && a.indexOf(s) === i).map(subject => {
          const ev = events.find(e => e.subject === subject)
          return (
            <div key={subject} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background: ev?.color || 'var(--blue)' }} />
              <span style={{ fontSize:13, color:'var(--text2)' }}>{subject}</span>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'new' ? 'Add event' : 'Edit event'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Mathematics lecture" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select className="form-select" value={form.day} onChange={e => setForm(f => ({...f, day: e.target.value}))}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} placeholder="e.g. Mathematics" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start hour</label>
                  <select className="form-select" value={form.hour} onChange={e => setForm(f => ({...f, hour: e.target.value}))}>
                    {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (hrs)</label>
                  <select className="form-select" value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))}>
                    {[1,1.5,2,2.5,3,4].map(d => <option key={d} value={d}>{d}h</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      style={{ width:28, height:28, borderRadius:'50%', background:c, border: form.color===c ? '3px solid var(--text1)' : '2px solid transparent', cursor:'pointer', transition:'transform .15s' }}
                      onClick={() => setForm(f => ({...f, color: c}))}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {modal !== 'new' && (
                <button className="btn btn-danger" onClick={() => { handleDelete(modal._id); setModal(null) }} style={{ marginRight:'auto' }}>Delete</button>
              )}
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving…' : modal === 'new' ? 'Add event' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
