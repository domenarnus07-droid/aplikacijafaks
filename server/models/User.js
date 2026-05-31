import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  geslo:    { type: String, required: true },
  vloga:    { type: String, enum: ['admin', 'uporabnik'], default: 'uporabnik' },
  ustvarjen: { type: Date, default: Date.now },
})

UserSchema.pre('save', async function () {
  if (this.isModified('geslo')) {
    this.geslo = await bcrypt.hash(this.geslo, 12)
  }
})

UserSchema.methods.preveriGeslo = function (geslo) {
  return bcrypt.compare(geslo, this.geslo)
}

export default mongoose.model('User', UserSchema)
