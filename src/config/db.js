const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connects to the MongoDB database.
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

module.exports = { connectDB };