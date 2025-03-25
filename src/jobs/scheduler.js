// File: ./src/jobs/scheduler.js
const cron = require('node-cron');
const logger = require('../config/logger');
const { fetchRssFeeds } = require('../services/rssService');
const { scrapeWebsites } = require('../services/scrapingService');
const { fetchFromExternalAPIs } = require('../services/apiService');
const { sendArticlesToShopify } = require('../services/shopifyService'); // Import the new service
const { rssFeeds, scrapeTargets, apiEndpoints } = require('../config/feedsConfig');

// Cron expression for fetching articles at 6:00 AM
const fetchCronExpression = process.env.SCHEDULE_CRON || '0 6 * * *'; // Default 6 AM

// Cron expression for sending articles to Shopify at 6:30 AM
const shopifyCronExpression = '30 6 * * *'; // 6:30 AM

// Validate cron expressions
if (!cron.validate(fetchCronExpression)) {
  logger.error(`Invalid fetch cron expression: ${fetchCronExpression}`);
  throw new Error(`Invalid fetch cron expression: ${fetchCronExpression}`);
}

if (!cron.validate(shopifyCronExpression)) {
  logger.error(`Invalid Shopify cron expression: ${shopifyCronExpression}`);
  throw new Error(`Invalid Shopify cron expression: ${shopifyCronExpression}`);
}

/**
 * Schedules periodic news aggregation tasks at 6:00 AM.
 */
cron.schedule(fetchCronExpression, async () => {
  logger.info('Starting scheduled news aggregation tasks');
  try {
    const tasks = [];
    const taskNames = [];
    if (process.env.ENABLE_RSS === 'true' && rssFeeds.length > 0) {
      tasks.push(fetchRssFeeds());
      taskNames.push('RSS');
    }
    if (process.env.ENABLE_SCRAPING === 'true' && scrapeTargets.length > 0) {
      tasks.push(scrapeWebsites());
      taskNames.push('Scraping');
    }
    if (process.env.ENABLE_API === 'true' && apiEndpoints.length > 0) {
      tasks.push(fetchFromExternalAPIs());
      taskNames.push('API');
    }
    if (tasks.length === 0) {
      logger.info('No tasks to run: all services are disabled or no sources configured');
      return;
    }

    const failedTasks = [];
    await Promise.all(tasks.map(async (task, index) => {
      try {
        await task;
      } catch (error) {
        failedTasks.push({ service: taskNames[index], error: error.message });
      }
    }));

    if (failedTasks.length > 0) {
      logger.warn(`Some scheduled tasks failed: ${JSON.stringify(failedTasks, null, 2)}`);
    }

    logger.info('Completed scheduled news aggregation tasks');
  } catch (error) {
    logger.error(`Scheduler error (fetch tasks): ${error.message}`);
  }
});

/**
 * Schedules sending articles to Shopify at 6:30 AM.
 */
cron.schedule(shopifyCronExpression, async () => {
  logger.info('Starting scheduled Shopify sync task');
  try {
    await sendArticlesToShopify();
    logger.info('Completed scheduled Shopify sync task');
  } catch (error) {
    logger.error(`Scheduler error (Shopify sync): ${error.message}`);
  }
});

/**
 * Initializes the scheduler.
 */
module.exports = { startScheduler: () => {
  logger.info(`Fetch scheduler initialized with cron expression: ${fetchCronExpression}`);
  logger.info(`Shopify sync scheduler initialized with cron expression: ${shopifyCronExpression}`);
} };