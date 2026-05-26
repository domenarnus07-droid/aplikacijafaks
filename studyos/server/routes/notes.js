const router = require('express').Router()
const Note = require('../models/Note')

// GET all notes
router.get('/', async (_req, res, next) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 })
    res.json(notes)
  } catch (err) {
    next(err)
  }
})

// POST create note
router.post('/', async (req, res, next) => {
  try {
    const note = await Note.create(req.body)
    res.status(201).json(note)
  } catch (err) {
    next(err)
  }
})

// PUT update note
router.put('/:id', async (req, res, next) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json(note)
  } catch (err) {
    next(err)
  }
})

// DELETE note
router.delete('/:id', async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id)
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json({ message: 'Note deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
