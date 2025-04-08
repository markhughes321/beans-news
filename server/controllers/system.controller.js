// File: ./server/controllers/system.controller.js
const logger = require("../config/logger");
const { scrapeSourceByName, processArticlesWithAI } = require("../services/scraper");
const { sendArticlesToShopify, updateArticleInShopify } = require("../services/shopifyService");
const { processArticleAI } = require("../services/ai"); // Add this import
const Article = require("../models/Article");
const axios = require("axios");

const SHOPIFY_API_URL = "https://b4cd1f-0d.myshopify.com/admin/api/2023-04/graphql.json";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function triggerScrape(req, res, next) {
  const sourceName = req.query.source || req.body.source;
  logger.info("Manual scrape requested", { source: sourceName });
  try {
    if (!sourceName) {
      logger.warn("Missing source parameter in scrape request");
      return res.status(400).json({ error: "Missing source parameter." });
    }

    const result = await scrapeSourceByName(sourceName);
    logger.info("Manual scrape completed", { source: sourceName, newArticles: result.newCount, updatedArticles: result.updatedCount });
    res.json({
      message: `Scrape triggered for ${sourceName}`,
      newArticles: result.newCount,
      updatedArticles: result.updatedCount,
    });
  } catch (err) {
    logger.error("Manual scrape error", { source: sourceName, error: err.message });
    next(err);
  }
}

async function triggerAIProcessing(req, res, next) {
  const sourceName = req.query.source || req.body.source;
  logger.info("Manual AI processing requested", { source: sourceName });
  try {
    if (!sourceName) {
      logger.warn("Missing source parameter in AI processing request");
      return res.status(400).json({ error: "Missing source parameter." });
    }

    const result = await processArticlesWithAI(sourceName);
    logger.info("Manual AI processing completed", { source: sourceName, processedCount: result.processedCount });
    res.json({ message: `AI processing triggered for ${sourceName}`, processedCount: result.processedCount });
  } catch (err) {
    logger.error("Manual AI processing error", { source: sourceName, error: err.message });
    next(err);
  }
}

async function triggerShopifyPublish(req, res, next) {
  logger.info("Manual Shopify publish requested");
  try {
    await sendArticlesToShopify();
    logger.info("Manual Shopify publish completed");
    res.json({ message: "Shopify publish process complete." });
  } catch (err) {
    logger.error("Manual Shopify publish error", { error: err.message });
    next(err);
  }
}

async function pushArticleToShopify(req, res, next) {
  const { uuid } = req.params;
  logger.info("Pushing single article to Shopify", { uuid });
  try {
    const article = await Article.findOne({ uuid })
      .select("uuid title link source publishedAt improvedDescription seoTitle seoDescription domain imageUrl tags geotag category shopifyMetaobjectId _id")
      .lean();

    if (!article) {
      logger.warn("Article not found for Shopify push", { uuid });
      return res.status(404).json({ error: "Article not found" });
    }

    const handleBase = article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");
    const dateStr = article.publishedAt ? article.publishedAt.toISOString().split("T")[0].replace(/-/g, "") : new Date().toISOString().split("T")[0].replace(/-/g, "");
    const handle = `${handleBase}-${dateStr}`;

    const fields = [
      { key: "uuid", value: article.uuid || "" },
      { key: "publishdate", value: article.publishedAt ? article.publishedAt.toISOString() : new Date().toISOString() },
      { key: "title", value: article.title || "Untitled" },
      { key: "description", value: article.improvedDescription || "No description available." },
      { key: "url", value: article.link || "" },
      { key: "domain", value: article.domain || "unknown" },
      { key: "image", value: article.imageUrl || "" },
      { key: "tags", value: article.tags && article.tags.length > 0 ? article.tags.join(", ") : "" },
      { key: "attribution", value: article.source || "Unknown Source" },
      { key: "geotag", value: article.geotag || "" },
      { key: "category", value: article.category || "Market" },
      { key: "seotitle", value: article.seoTitle || `${article.title} | Beans NEWS` },
      { key: "seodescription", value: article.seoDescription || "" },
    ];

    let mutation, variables;

    if (article.shopifyMetaobjectId) {
      // Update existing metaobject
      mutation = `
        mutation MetaobjectUpdate($input: MetaobjectUpdateInput!) {
          metaobjectUpdate(metaobject: $input) {
            metaobject { id handle type }
            userErrors { field message }
          }
        }
      `;
      variables = {
        input: {
          id: article.shopifyMetaobjectId,
          fields,
        },
      };
    } else {
      // Create new metaobject
      mutation = `
        mutation MetaobjectCreate($input: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $input) {
            metaobject { id handle type }
            userErrors { field message }
          }
        }
      `;
      variables = {
        input: {
          handle,
          type: "news_articles",
          capabilities: { publishable: { status: "ACTIVE" } },
          fields,
        },
      };
    }

    logger.debug("Sending article to Shopify", { title: article.title, isUpdate: !!article.shopifyMetaobjectId });
    const response = await axios.post(
      SHOPIFY_API_URL,
      { query: mutation, variables },
      { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN, "Content-Type": "application/json" } }
    );

    const { data } = response;
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const resultKey = article.shopifyMetaobjectId ? 'metaobjectUpdate' : 'metaobjectCreate';
    const { metaobject, userErrors } = data.data[resultKey];
    if (userErrors && userErrors.length > 0) {
      const duplicateError = userErrors.find((err) => err.message.includes("Value is already assigned to another metafield"));
      if (duplicateError) {
        logger.warn("Duplicate article detected in Shopify", { uuid, link: article.link });
        await Article.updateOne({ _id: article._id }, { sentToShopify: true });
        res.json({ message: `Article marked as sent due to duplicate: ${article.link}` });
        return;
      }
      throw new Error(`Shopify user errors: ${JSON.stringify(userErrors)}`);
    }

    if (!metaobject) {
      throw new Error("No metaobject returned from Shopify");
    }

    await Article.updateOne({ _id: article._id }, { sentToShopify: true, shopifyMetaobjectId: metaobject.id });
    logger.info("Article processed in Shopify", { link: article.link, shopifyId: metaobject.id });
    res.json({ message: `Article ${article.shopifyMetaobjectId ? 'updated' : 'sent'} to Shopify: ${article.link}` });
  } catch (err) {
    logger.error("Error pushing article to Shopify", { uuid, error: err.message });
    next(err);
  }
}

