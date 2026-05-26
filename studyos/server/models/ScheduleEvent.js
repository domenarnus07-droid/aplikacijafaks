const mongoose = require('mongoose')

const ScheduleEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  day: { type: Number, min: 0, max: 4, required: true }, // 0=Mon, 4=Fri
  hour: { type: Number, min: 8, max: 16, required: true },
  duration: { type: Number, default: 1, min: 1, max: 8 }, // in hours
  color: { type: String, default: '#2563EB' },
  subject: { type: String, trim: true, default: '' },
})

module.exports = mongoose.model('ScheduleEvent', ScheduleEventSchema)
