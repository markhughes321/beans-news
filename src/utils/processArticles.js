const Article = require('../models/Article');
const logger = require('../config/logger');
const { validateInitialArticle, validateFinalArticle } = require('../services/validation');
const { batchAnalyzeArticles } = require('../services/chatGPTService');
const DefaultParser = require('../parsers/defaultParser');
const mongoose = require('mongoose');

const parser = new DefaultParser();

async function processArticles(articles, sourceType, sourceUrl) {
  // Step 1: Initial validation (minimal requirements)
  const validatedArticles = articles
    .map(article => {
      const validationResult = validateInitialArticle(article, sourceType);
      if (!validationResult.isValid) {
        logger.warn(`Skipping invalid ${sourceType} article from ${sourceUrl}: ${JSON.stringify(validationResult.errors)}`);
        logger.debug(`Failed article data: ${JSON.stringify(article, null, 2)}`);
        return null;
      }
      return validationResult.article;
    })
    .filter(article => article !== null);

  if (validatedArticles.length === 0) {
    logger.info(`No valid articles to save from ${sourceUrl} after initial validation`);
    return { matchedCount: 0, upsertedCount: 0, modifiedCount: 0 };
  }

  logger.info(`Processing ${validatedArticles.length} valid articles from ${sourceUrl}`);

  // Step 2: Check which articles need to be saved and analyzed
  const articlesToSave = [];
  const existingArticles = await Article.find({ link: { $in: validatedArticles.map(a => a.link) } }).lean();
  const existingLinks = new Set(existingArticles.map(a => a.link));

  const articlesWithIds = validatedArticles.map(article => {
    if (!existingLinks.has(article.link)) {
      const newArticle = new Article();
      article._id = newArticle._id;
      articlesToSave.push(article);
    }
    return article;
  });

  // Step 3: Save articles to database with minimal fields
  if (articlesToSave.length > 0) {
    logger.info(`Saving ${articlesToSave.length} new articles from ${sourceUrl} to database`);

    const BATCH_SIZE = 1000;
    let initialSaveResult = { matchedCount: 0, upsertedCount: 0, modifiedCount: 0 };
    for (let i = 0; i < articlesToSave.length; i += BATCH_SIZE) {
      const batch = articlesToSave.slice(i, i + BATCH_SIZE);
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
              metaStatus: 'pending',
            },
          },
          upsert: true,
        },
      })));

      initialSaveResult.matchedCount += result.matchedCount;
      initialSaveResult.upsertedCount += result.upsertedCount;
      initialSaveResult.modifiedCount += result.modifiedCount;
    }

    logger.info(`Initial save from ${sourceUrl}: matched=${initialSaveResult.matchedCount}, upserted=${initialSaveResult.upsertedCount}, modified=${initialSaveResult.modifiedCount}`);
  }

  // Step 3.5: Retrieve the actual _id for each article after saving
  const savedArticles = await Article.find({ link: { $in: articlesToSave.map(a => a.link) } }).lean();
  const savedArticlesMap = new Map(savedArticles.map(a => [a.link, a._id]));

  const articlesToAnalyze = articlesWithIds
    .filter(article => !existingLinks.has(article.link))
    .map(article => {
      const actualId = savedArticlesMap.get(article.link);
      if (!actualId) {
        logger.warn(`Could not find saved article for link ${article.link} after initial save`);
        return null;
      }
      return {
        ...article,
        _id: actualId,
      };
    })
    .filter(article => article !== null);

  if (articlesToAnalyze.length === 0) {
    logger.info(`No articles to analyze from ${sourceUrl} after mapping saved IDs`);
    return { matchedCount: 0, upsertedCount: 0, modifiedCount: 0 };
  }

  // Step 4: Analyze articles with ChatGPT
  let chatGPTResults = [];
  if (articlesToAnalyze.length > 0) {
    logger.info(`Sending ${articlesToAnalyze.length} articles for ChatGPT analysis`);
    chatGPTResults = await batchAnalyzeArticles(articlesToAnalyze);
  }

  // Step 5: Merge ChatGPT results with articles
  const chatGPTResultsMap = new Map(chatGPTResults.map(result => [result.id, result]));
  const updatedArticles = articlesToAnalyze.map(article => {
    const chatGPTResult = chatGPTResultsMap.get(article._id.toString());
    if (chatGPTResult) {
      return {
        ...article,
        category: parser.toTitleCase(chatGPTResult.category),
        geotag: chatGPTResult.geotag ? parser.toTitleCase(chatGPTResult.geotag) : null,
        tags: chatGPTResult.tags ? chatGPTResult.tags.map(tag => parser.toTitleCase(tag)) : null,
        description_improved: chatGPTResult.description_improved,
        originalId: article._id,
      };
    }
    return {
      ...article,
      originalId: article._id,
    };
  });

  // Step 6: Final validation after ChatGPT analysis
  const validatedFinalArticles = updatedArticles
    .map(article => {
      const { originalId, ...articleToValidate } = article;
      articleToValidate._id = article._id.toString();
      const validationResult = validateFinalArticle(articleToValidate, sourceType);
      if (!validationResult.isValid) {
        logger.warn(`Skipping invalid ${sourceType} article after ChatGPT analysis from ${sourceUrl}: ${JSON.stringify(validationResult.errors)}`);
        logger.debug(`Failed article data: ${JSON.stringify(articleToValidate, null, 2)}`);
        return null;
      }
      return {
        ...validationResult.article,
        originalId: article.originalId,
      };
    })
    .filter(article => article !== null);

  if (validatedFinalArticles.length === 0) {
    logger.info(`No valid articles to update from ${sourceUrl} after ChatGPT analysis`);
    return { matchedCount: 0, upsertedCount: 0, modifiedCount: 0 };
  }

  // Step 7: Update articles in the database with ChatGPT results
  logger.info(`Updating ${validatedFinalArticles.length} articles from ${sourceUrl} in database`);

  const BATCH_SIZE = 1000;
  let finalUpdateResult = { matchedCount: 0, upsertedCount: 0, modifiedCount: 0 };
  for (let i = 0; i < validatedFinalArticles.length; i += BATCH_SIZE) {
    const batch = validatedFinalArticles.slice(i, i + BATCH_SIZE);
    const result = await Article.bulkWrite(batch.map(article => ({
      updateOne: {
        filter: { _id: article.originalId },
        update: {
          $set: {
            category: article.category,
            geotag: article.geotag,
            tags: article.tags,
            description_improved: article.description_improved,
            metaStatus: article.metaStatus || 'success',
          },
        },
      },
    })));

    finalUpdateResult.matchedCount += result.matchedCount;
    finalUpdateResult.upsertedCount += result.upsertedCount;
    finalUpdateResult.modifiedCount += result.modifiedCount;
  }

  logger.info(`Final update from ${sourceUrl}: matched=${finalUpdateResult.matchedCount}, upserted=${finalUpdateResult.upsertedCount}, modified=${finalUpdateResult.modifiedCount}`);
  return finalUpdateResult;
}

module.exports = { processArticles };