import { useState, useEffect } from 'react'
import { getNotes, createNote, updateNote, deleteNote } from '../api.js'
import { useToast } from '../App.jsx'

const TAG_OPTIONS = ['blue', 'green', 'amber']

const EMPTY_FORM = { title: '', content: '', tag: 'blue', subject: '' }

function NoteModal({ note, onClose, onSave }) {
  const [form, setForm] = useState(note ? { ...note } : EMPTY_FORM)
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
        <h2 className="modal-title">{note ? 'Edit Note' : 'New Note'}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label className="form-label">Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Note title…" />
          </div>
          <div className="form-row">
            <label className="form-label">Content</label>
            <textarea className="input textarea note-editor" value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your notes here…" />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Tag</label>
              <select className="input select" value={form.tag} onChange={e => set('tag', e.target.value)}>
                {TAG_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="form-label">Subject</label>
              <input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Networking" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '…' : note ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Notes() {
  const toast = useToast()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)  // null | 'new' | noteObject

  useEffect(() => {
    getNotes()
      .then(setNotes)
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    if (modal && modal._id) {
      const updated = await updateNote(modal._id, form)
      setNotes(ns => ns.map(n => n._id === updated._id ? updated : n))
      toast('Note updated')
    } else {
      const created = await createNote(form)
      setNotes(ns => [created, ...ns])
      toast('Note created')
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this note?')) return
    try {
      await deleteNote(id)
      setNotes(ns => ns.filter(n => n._id !== id))
      toast('Note deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const filtered = notes
    .filter(n => filter === 'all' || n.tag === filter)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Notes</h1>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          + New Note
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Search notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filters" style={{ marginBottom: 0 }}>
          {['all', ...TAG_OPTIONS].map(t => (
            <button
              key={t}
              className={`filter-btn ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>No notes yet. Create your first note!</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filtered.map(n => (
            <div key={n._id} className="note-card" onClick={() => setModal(n)}>
              <div className="note-card-top">
                <span className="note-card-title">{n.title}</span>
                <button
                  className="btn-icon"
                  onClick={e => handleDelete(n._id, e)}
                  title="Delete"
                  style={{ flexShrink: 0 }}
                >
                  🗑
                </button>
              </div>
              {n.content && <p className="note-card-content">{n.content}</p>}
              <div className="note-card-footer">
                <span className={`chip chip-${n.tag}`}>{n.tag}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  {n.subject && <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{n.subject}</span>}
                  <span className="note-date">
                    {new Date(n.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <NoteModal
          note={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
