import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Notes from './pages/Notes'
import Schedule from './pages/Schedule'
import Tasks from './pages/Tasks'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'notes',     label: 'Notes',     icon: '📝' },
  { id: 'tasks',     label: 'Tasks',     icon: '✅' },
  { id: 'schedule',  label: 'Schedule',  icon: '📅' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('studyos-dark') === 'true'
  })

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('studyos-dark', dark)
  }, [dark])

  const pages = { dashboard: <Dashboard setPage={setPage} />, notes: <Notes />, tasks: <Tasks />, schedule: <Schedule /> }

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📚</div>
          <span className="sidebar-logo-text">StudyOS</span>
        </div>

        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`nav-item${page === id ? ' active' : ''}`}
            onClick={() => setPage(id)}
          >
            <span className="nav-item-icon">{icon}</span>
            {label}
          </button>
        ))}

        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDark(d => !d)}>
            <span>{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </nav>

      {/* ── Page ── */}
      <main className="main-content">
        {pages[page]}
      </main>
    </div>
  )
}
