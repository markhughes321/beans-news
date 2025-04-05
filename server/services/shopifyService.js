const axios = require("axios");
const logger = require("../config/logger");
const Article = require("../models/Article");

const SHOPIFY_API_URL = "https://b4cd1f-0d.myshopify.com/admin/api/2023-04/graphql.json";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  logger.error("SHOPIFY_ACCESS_TOKEN is not defined in environment variables");
  throw new Error("SHOPIFY_ACCESS_TOKEN is required");
}

/**
 * Sends articles to Shopify as metaobjects.
 */
async function sendArticlesToShopify() {
  try {
    // Find articles that haven't been sent to Shopify
    const articles = await Article.find({ sentToShopify: { $ne: true } })
      .select("uuid title link source publishedAt description domain imageUrl tags _id")
      .lean();

    if (articles.length === 0) {
      logger.info("No new articles to send to Shopify");
      return;
    }

    logger.info(`Found ${articles.length} articles to send to Shopify`);

    const failedArticles = [];

    for (const article of articles) {
      try {
        // Prepare a handle from title + date
        const handleBase = article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric => hyphens
          .replace(/-+/g, "-")
          .substring(0, 50);
        const dateStr = article.publishedAt.toISOString().split("T")[0].replace(/-/g, "");
        const handle = `${handleBase}-${dateStr}`;

        const input = {
          handle,
          type: "news_articles",
          capabilities: {
            publishable: {
              status: "ACTIVE"
            }
          },
          fields: [
            { key: "uuid", value: article.uuid },
            { key: "publishdate", value: article.publishedAt.toISOString() },
            { key: "title", value: article.title },
            { key: "description", value: article.description || "No description available." },
            { key: "url", value: article.link },
            { key: "attribution", value: article.source },
            { key: "domain", value: article.domain },
            // If "imageUrl" is an actual URL, we pass that. If you store something else, adjust accordingly:
            { key: "image", value: article.imageUrl || "" },
            { key: "tags", value: article.tags ? article.tags.join(", ") : "" }
          ]
        };

        const mutation = `
          mutation MetaobjectCreate($input: MetaobjectCreateInput!) {
            metaobjectCreate(metaobject: $input) {
              metaobject {
                id
                handle
                type
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const response = await axios.post(
          SHOPIFY_API_URL,
          { query: mutation, variables: { input } },
          {
            headers: {
              "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
              "Content-Type": "application/json"
            }
          }
        );

        const { data } = response;
        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const { metaobject, userErrors } = data.data.metaobjectCreate;
        if (userErrors && userErrors.length > 0) {
          const duplicateError = userErrors.find((err) =>
            err.message.includes("Value is already assigned to another metafield")
          );
          if (duplicateError) {
            logger.warn(
              `Article with uuid '${article.uuid}' is a duplicate in Shopify, marking as sent: ${article.link}`
            );
            await Article.updateOne({ _id: article._id }, { sentToShopify: true });
            continue;
          }
          throw new Error(`Shopify user errors: ${JSON.stringify(userErrors)}`);
        }

        if (!metaobject) {
          throw new Error("No metaobject returned from Shopify");
        }

        logger.info(`Successfully sent article to Shopify: ${article.link} (Shopify ID: ${metaobject.id})`);
        await Article.updateOne({ _id: article._id }, { sentToShopify: true });
      } catch (error) {
        logger.error(`Failed to send article to Shopify (${article.link}): ${error.message}`);
        failedArticles.push({ link: article.link, error: error.message });
      }
    }

    if (failedArticles.length > 0) {
      logger.warn(
        `Failed to send ${failedArticles.length} articles to Shopify:\n${JSON.stringify(failedArticles, null, 2)}`
      );
    } else {
      logger.info("All articles sent to Shopify successfully");
    }
  } catch (error) {
    logger.error(`Error in sendArticlesToShopify: ${error.message}`);
    throw error;
  }
}

module.exports = { sendArticlesToShopify };
