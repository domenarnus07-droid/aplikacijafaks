import mongoose from 'mongoose'

const zapisekSchema = new mongoose.Schema(
  {
    naslov:       { type: String, required: true, trim: true },
    vsebina:      { type: String, default: '' },
    oznaka:       { type: String, enum: ['modra', 'zelena', 'rumena'], default: 'modra' },
    predmet:      { type: String, default: '' },
    barvaOzadja:  { type: String, default: '' },
    pripeto:      { type: Boolean, default: false },
    tagi:         [String],
  },
  { timestamps: { createdAt: 'ustvarjen', updatedAt: 'posodobljen' } }
)

export default mongoose.model('Zapisek', zapisekSchema)
