import express from 'express'
import UrniskiDogodek from '../models/UrniskiDogodek.js'

const router = express.Router()

// GET vsi urniški dogodki
router.get('/', async (req, res) => {
  try {
    const dogodki = await UrniskiDogodek.find().sort({ dan: 1, ura: 1 })
    res.json(dogodki)
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

// POST ustvari urniški vnos
router.post('/', async (req, res) => {
  try {
    const dogodek = await UrniskiDogodek.create(req.body)
    res.status(201).json(dogodek)
  } catch (err) {
    res.status(400).json({ napaka: err.message })
  }
})

// PUT posodobi urniški vnos
router.put('/:id', async (req, res) => {
  try {
    const dogodek = await UrniskiDogodek.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!dogodek) return res.status(404).json({ napaka: 'Urniški vnos ni bil najden' })
    res.json(dogodek)
  } catch (err) {
    res.status(400).json({ napaka: err.message })
  }
})

// DELETE izbriši urniški vnos
router.delete('/:id', async (req, res) => {
  try {
    const dogodek = await UrniskiDogodek.findByIdAndDelete(req.params.id)
    if (!dogodek) return res.status(404).json({ napaka: 'Urniški vnos ni bil najden' })
    res.json({ sporocilo: 'Izbrisano' })
  } catch (err) {
    res.status(500).json({ napaka: err.message })
  }
})

export default router
