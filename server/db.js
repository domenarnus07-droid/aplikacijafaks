import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studyos'

// Prepreči crash pri napakah povezave
mongoose.connection.on('error', (err) => {
  console.warn('⚠️  MongoDB napaka:', err.message)
})

export async function connectDB() {
  try {
    mongoose.set('bufferCommands', false)  // ne čakaj na povezavo
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 4000,
    })
    console.log('✅ MongoDB connected')
    return true
  } catch (err) {
    console.warn('⚠️  MongoDB ni dosegljiv — lokalni način:', err.message)
    return false  // NE kličemo process.exit()
  }
}
