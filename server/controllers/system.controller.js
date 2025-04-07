const logger = require("../config/logger");
const { scrapeSourceByName } = require("../services/scraper");
const { sendArticlesToShopify, updateArticleInShopify } = require("../services/shopifyService");
const Article = require("../models/Article");
const axios = require("axios");

const SHOPIFY_API_URL = "https://b4cd1f-0d.myshopify.com/admin/api/2023-04/graphql.json";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Define functions as standalone variables
async function triggerScrape(req, res, next) {
  const sourceName = req.query.source || req.body.source;
  logger.info("Manual scrape requested", { source: sourceName });
  try {
    if (!sourceName) {
      logger.warn("Missing source parameter in scrape request");
      return res.status(400).json({ error: "Missing source parameter." });
    }

    const newCount = await scrapeSourceByName(sourceName);
    logger.info("Manual scrape completed", { source: sourceName, newArticles: newCount });
    res.json({ message: `Scrape triggered for ${sourceName}`, newArticles: newCount });
  } catch (err) {
    logger.error("Manual scrape error", { source: sourceName, error: err.message });
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

    if (article.shopifyMetaobjectId) {
      await updateArticleInShopify(article);
      logger.info("Article updated in Shopify", { link: article.link });
      res.json({ message: `Article updated in Shopify: ${article.link}` });
    } else {
      const handleBase = article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").substring(0, 50);
      const dateStr = article.publishedAt ? article.publishedAt.toISOString().split("T")[0].replace(/-/g, "") : new Date().toISOString().split("T")[0].replace(/-/g, "");
      const handle = `${handleBase}-${dateStr}`;

      const input = {
        handle,
        type: "news_articles",
        capabilities: { publishable: { status: "ACTIVE" } },
        fields: [
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
        ],
      };

      const mutation = `
        mutation MetaobjectCreate($input: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $input) {
            metaobject { id handle type }
            userErrors { field message }
          }
        }
      `;

      logger.debug("Sending article to Shopify", { title: article.title });
      const response = await axios.post(
        SHOPIFY_API_URL,
        { query: mutation, variables: { input } },
        { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN, "Content-Type": "application/json" } }
      );

      const { data } = response;
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const { metaobject, userErrors } = data.data.metaobjectCreate;
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
      logger.info("Article sent to Shopify", { link: article.link, shopifyId: metaobject.id });
      res.json({ message: `Article sent to Shopify: ${article.link}` });
    }
  } catch (err) {
    logger.error("Error pushing article to Shopify", { uuid, error: err.message });
    next(err);
  }
}

module.exports = { triggerScrape, triggerShopifyPublish, pushArticleToShopify };