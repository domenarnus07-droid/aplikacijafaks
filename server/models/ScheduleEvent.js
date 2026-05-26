import mongoose from 'mongoose'

const scheduleEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  day: { type: Number, required: true, min: 0, max: 4 },   // 0=Mon … 4=Fri
  hour: { type: Number, required: true, min: 8, max: 16 },
  duration: { type: Number, default: 1, min: 1, max: 8 },  // hours
  color: { type: String, default: '#2563EB' },
  subject: { type: String, default: '' },
})

export default mongoose.model('ScheduleEvent', scheduleEventSchema)
