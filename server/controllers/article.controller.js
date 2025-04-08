const Article = require("../models/Article");
const logger = require("../config/logger");
const axios = require("axios");

const SHOPIFY_API_URL = "https://b4cd1f-0d.myshopify.com/admin/api/2023-04/graphql.json";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

exports.getAllArticles = async (req, res, next) => {
  try {
    const { processedByAI, sentToShopify, source } = req.query;
    const query = {};
    if (processedByAI !== undefined) {
      query.processedByAI = processedByAI === 'true' ? true : { $in: [false, null, undefined] };
    }
    if (sentToShopify !== undefined) {
      query.sentToShopify = sentToShopify === 'true';
    }
    if (source) {
      query.source = source;
    }
    const articles = await Article.find(query).sort({ publishedAt: -1 });
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
    const updated = await Article.findOneAndUpdate({ uuid }, req.body, { new: true });
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
  const { uuid } = req.params;
  logger.info("Deleting article", { uuid });
  try {
    const article = await Article.findOne({ uuid });
    if (!article) {
      logger.warn("Article not found for deletion", { uuid });
      return res.status(404).json({ error: "Article not found" });
    }

    if (article.sentToShopify || article.shopifyMetaobjectId) {
      if (!article.shopifyMetaobjectId) {
        logger.warn("Article marked as sent to Shopify but no metaobject ID found", { uuid });
      } else {
        const mutation = `
          mutation DeleteMetaobject($id: ID!) {
            metaobjectDelete(id: $id) {
              deletedId
              userErrors {
                field
                message
                code
              }
            }
          }
        `;
        const variables = { id: article.shopifyMetaobjectId };
        logger.debug("Deleting article from Shopify", { uuid, shopifyId: article.shopifyMetaobjectId });
        const response = await axios.post(
          SHOPIFY_API_URL,
          { query: mutation, variables },
          { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN, "Content-Type": "application/json" } }
        );
        const { data } = response;
        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }
        const { deletedId, userErrors } = data.data.metaobjectDelete;
        if (userErrors && userErrors.length > 0) {
          throw new Error(`Shopify user errors: ${JSON.stringify(userErrors)}`);
        }
        if (!deletedId) {
          throw new Error("No deletedId returned from Shopify");
        }
        logger.info("Article deleted from Shopify", { uuid, deletedId });
      }
    }

    await Article.deleteOne({ uuid });
    logger.info("Article deleted from database", { uuid });
    res.json({ message: "Article deleted successfully." });
  } catch (err) {
    logger.error("Error deleting article", { uuid, error: err.message });
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