import express from 'express'
import Naloga from '../models/Naloga.js'

const router = express.Router()

// GET vse naloge
router.get('/', async (req, res) => {
  try {
    const naloge = await Naloga.find().sort({ ustvarjena: -1 })
    res.json(naloge)
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

// POST ustvari nalogo
router.post('/', async (req, res) => {
  try {
    const naloga = await Naloga.create(req.body)
    res.status(201).json(naloga)
  } catch (err) {
    res.status(400).json({ napaka: err.message })
  }
})

// PUT posodobi nalogo (toggle opravljeno, uredi polja)
router.put('/:id', async (req, res) => {
  try {
    const naloga = await Naloga.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!naloga) return res.status(404).json({ napaka: 'Naloga ni bila najdena' })
    res.json(naloga)
  } catch (err) {
    res.status(400).json({ napaka: err.message })
  }
})

// DELETE izbriši nalogo
router.delete('/:id', async (req, res) => {
  try {
    const naloga = await Naloga.findByIdAndDelete(req.params.id)
    if (!naloga) return res.status(404).json({ napaka: 'Naloga ni bila najdena' })
    res.json({ sporocilo: 'Izbrisano' })
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

export default router
