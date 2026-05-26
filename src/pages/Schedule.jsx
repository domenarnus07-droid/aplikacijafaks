import { useState, useEffect } from 'react'
import { getSchedule, createEvent, updateEvent, deleteEvent } from '../api.js'
import { useToast } from '../App.jsx'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const HOURS = Array.from({ length: 9 }, (_, i) => i + 8)  // 8..16

const COLOR_OPTIONS = [
  '#2563EB', '#7C3AED', '#DB2777', '#059669',
  '#D97706', '#DC2626', '#0891B2', '#65A30D',
]

const EMPTY_FORM = { title: '', day: 0, hour: 8, duration: 1, color: '#2563EB', subject: '' }

function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState(event ? { ...event } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast('Title is required', 'error'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{event ? 'Edit Event' : 'Add Event'}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label className="form-label">Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Networking Lecture" />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Day</label>
              <select className="input select" value={form.day} onChange={e => set('day', +e.target.value)}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Hour</label>
              <select className="input select" value={form.hour} onChange={e => set('hour', +e.target.value)}>
                {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Duration (h)</label>
              <select className="input select" value={form.duration} onChange={e => set('duration', +e.target.value)}>
                {[1,2,3,4].map(d => <option key={d} value={d}>{d}h</option>)}
              </select>
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Subject</label>
              <input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Subject name" />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid var(--text1)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '…' : event ? 'Save Changes' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Schedule() {
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [clickSlot, setClickSlot] = useState(null)  // { day, hour }

  useEffect(() => {
    getSchedule()
      .then(setEvents)
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    if (modal && modal._id) {
      const updated = await updateEvent(modal._id, form)
      setEvents(es => es.map(e => e._id === updated._id ? updated : e))
      toast('Event updated')
    } else {
      const created = await createEvent(form)
      setEvents(es => [...es, created])
      toast('Event added')
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this event?')) return
    try {
      await deleteEvent(id)
      setEvents(es => es.filter(e => e._id !== id))
      toast('Event deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  function openNew(day, hour) {
    setClickSlot({ day, hour })
    setModal({ day, hour })
  }

  // Build lookup map: `${day}-${hour}` -> event[]
  const eventMap = {}
  events.forEach(ev => {
    for (let i = 0; i < ev.duration; i++) {
      const k = `${ev.day}-${ev.hour + i}`
      if (!eventMap[k]) eventMap[k] = []
      eventMap[k].push(ev)
    }
  })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Weekly Schedule</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ Add Event</button>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: 20 }}>
        Click any empty slot to add an event there.
      </p>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="schedule-wrap">
          <div className="schedule-grid">
            {/* Header row */}
            <div className="sch-header" />
            {DAYS.map(d => (
              <div key={d} className="sch-header">{d}</div>
            ))}

            {/* Hour rows */}
            {HOURS.map(hour => (
              <>
                <div key={`t-${hour}`} className="sch-time">{hour}:00</div>
                {DAYS.map((_, day) => {
                  const key = `${day}-${hour}`
                  const cellEvents = eventMap[key] || []
                  // Only show event block at its starting hour
                  const startEvents = cellEvents.filter(ev => ev.hour === hour)

                  return (
                    <div
                      key={key}
                      className="sch-cell"
                      onClick={() => !startEvents.length && openNew(day, hour)}
                      style={{ cursor: startEvents.length ? 'default' : 'pointer' }}
                    >
                      {startEvents.map(ev => (
                        <div
                          key={ev._id}
                          className="sch-event"
                          style={{
                            background: ev.color,
                            height: `calc(${ev.duration * 100}% + ${(ev.duration - 1) * 2}px)`,
                            inset: '2px',
                          }}
                          onClick={e => { e.stopPropagation(); setModal(ev) }}
                        >
                          {ev.title}
                          {ev.subject && <span>{ev.subject}</span>}
                          <button
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              background: 'rgba(0,0,0,.25)', border: 'none',
                              borderRadius: 4, cursor: 'pointer', color: '#fff',
                              fontSize: '.65rem', padding: '1px 4px',
                            }}
                            onClick={e => handleDelete(ev._id, e)}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {modal !== null && (
        <EventModal
          event={modal && modal._id ? modal : (clickSlot ? { ...EMPTY_FORM, ...clickSlot } : null)}
          onClose={() => { setModal(null); setClickSlot(null) }}
          onSave={handleSave}
        />
      )}
    </>
  )
}
