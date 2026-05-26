const mongoose = require('mongoose')

const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    tag: {
      type: String,
      enum: ['blue', 'green', 'amber'],
      default: 'blue',
    },
    subject: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Note', NoteSchema)