async function editArticleOnShopify(req, res, next) {
  const { uuid } = req.params;
  const updatedArticle = req.body;
  logger.info("Editing article on Shopify", { uuid });

  try {
    const article = await Article.findOne({ uuid })
      .select("uuid title link source publishedAt improvedDescription seoTitle seoDescription domain imageUrl tags geotag category shopifyMetaobjectId _id")
      .lean();

    if (!article) {
      logger.warn("Article not found for Shopify edit", { uuid });
      return res.status(404).json({ error: "Article not found" });
    }

    if (!article.shopifyMetaobjectId) {
      logger.warn("Article not yet sent to Shopify", { uuid });
      return res.status(400).json({ error: "Article has not been sent to Shopify yet" });
    }

    // Update local database first
    const updated = await Article.findOneAndUpdate(
      { uuid },
      { ...updatedArticle, updatedAt: new Date() },
      { new: true }
    );

    // Prepare fields for Shopify update
    const fields = [
      { key: "uuid", value: updated.uuid || "" },
      { key: "publishdate", value: updated.publishedAt ? updated.publishedAt.toISOString() : new Date().toISOString() },
      { key: "title", value: updated.title || "Untitled" },
      { key: "description", value: updated.improvedDescription || "No description available." },
      { key: "url", value: updated.link || "" },
      { key: "domain", value: updated.domain || "unknown" },
      { key: "image", value: updated.imageUrl || "" },
      { key: "tags", value: updated.tags && updated.tags.length > 0 ? updated.tags.join(", ") : "" },
      { key: "attribution", value: updated.source || "Unknown Source" },
      { key: "geotag", value: updated.geotag || "" },
      { key: "category", value: updated.category || "Market" },
      { key: "seotitle", value: updated.seoTitle || `${updated.title} | Beans NEWS` },
      { key: "seodescription", value: updated.seoDescription || "" },
    ];

    const mutation = `
      mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            handle
            type
            fields {
              key
              value
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const variables = {
      id: article.shopifyMetaobjectId,
      metaobject: { fields }
    };

    logger.debug("Updating article in Shopify", { title: updated.title, shopifyId: article.shopifyMetaobjectId });
    const response = await axios.post(
      SHOPIFY_API_URL,
      { query: mutation, variables },
      { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN, "Content-Type": "application/json" } }
    );

    const { data } = response;
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const { metaobject, userErrors } = data.data.metaobjectUpdate;
    if (userErrors && userErrors.length > 0) {
      throw new Error(`Shopify user errors: ${JSON.stringify(userErrors)}`);
    }

    if (!metaobject) {
      throw new Error("No metaobject returned from Shopify after update");
    }

    logger.info("Article updated in Shopify and database", { link: updated.link, shopifyId: metaobject.id });
    res.json({ 
      message: `Article updated in Shopify and database: ${updated.link}`,
      article: updated
    });
  } catch (err) {
    logger.error("Error editing article on Shopify", { uuid, error: err.message });
    next(err);
  }
}

async function processSingleArticleWithAI(req, res, next) {
  const { uuid } = req.params;
  logger.info("Processing single article with AI", { uuid });
  try {
    const article = await Article.findOne({ uuid });
    if (!article) {
      logger.warn("Article not found for AI processing", { uuid });
      return res.status(404).json({ error: "Article not found" });
    }

    if (article.processedByAI) {
      logger.info("Article already processed by AI", { uuid });
      return res.status(200).json({ message: "Article already processed", article });
    }

    const aiData = await processArticleAI({
      title: article.title,
      description: article.description,
      imageUrl: article.imageUrl,
    });

    const updatedArticle = await Article.findOneAndUpdate(
      { uuid },
      {
        $set: {
          category: aiData.category,
          geotag: aiData.geotag,
          tags: aiData.tags,
          improvedDescription: aiData.improvedDescription,
          seoTitle: aiData.seoTitle,
          seoDescription: aiData.seoDescription,
          processedByAI: true,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    logger.info("Single article processed with AI", { uuid, title: updatedArticle.title });
    res.json({ message: "Article processed with AI", article: updatedArticle });
  } catch (err) {
    logger.error("Error processing single article with AI", { uuid, error: err.message });
    next(err);
  }
}

module.exports = {
  triggerScrape,
  triggerAIProcessing,
  triggerShopifyPublish,
  pushArticleToShopify,
  editArticleOnShopify,
  processSingleArticleWithAI,
};