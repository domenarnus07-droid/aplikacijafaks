const router = require('express').Router()
const ScheduleEvent = require('../models/ScheduleEvent')

// GET all events
router.get('/', async (_req, res, next) => {
  try {
    const events = await ScheduleEvent.find().sort({ day: 1, hour: 1 })
    res.json(events)
  } catch (err) {
    next(err)
  }
})

// POST create event
router.post('/', async (req, res, next) => {
  try {
    const event = await ScheduleEvent.create(req.body)
    res.status(201).json(event)
  } catch (err) {
    next(err)
  }
})

// PUT update event
router.put('/:id', async (req, res, next) => {
  try {
    const event = await ScheduleEvent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!event) return res.status(404).json({ error: 'Event not found' })
    res.json(event)
  } catch (err) {
    next(err)
  }
})

// DELETE event
router.delete('/:id', async (req, res, next) => {
  try {
    const event = await ScheduleEvent.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })
    res.json({ message: 'Event deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
