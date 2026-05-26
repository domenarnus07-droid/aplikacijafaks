import mongoose from 'mongoose'

const nalogaSchema = new mongoose.Schema({
  besedilo:    { type: String, required: true, trim: true },
  opravljeno:  { type: Boolean, default: false },
  prioriteta:  { type: String, enum: ['visoka', 'srednja', 'nizka'], default: 'srednja' },
  rok:         { type: Date, default: null },
  predmet:     { type: String, default: '' },
  ustvarjena:  { type: Date, default: Date.now },
  pripeto:     { type: Boolean, default: false },
  ponavljanje: { type: String, enum: ['nikoli','dnevno','tedensko','mesecno'], default: 'nikoli' },
  vTeku:       { type: Boolean, default: false },
  tagi:        [String],
})

export default mongoose.model('Naloga', nalogaSchema)
