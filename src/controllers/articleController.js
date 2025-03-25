// File: ./src/controllers/articleController.js
const Article = require('../models/Article');
const logger = require('../config/logger');

/**
 * Fetches all articles with pagination and optional filtering.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getAllArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sentToShopify = req.query.sentToShopify; // New query parameter

    if (page < 1 || limit < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive integers' });
    }

    if (limit > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100' });
    }

    // Build the query
    let query = {};
    if (sentToShopify === 'true') {
      query.sentToShopify = true;
    } else if (sentToShopify === 'false') {
      query.sentToShopify = { $ne: true }; // Includes both false and undefined
    }

    const articles = await Article.find(query)
      .select('title link source publishedAt description domain image tags createdAt updatedAt sentToShopify')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Article.countDocuments(query);

    const transformedArticles = articles.map(article => ({
      id: article._id.toString(),
      publishDate: article.publishedAt,
      title: article.title,
      description: article.description,
      url: article.link,
      attribution: article.source,
      domain: article.domain,
      image: article.image || null,
      tags: article.tags,
      date_created: article.createdAt,
      date_updated: article.updatedAt,
      sentToShopify: article.sentToShopify || false,
    }));

    res.json({
      data: {
        Beans_News_Articles: transformedArticles,
      },
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error fetching articles: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch articles', details: error.message });
  }
};

/**
 * Fetches a single article by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .select('title link source publishedAt description domain image tags createdAt updatedAt sentToShopify')
      .lean();
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const transformedArticle = {
      id: article._id.toString(),
      publishDate: article.publishedAt,
      title: article.title,
      description: article.description,
      url: article.link,
      attribution: article.source,
      domain: article.domain,
      image: article.image || null,
      tags: article.tags,
      date_created: article.createdAt,
      date_updated: article.updatedAt,
      sentToShopify: article.sentToShopify || false,
    };

    res.json({
      data: {
        Beans_News_Articles: transformedArticle,
      },
    });
  } catch (error) {
    logger.error(`Error fetching article by ID ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch article', details: error.message });
  }
};

/**
 * Drops all articles from the database.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.dropAllArticles = async (req, res) => {
  try {
    await Article.deleteMany({});
    logger.info('All articles dropped successfully');
    res.status(200).json({ message: 'All articles dropped successfully' });
  } catch (error) {
    logger.error(`Error dropping articles: ${error.message}`);
    res.status(500).json({ error: 'Failed to drop articles', details: error.message });
  }
};