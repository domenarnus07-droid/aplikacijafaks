import { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../api'

const PRIORITIES = ['red', 'amber', 'green']
const PRIORITY_LABEL = { red: '🔴 High', amber: '🟡 Medium', green: '🟢 Low' }
const empty = { text: '', priority: 'amber', dueDate: '', subject: '' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all') // all | pending | done
  const [search, setSearch] = useState('')

  useEffect(() => {
    getTasks()
      .then(d => setTasks(d || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tasks.filter(t => {
    const matchFilter = filter === 'all' || (filter === 'pending' && !t.done) || (filter === 'done' && t.done)
    const q = search.toLowerCase()
    const matchSearch = !q || t.text.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  // Sort: undone first by priority weight, then done
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const pw = { red: 0, amber: 1, green: 2 }
    return (pw[a.priority] ?? 1) - (pw[b.priority] ?? 1)
  })

  function openNew() { setForm(empty); setModal('new') }
  function openEdit(t) {
    setForm({ text: t.text, priority: t.priority, dueDate: t.dueDate ? t.dueDate.slice(0,10) : '', subject: t.subject || '' })
    setModal(t)
  }

  async function handleSave() {
    if (!form.text.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, dueDate: form.dueDate || null }
      if (modal === 'new') {
        const created = await createTask(payload)
        setTasks(t => [created, ...t])
      } else {
        const updated = await updateTask(modal._id, payload)
        setTasks(t => t.map(x => x._id === updated._id ? updated : x))
      }
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(task) {
    const updated = await updateTask(task._id, { done: !task.done })
    setTasks(t => t.map(x => x._id === updated._id ? updated : x))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    await deleteTask(id)
    setTasks(t => t.filter(x => x._id !== id))
  }

  const done = tasks.filter(t => t.done).length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  if (loading) return <div className="spinner" />

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{done}/{tasks.length} completed</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New task</button>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="card" style={{ marginBottom:20, padding:'14px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'var(--text2)', fontWeight:500 }}>Overall progress</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>{progress}%</span>
          </div>
          <div style={{ height:8, background:'var(--bg2)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'var(--blue)', borderRadius:99, transition:'width .5s ease' }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input
          className="form-input"
          placeholder="🔍 Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:200 }}
        />
        {['all', 'pending', 'done'].map(f => (
          <button
            key={f}
            className="btn btn-ghost btn-sm"
            style={filter === f ? { background:'var(--blue-light)', color:'var(--blue)', borderColor:'var(--blue)' } : {}}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {sorted.map(t => (
          <div key={t._id} className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14, opacity: t.done ? .6 : 1 }}>
            {/* Checkbox */}
            <button
              style={{ width:22, height:22, borderRadius:6, border:`2px solid ${t.done ? 'var(--green)' : 'var(--border)'}`, background: t.done ? 'var(--green)' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}
              onClick={() => handleToggle(t)}
            >
              {t.done && <span style={{ color:'#fff', fontSize:13 }}>✓</span>}
            </button>

            {/* Priority dot */}
            <span style={{ color: t.priority==='red'?'var(--red)':t.priority==='amber'?'var(--amber)':'var(--green)', fontSize:10, fontWeight:900, flexShrink:0 }}>●</span>

            {/* Text */}
            <div style={{ flex:1, overflow:'hidden' }}>
              <span style={{ fontSize:15, fontWeight:500, color:'var(--text1)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              <div style={{ display:'flex', gap:8, marginTop:3, alignItems:'center' }}>
                {t.subject && <span className="badge badge-blue" style={{ fontSize:11 }}>{t.subject}</span>}
                {t.dueDate && (
                  <span style={{ fontSize:12, color: isOverdue(t.dueDate) && !t.done ? 'var(--red)' : 'var(--text3)' }}>
                    📅 {new Date(t.dueDate).toLocaleDateString('en-GB')}
                    {isOverdue(t.dueDate) && !t.done ? ' (overdue)' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(t)}>✏️</button>
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(t._id)}>🗑️</button>
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text">{tasks.length === 0 ? 'No tasks yet — add your first!' : 'No tasks match your filter.'}</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'new' ? 'New task' : 'Edit task'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Task *</label>
                <input className="form-input" value={form.text} onChange={e => setForm(f => ({...f, text: e.target.value}))} placeholder="What needs to be done?" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} placeholder="e.g. Mathematics" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.text.trim()}>
                {saving ? 'Saving…' : modal === 'new' ? 'Add task' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}
