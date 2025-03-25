const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Validate log level
const validLogLevels = ['error', 'warn', 'info', 'debug'];
const logLevel = validLogLevels.includes(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d', // Keep logs for 14 days
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // Keep logs for 14 days
    }),
  ],
});

module.exports = logger;