// File: ./src/routes/triggerRoutes.js
const express = require('express');
const router = express.Router();
const { triggerService } = require('../controllers/triggerController');
const Article = require('../models/Article');
const { fetchRssFeeds } = require('../services/rssService');
const { scrapeWebsites } = require('../services/scrapingService');
const { fetchFromExternalAPIs } = require('../services/apiService');
const { sendArticlesToShopify } = require('../services/shopifyService');
const { rssFeeds, scrapeTargets, apiEndpoints } = require('../config/feedsConfig');
const logger = require('../config/logger');

/**
 * Manually triggers sending articles to Shopify.
 */
router.get('/shopify-sync', async (req, res) => {
  try {
    logger.info('Manually triggering Shopify sync');
    await sendArticlesToShopify();
    res.json({ message: 'Shopify sync triggered successfully' });
  } catch (error) {
    logger.error(`Error triggering Shopify sync: ${error.message}`);
    res.status(500).json({ error: 'Failed to trigger Shopify sync', details: error.message });
  }
});

// Generic route for triggering services (rss, scraping, api)
router.get('/:service', triggerService);

/**
 * Resets the database and triggers a fresh scrape of all enabled sources.
 */
router.post('/reset-and-scrape', async (req, res) => {
  try {
    logger.info('Dropping all articles from the database');
    await Article.deleteMany({});
    logger.info('All articles dropped successfully');

    logger.info('Triggering all data fetching services');
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
      return res.status(200).json({ message: 'Database reset, but no scraping tasks were run due to disabled services or no sources' });
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
      logger.warn(`Some tasks failed during reset-and-scrape: ${JSON.stringify(failedTasks, null, 2)}`);
    }

    logger.info('All data fetching services completed');

    const totalArticles = await Article.countDocuments();
    logger.info(`Total articles in database after scrape: ${totalArticles}`);

    res.status(200).json({
      message: 'Database reset and fresh scrape completed successfully',
      totalArticles,
      failedTasks: failedTasks.length > 0 ? failedTasks : undefined,
    });
  } catch (error) {
    logger.error(`Error during reset and scrape: ${error.message}`);
    res.status(500).json({ error: 'Failed to reset and scrape', details: error.message });
  }
});

module.exports = router;