import { useState, useEffect } from 'react'
import { getNotes, getTasks, getSchedule } from '../api'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function Dashboard({ setPage }) {
  const [notes, setNotes] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getNotes(), getTasks(), getSchedule()])
      .then(([n, t, e]) => {
        setNotes(n || [])
        setTasks(t || [])
        setEvents(e || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const today = new Date().getDay() // 0=Sun, 1=Mon...
  const todayIdx = today === 0 || today === 6 ? -1 : today - 1
  const todayEvents = events.filter(e => e.day === todayIdx)
  const pendingTasks = tasks.filter(t => !t.done)
  const doneTasks = tasks.filter(t => t.done)
  const progress = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, student! 👋</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <StatCard icon="📝" label="Total notes" value={notes.length} color="blue" onClick={() => setPage('notes')} />
        <StatCard icon="✅" label="Tasks done" value={`${doneTasks.length}/${tasks.length}`} color="green" onClick={() => setPage('tasks')} />
        <StatCard icon="📅" label="Classes today" value={todayEvents.length} color="amber" onClick={() => setPage('schedule')} />
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Task progress */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text1)' }}>Task Progress</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('tasks')}>View all →</button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>{doneTasks.length} of {tasks.length} completed</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>{progress}%</span>
            </div>
            <div style={{ height:8, background:'var(--bg2)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'var(--blue)', borderRadius:99, transition:'width .5s ease' }} />
            </div>
          </div>
          {pendingTasks.slice(0, 4).map(t => (
            <div key={t._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border-light)' }}>
              <span style={{ fontSize:12, color: t.priority==='red'?'var(--red)':t.priority==='amber'?'var(--amber)':'var(--green)', fontWeight:700 }}>●</span>
              <span style={{ fontSize:14, color:'var(--text1)', flex:1 }}>{t.text}</span>
              {t.subject && <span className="badge badge-blue" style={{ fontSize:11 }}>{t.subject}</span>}
            </div>
          ))}
          {pendingTasks.length === 0 && <p style={{ color:'var(--text3)', fontSize:14, textAlign:'center', padding:'16px 0' }}>All tasks completed! 🎉</p>}
        </div>

        {/* Today's schedule */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text1)' }}>Today — {todayIdx >= 0 ? DAYS[todayIdx] : 'Weekend'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('schedule')}>View week →</button>
          </div>
          {todayIdx < 0 && <p style={{ color:'var(--text3)', fontSize:14, textAlign:'center', padding:'16px 0' }}>It's the weekend! 🎉 Enjoy your rest.</p>}
          {todayIdx >= 0 && todayEvents.length === 0 && <p style={{ color:'var(--text3)', fontSize:14, textAlign:'center', padding:'16px 0' }}>No classes scheduled today.</p>}
          {todayEvents.sort((a,b) => a.hour-b.hour).map(e => (
            <div key={e._id} style={{ display:'flex', gap:12, alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-light)' }}>
              <div style={{ width:52, textAlign:'center', background:'var(--bg2)', borderRadius:8, padding:'4px 0' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>{String(e.hour).padStart(2,'0')}:00</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text1)' }}>{e.title}</div>
                {e.subject && <div style={{ fontSize:12, color:'var(--text2)' }}>{e.subject}</div>}
              </div>
              <div style={{ width:8, height:8, borderRadius:'50%', background: e.color || 'var(--blue)' }} />
            </div>
          ))}
        </div>

        {/* Recent notes */}
        <div className="card" style={{ gridColumn:'1 / -1' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text1)' }}>Recent Notes</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('notes')}>View all →</button>
          </div>
          {notes.length === 0 && <p style={{ color:'var(--text3)', fontSize:14, textAlign:'center', padding:'16px 0' }}>No notes yet. Start writing!</p>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
            {notes.slice(0, 6).map(n => (
              <div key={n._id} style={{ padding:'14px', borderRadius:'var(--radius-sm)', background:'var(--bg0)', border:'1px solid var(--border-light)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--text1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{n.title}</span>
                  <span className={`badge badge-${n.tag}`} style={{ marginLeft:8, fontSize:11 }}>{n.tag}</span>
                </div>
                <p style={{ fontSize:13, color:'var(--text2)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{n.content || 'No content'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div className="card" style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:16 }} onClick={onClick}>
      <div style={{ width:48, height:48, borderRadius:12, background:`var(--${color}-light, var(--blue-light))`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
      <div>
        <div style={{ fontSize:26, fontWeight:700, color:`var(--${color}, var(--blue))`, letterSpacing:-1 }}>{value}</div>
        <div style={{ fontSize:13, color:'var(--text2)', fontWeight:500 }}>{label}</div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
