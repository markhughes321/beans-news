const axios = require("axios");
const logger = require("../config/logger");
const Article = require("../models/Article");

const SHOPIFY_API_URL = "https://b4cd1f-0d.myshopify.com/admin/api/2023-04/graphql.json";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  logger.error("SHOPIFY_ACCESS_TOKEN is not defined in environment variables");
  throw new Error("SHOPIFY_ACCESS_TOKEN is required");
}

async function updateArticleInShopify(article) {
  logger.debug("Updating article in Shopify", { link: article.link, shopifyId: article.shopifyMetaobjectId });
  try {
    if (!article.shopifyMetaobjectId) {
      throw new Error(`No Shopify metaobject ID found for article: ${article.link}`);
    }

    const input = {
      id: article.shopifyMetaobjectId,
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
      mutation MetaobjectUpdate($input: MetaobjectUpdateInput!) {
        metaobjectUpdate(metaobject: $input) {
          metaobject { id handle type }
          userErrors { field message }
        }
      }
    `;

    const response = await axios.post(
      SHOPIFY_API_URL,
      { query: mutation, variables: { input } },
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

    logger.info("Successfully updated article in Shopify", { link: article.link, shopifyId: metaobject.id });
  } catch (error) {
    logger.error("Failed to update article in Shopify", { link: article.link, error: error.message });
    throw error;
  }
}

async function sendArticlesToShopify() {
  logger.info("Starting Shopify publish process");
  try {
    const articles = await Article.find({
      $or: [{ sentToShopify: { $ne: true } }, { shopifyMetaobjectId: { $ne: null } }],
    })
      .select("uuid title link source publishedAt improvedDescription seoTitle seoDescription domain imageUrl tags geotag category shopifyMetaobjectId _id")
      .lean();

    if (articles.length === 0) {
      logger.info("No articles to send or update in Shopify");
      return;
    }

    logger.debug("Processing articles for Shopify", { count: articles.length });
    const failedArticles = [];

    for (const article of articles) {
      try {
        if (article.shopifyMetaobjectId) {
          await updateArticleInShopify(article);
          continue;
        }

        logger.debug("Creating new Shopify metaobject", { title: article.title });
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
            logger.warn("Article is a duplicate in Shopify, marking as sent", { uuid: article.uuid, link: article.link });
            await Article.updateOne({ _id: article._id }, { sentToShopify: true });
            continue;
          }
          throw new Error(`Shopify user errors: ${JSON.stringify(userErrors)}`);
        }

        if (!metaobject) {
          throw new Error("No metaobject returned from Shopify");
        }

        await Article.updateOne({ _id: article._id }, { sentToShopify: true, shopifyMetaobjectId: metaobject.id });
        logger.info("Successfully sent article to Shopify", { link: article.link, shopifyId: metaobject.id });
      } catch (error) {
        logger.error("Failed to process article for Shopify", { link: article.link, error: error.message });
        failedArticles.push({ link: article.link, error: error.message });
      }
    }

    if (failedArticles.length > 0) {
      logger.warn("Some articles failed to process for Shopify", { failedCount: failedArticles.length, details: failedArticles });
    } else {
      logger.info("All articles processed for Shopify successfully");
    }
  } catch (error) {
    logger.error("Error in sendArticlesToShopify", { error: error.message });
    throw error;
  }
}

module.exports = { sendArticlesToShopify, updateArticleInShopify };