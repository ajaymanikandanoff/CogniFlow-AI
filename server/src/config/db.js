const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_study_coach';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at ${uri}.`);
    console.warn('[MongoDB] Activating resilient local JSON/memory database mode for zero-configuration hackathon execution.');
    isConnected = false;
    return false;
  }
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
