const Article = require("../models/Article");
const logger = require("../config/logger");

exports.getAllArticles = async (req, res, next) => {
  try {
    const { processedByAI, sentToShopify } = req.query;
    const query = {};

    if (processedByAI !== undefined) {
      const isProcessedByAI = processedByAI === 'true';
      if (isProcessedByAI) {
        query.processedByAI = true;
      } else {
        // Match both processedByAI: false and documents where processedByAI is null/undefined
        query.processedByAI = { $in: [false, null, undefined] };
      }
    }
    if (sentToShopify !== undefined) {
      query.sentToShopify = sentToShopify === 'true';
    }

    console.log('Query:', query); // Debug log
    const articles = await Article.find(query).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    logger.error("Error fetching articles", { error: err });
    next(err);
  }
};

exports.getArticle = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const article = await Article.findOne({ uuid });
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(article);
  } catch (err) {
    logger.error("Error fetching article", { error: err });
    next(err);
  }
};

exports.updateArticle = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const updated = await Article.findOneAndUpdate({ uuid }, req.body, {
      new: true
    });
    if (!updated) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(updated);
  } catch (err) {
    logger.error("Error updating article", { error: err });
    next(err);
  }
};

exports.deleteArticle = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const deleted = await Article.findOneAndDelete({ uuid });
    if (!deleted) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json({ message: "Article deleted." });
  } catch (err) {
    logger.error("Error deleting article", { error: err });
    next(err);
  }
};