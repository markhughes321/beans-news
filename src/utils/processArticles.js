const Article = require('../models/Article');
const logger = require('../config/logger');
const { validateArticle } = require('../services/validation');

/**
 * Processes and saves articles to the database after validation.
 * @param {Array<Object>} articles - Array of article objects to process.
 * @param {string} sourceType - The type of source ('RSS', 'API', 'SCRAPE').
 * @param {string} sourceUrl - The URL of the source.
 * @returns {Promise<Object>} The result of the bulk write operation.
 */
async function processArticles(articles, sourceType, sourceUrl) {
  const validatedArticles = articles
    .map(article => {
      const validationResult = validateArticle(article, sourceType);
      if (!validationResult.isValid) {
        logger.warn(`Skipping invalid ${sourceType} article from ${sourceUrl}: ${JSON.stringify(validationResult.errors)}`);
        return null;
      }
      return validationResult.article;
    })
    .filter(article => article !== null);

  if (validatedArticles.length === 0) {
    logger.info(`No valid articles to save from ${sourceUrl} after validation`);
    return { matchedCount: 0, upsertedCount: 0, modifiedCount: 0 };
  }

  logger.info(`Saving ${validatedArticles.length} valid articles from ${sourceUrl}`);

  // Batch the bulkWrite operations
  const BATCH_SIZE = 1000;
  let totalResult = { matchedCount: 0, upsertedCount: 0, modifiedCount: 0 };
  for (let i = 0; i < validatedArticles.length; i += BATCH_SIZE) {
    const batch = validatedArticles.slice(i, i + BATCH_SIZE);
    const result = await Article.bulkWrite(batch.map(article => ({
      updateOne: {
        filter: { link: article.link },
        update: {
          $set: {
            title: article.title,
            source: article.source,
            publishedAt: article.publishedAt,
            description: article.description,
            domain: article.domain,
            image: article.image,
            tags: article.tags,
          },
        },
        upsert: true,
      },
    })));

    totalResult.matchedCount += result.matchedCount;
    totalResult.upsertedCount += result.upsertedCount;
    totalResult.modifiedCount += result.modifiedCount;
  }

  logger.info(`Saved articles from ${sourceUrl}: matched=${totalResult.matchedCount}, upserted=${totalResult.upsertedCount}, modified=${totalResult.modifiedCount}`);
  return totalResult;
}

module.exports = { processArticles };