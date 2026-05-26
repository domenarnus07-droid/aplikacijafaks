import express from 'express'
import ScheduleEvent from '../models/ScheduleEvent.js'

const router = express.Router()

// GET all events
router.get('/', async (req, res) => {
  try {
    const events = await ScheduleEvent.find().sort({ day: 1, hour: 1 })
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create event
router.post('/', async (req, res) => {
  try {
    const event = await ScheduleEvent.create(req.body)
    res.status(201).json(event)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT update event
router.put('/:id', async (req, res) => {
  try {
    const event = await ScheduleEvent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!event) return res.status(404).json({ error: 'Event not found' })
    res.json(event)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    const event = await ScheduleEvent.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
