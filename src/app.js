const express = require('express');
const cors = require('cors');
const articleRoutes = require('./routes/articleRoutes');
const triggerRoutes = require('./routes/triggerRoutes');
const logger = require('./config/logger');

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json());

// Initialize routes
const initializeRoutes = () => {
  app.use('/api/articles', articleRoutes);
  app.use('/api/trigger', triggerRoutes);
};

initializeRoutes();

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  const errorDetails = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  res.status(500).json({ error: errorDetails });
});

module.exports = app;