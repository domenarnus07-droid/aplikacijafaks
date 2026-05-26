import express from 'express'
import Zapisek from '../models/Zapisek.js'

const router = express.Router()

// GET vsi zapiski
router.get('/', async (req, res) => {
  try {
    const zapiski = await Zapisek.find().sort({ posodobljen: -1 })
    res.json(zapiski)
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

// POST ustvari zapisek
router.post('/', async (req, res) => {
  try {
    const zapisek = await Zapisek.create(req.body)
    res.status(201).json(zapisek)
  } catch (err) {
    res.status(400).json({ napaka: err.message })
  }
})

// PUT posodobi zapisek
router.put('/:id', async (req, res) => {
  try {
    const zapisek = await Zapisek.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!zapisek) return res.status(404).json({ napaka: 'Zapisek ni bil najden' })
    res.json(zapisek)
  } catch (err) {
    res.status(400).json({ napaka: err.message })
  }
})

// DELETE izbriši zapisek
router.delete('/:id', async (req, res) => {
  try {
    const zapisek = await Zapisek.findByIdAndDelete(req.params.id)
    if (!zapisek) return res.status(404).json({ napaka: 'Zapisek ni bil najden' })
    res.json({ sporocilo: 'Izbrisano' })
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

export default router
