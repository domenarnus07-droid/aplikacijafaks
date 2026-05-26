import { useState, useEffect } from 'react'
import { getNotes, createNote, updateNote, deleteNote } from '../api'

const TAGS = ['blue', 'green', 'amber']
const empty = { title: '', content: '', tag: 'blue', subject: '' }

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | note object
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('all')
  const [activeNote, setActiveNote] = useState(null) // for reading

  useEffect(() => {
    getNotes()
      .then(d => setNotes(d || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = notes.filter(n => {
    const matchTag = filterTag === 'all' || n.tag === filterTag
    const q = search.toLowerCase()
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) || n.subject?.toLowerCase().includes(q)
    return matchTag && matchSearch
  })

  function openNew() {
    setForm(empty)
    setModal('new')
  }

  function openEdit(note) {
    setForm({ title: note.title, content: note.content, tag: note.tag, subject: note.subject || '' })
    setModal(note)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (modal === 'new') {
        const created = await createNote(form)
        setNotes(n => [created, ...n])
      } else {
        const updated = await updateNote(modal._id, form)
        setNotes(n => n.map(x => x._id === updated._id ? updated : x))
        if (activeNote?._id === updated._id) setActiveNote(updated)
      }
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this note?')) return
    await deleteNote(id)
    setNotes(n => n.filter(x => x._id !== id))
    if (activeNote?._id === id) setActiveNote(null)
  }

  if (loading) return <div className="spinner" />

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-subtitle">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New note</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input
          className="form-input"
          placeholder="🔍 Search notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:200 }}
        />
        {['all', ...TAGS].map(t => (
          <button
            key={t}
            className={`btn btn-ghost btn-sm${filterTag === t ? ' active' : ''}`}
            style={filterTag === t ? { background:'var(--blue-light)', color:'var(--blue)', borderColor:'var(--blue)' } : {}}
            onClick={() => setFilterTag(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Two-panel layout when note is open */}
      {activeNote ? (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start' }}>
          {/* List panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(n => (
              <NoteCard
                key={n._id}
                note={n}
                active={activeNote?._id === n._id}
                onOpen={() => setActiveNote(n)}
                onEdit={() => openEdit(n)}
                onDelete={() => handleDelete(n._id)}
              />
            ))}
            {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No notes found</div></div>}
          </div>
          {/* Detail panel */}
          <div className="card" style={{ minHeight: 400 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text1)', marginBottom:4 }}>{activeNote.title}</h2>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span className={`badge badge-${activeNote.tag}`}>{activeNote.tag}</span>
                  {activeNote.subject && <span style={{ fontSize:13, color:'var(--text2)' }}>{activeNote.subject}</span>}
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{new Date(activeNote.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(activeNote)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(activeNote._id)}>Delete</button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setActiveNote(null)}>✕</button>
              </div>
            </div>
            <div style={{ fontSize:15, color:'var(--text1)', lineHeight:1.7, whiteSpace:'pre-wrap', minHeight:200 }}>
              {activeNote.content || <span style={{ color:'var(--text3)' }}>No content.</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map(n => (
            <NoteCard
              key={n._id}
              note={n}
              onOpen={() => setActiveNote(n)}
              onEdit={() => openEdit(n)}
              onDelete={() => handleDelete(n._id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn:'1/-1' }}>
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">{notes.length === 0 ? 'No notes yet — create your first!' : 'No notes match your search.'}</div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'new' ? 'New note' : 'Edit note'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Note title" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tag</label>
                  <select className="form-select" value={form.tag} onChange={e => setForm(f => ({...f, tag: e.target.value}))}>
                    {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} placeholder="e.g. Mathematics" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-textarea" value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Write your note here…" style={{ minHeight:140 }} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving…' : modal === 'new' ? 'Create note' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, active, onOpen, onEdit, onDelete }) {
  return (
    <div
      className="card"
      style={{ cursor:'pointer', borderColor: active ? 'var(--blue)' : undefined, position:'relative' }}
      onClick={onOpen}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text1)', flex:1, marginRight:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</h3>
        <span className={`badge badge-${note.tag}`} style={{ fontSize:11 }}>{note.tag}</span>
      </div>
      {note.subject && <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>{note.subject}</div>}
      <p style={{ fontSize:13, color:'var(--text2)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', marginBottom:12 }}>
        {note.content || 'No content'}
      </p>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:'var(--text3)' }}>{new Date(note.updatedAt).toLocaleDateString()}</span>
        <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title="Edit">✏️</button>
          <button className="btn btn-danger btn-icon btn-sm" onClick={onDelete} title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  )
}
