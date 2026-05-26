const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['red', 'amber', 'green'],
      default: 'amber',
    },
    dueDate: { type: Date, default: null },
    subject: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Task', TaskSchema)
