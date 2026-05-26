import mongoose from 'mongoose'

const urniskiDogodekSchema = new mongoose.Schema({
  naslov:   { type: String, required: true, trim: true },
  dan:      { type: Number, required: true, min: 0, max: 4 },   // 0=pon … 4=pet
  ura:      { type: Number, required: true, min: 8, max: 16 },
  trajanje: { type: Number, default: 1, min: 1, max: 8 },       // v urah
  barva:    { type: String, default: '#2563EB' },
  predmet:  { type: String, default: '' },
})

export default mongoose.model('UrniskiDogodek', urniskiDogodekSchema)
