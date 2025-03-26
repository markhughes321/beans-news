const express = require('express');
const router = express.Router();
const { triggerService } = require('../controllers/triggerController');
const Article = require('../models/Article');
const { fetchRssFeeds } = require('../services/rssService');
const { scrapeWebsites } = require('../services/scrapingService');
const { fetchFromExternalAPIs } = require('../services/apiService');
const { sendArticlesToShopify } = require('../services/shopifyService');
const { batchAnalyzeArticles } = require('../services/chatGPTService');
const { validateFinalArticle } = require('../services/validation');
const { rssFeeds, scrapeTargets, apiEndpoints } = require('../config/feedsConfig');
const logger = require('../config/logger');
const mongoose = require('mongoose'); // Import mongoose to handle ObjectId

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

router.get('/:service', triggerService);

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

router.post('/reprocess-failed', async (req, res) => {
  try {
    logger.info('Triggering reprocessing of failed ChatGPT articles');

    const failedArticles = await Article.find({ metaStatus: 'failed' })
      .select('title link source publishedAt description description_improved domain image tags category geotag _id')
      .lean();

    if (failedArticles.length === 0) {
      logger.info('No failed articles to reprocess');
      return res.status(200).json({ message: 'No failed articles to reprocess' });
    }

    logger.info(`Found ${failedArticles.length} articles with metaStatus 'failed' to reprocess`);

    await Article.updateMany(
      { metaStatus: 'failed' },
      { metaStatus: 'pending' }
    );
    logger.info(`Reset metaStatus to 'pending' for ${failedArticles.length} articles`);

    const articlesToReprocess = failedArticles.map(article => ({
      ...article,
      _id: article._id,
    }));

    const chatGPTResults = await batchAnalyzeArticles(articlesToReprocess);

    const chatGPTResultsMap = new Map(chatGPTResults.map(result => [result.id, result]));
    const updatedArticles = articlesToReprocess.map(article => {
      const chatGPTResult = chatGPTResultsMap.get(article._id.toString());
      if (chatGPTResult) {
        return {
          ...article,
          category: chatGPTResult.category,
          geotag: chatGPTResult.geotag,
          tags: chatGPTResult.tags || article.tags,
          description_improved: chatGPTResult.description_improved,
          originalId: article._id, // Preserve the original ObjectId
        };
      }
      return {
        ...article,
        originalId: article._id, // Preserve the original ObjectId even if no ChatGPT result
      };
    });

    const validatedArticles = updatedArticles
      .map(article => {
        // Ensure _id is a string for validation, but preserve originalId
        const articleToValidate = {
          ...article,
          _id: article._id.toString(), // Convert _id to string for Joi validation
        };
        const validationResult = validateFinalArticle(articleToValidate, 'REPROCESS');
        if (!validationResult.isValid) {
          logger.warn(`Skipping invalid article after reprocessing (link: ${article.link}): ${JSON.stringify(validationResult.errors)}`);
          return null;
        }
        return {
          ...validationResult.article,
          originalId: article.originalId, // Carry forward the original ObjectId
        };
      })
      .filter(article => article !== null);

    if (validatedArticles.length === 0) {
      logger.info('No valid articles to save after reprocessing');
      return res.status(200).json({ message: 'No valid articles to save after reprocessing' });
    }

    const result = await Article.bulkWrite(validatedArticles.map(article => ({
      updateOne: {
        filter: { _id: article.originalId }, // Use the original ObjectId for the filter
        update: {
          $set: {
            category: article.category,
            geotag: article.geotag,
            tags: article.tags,
            description_improved: article.description_improved,
          },
        },
      },
    })));

    logger.info(`Reprocessed articles: matched=${result.matchedCount}, modified=${result.modifiedCount}`);

    res.status(200).json({
      message: 'Reprocessing of failed articles completed',
      processed: validatedArticles.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    logger.error(`Error reprocessing failed articles: ${error.message}`);
    res.status(500).json({ error: 'Failed to reprocess articles', details: error.message });
  }
});

module.exports = router;