require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connect } = require('./db')

const notesRouter = require('./routes/notes')
const tasksRouter = require('./routes/tasks')
const scheduleRouter = require('./routes/schedule')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/notes', notesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/schedule', scheduleRouter)

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Express server running on http://localhost:${PORT}`)
  })
})
