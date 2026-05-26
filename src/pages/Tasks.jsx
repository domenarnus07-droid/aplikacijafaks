import { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../api.js'
import { useToast } from '../App.jsx'

const PRIORITY_OPTIONS = ['red', 'amber', 'green']
const PRIORITY_LABEL = { red: '🔴 High', amber: '🟡 Medium', green: '🟢 Low' }
const EMPTY_FORM = { text: '', priority: 'amber', dueDate: '', subject: '' }

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task ? {
    text: task.text,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    subject: task.subject || '',
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.text.trim()) { toast('Task text is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, dueDate: form.dueDate || null }
      await onSave(payload)
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
        <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label className="form-label">Task *</label>
            <input className="input" value={form.text} onChange={e => set('text', e.target.value)} placeholder="What needs to be done?" />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select className="input select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Subject</label>
            <input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Maths" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '…' : task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tasks() {
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleDone(task) {
    try {
      const updated = await updateTask(task._id, { done: !task.done })
      setTasks(ts => ts.map(t => t._id === updated._id ? updated : t))
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleSave(form) {
    if (modal && modal._id) {
      const updated = await updateTask(modal._id, form)
      setTasks(ts => ts.map(t => t._id === updated._id ? updated : t))
      toast('Task updated')
    } else {
      const created = await createTask(form)
      setTasks(ts => [created, ...ts])
      toast('Task added')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(id)
      setTasks(ts => ts.filter(t => t._id !== id))
      toast('Task deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'pending') return !t.done
    if (filter === 'done') return t.done
    return t.priority === filter
  })

  const pending = tasks.filter(t => !t.done).length
  const done    = tasks.filter(t => t.done).length

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Task</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
          {pending} pending · {done} done
        </span>
      </div>

      <div className="filters">
        {['all', 'pending', 'done', 'red', 'amber', 'green'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'red' ? '🔴 High' : f === 'amber' ? '🟡 Med' : f === 'green' ? '🟢 Low' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <p>No tasks here. Add one above!</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filtered.map(t => (
            <div key={t._id} className={`task-item ${t.done ? 'done' : ''}`}>
              <button
                className={`task-check ${t.done ? 'checked' : ''}`}
                onClick={() => toggleDone(t)}
                title={t.done ? 'Mark as pending' : 'Mark as done'}
              >
                {t.done && <span style={{ color: '#fff', fontSize: '.7rem' }}>✓</span>}
              </button>
              <span className="task-text">{t.text}</span>
              <div className="task-meta">
                <span className={`priority-dot ${t.priority}`} title={t.priority} />
                {t.subject && <span>{t.subject}</span>}
                {t.dueDate && (
                  <span>{new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                )}
              </div>
              <button className="btn-icon" onClick={() => setModal(t)} title="Edit">✏️</button>
              <button className="btn-icon" onClick={() => handleDelete(t._id)} title="Delete">🗑</button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
