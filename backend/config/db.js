const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('DATABASE_URL or MONGODB_URI is not defined in environment variables');
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('MongoDB Disconnected');
};

module.exports = { connectDB, disconnectDB };
