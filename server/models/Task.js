import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    priority: { type: String, enum: ['red', 'amber', 'green'], default: 'amber' },
    dueDate: { type: Date, default: null },
    subject: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('Task', taskSchema)
