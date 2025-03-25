require('dotenv-safe').config();
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const logger = require('./config/logger');
const { startScheduler } = require('./jobs/scheduler');

const PORT = process.env.PORT || 3000;

/**
 * Starts the server and connects to the database.
 */
async function startServer() {
  try {
    await connectDB();
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      startScheduler();
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      server.close(() => {
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      server.close(() => {
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
}

startServer();