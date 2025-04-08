const Article = require("../models/Article");
const logger = require("../config/logger");

exports.getAllArticles = async (req, res, next) => {
  try {
    const { processedByAI, sentToShopify, source } = req.query;
    const query = {};

    if (processedByAI !== undefined) {
      const isProcessedByAI = processedByAI === 'true';
      query.processedByAI = isProcessedByAI ? true : { $in: [false, null, undefined] };
    }
    if (sentToShopify !== undefined) {
      query.sentToShopify = sentToShopify === 'true';
    }
    if (source) {
      query.source = source;
    }

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
      new: true,
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

exports.bulkDeleteArticles = async (req, res, next) => {
  try {
    const { uuids } = req.body;
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({ error: "No UUIDs provided for bulk delete" });
    }
    const result = await Article.deleteMany({ uuid: { $in: uuids } });
    res.json({ message: `${result.deletedCount} articles deleted.` });
  } catch (err) {
    logger.error("Error bulk deleting articles", { error: err });
    next(err);
  }
};

exports.bulkEditArticles = async (req, res, next) => {
  try {
    const { uuids, updates } = req.body;
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({ error: "No UUIDs provided for bulk edit" });
    }
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided for bulk edit" });
    }
    const result = await Article.updateMany(
      { uuid: { $in: uuids } },
      { $set: updates },
      { new: true }
    );
    res.json({ message: `${result.modifiedCount} articles updated.` });
  } catch (err) {
    logger.error("Error bulk editing articles", { error: err });
    next(err);
  }
};