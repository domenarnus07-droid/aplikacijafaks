import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    tag: { type: String, enum: ['blue', 'green', 'amber'], default: 'blue' },
    subject: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('Note', noteSchema)
