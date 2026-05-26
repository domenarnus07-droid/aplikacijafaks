import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studyos'

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log(`✅ MongoDB connected: ${MONGODB_URI}`)
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}
