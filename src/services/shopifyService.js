// File: ./src/services/shopifyService.js
const axios = require('axios');
const logger = require('../config/logger');
const Article = require('../models/Article');

// Shopify GraphQL API endpoint
const SHOPIFY_API_URL = 'https://b4cd1f-0d.myshopify.com/admin/api/2023-04/graphql.json';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  logger.error('SHOPIFY_ACCESS_TOKEN is not defined in the environment variables');
  throw new Error('SHOPIFY_ACCESS_TOKEN is required');
}

/**
 * Sends articles to Shopify as metaobjects.
 * @returns {Promise<void>}
 */
async function sendArticlesToShopify() {
  try {
    // Fetch articles that haven't been sent to Shopify
    const articles = await Article.find({ sentToShopify: { $ne: true } })
      .select('title link source publishedAt description domain image tags _id')
      .lean();

    if (articles.length === 0) {
      logger.info('No new articles to send to Shopify');
      return;
    }

    logger.info(`Found ${articles.length} articles to send to Shopify`);

    const failedArticles = [];

    for (const article of articles) {
      try {
        // Prepare the Shopify metaobject input
        const handle = article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
          .replace(/-+/g, '-') // Collapse multiple hyphens
          .substring(0, 50) + '-' + article.publishedAt.toISOString().split('T')[0].replace(/-/g, '');

        const input = {
          handle,
          type: 'news_articles',
          capabilities: {
            publishable: {
              status: 'ACTIVE',
            },
          },
          fields: [
            { key: 'uuid', value: article._id.toString() },
            { key: 'publishdate', value: article.publishedAt.toISOString() },
            { key: 'title', value: article.title },
            { key: 'description', value: article.description || 'No description available.' },
            { key: 'url', value: article.link },
            { key: 'attribution', value: article.source },
            { key: 'domain', value: article.domain },
            { key: 'image', value: article.image?.filename_disk || '' },
            { key: 'tags', value: article.tags.join(', ') },
          ],
        };

        // GraphQL mutation
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

        // Send the request to Shopify
        const response = await axios.post(
          SHOPIFY_API_URL,
          {
            query: mutation,
            variables: { input },
          },
          {
            headers: {
              'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
              'Content-Type': 'application/json',
            },
          }
        );

        const { data } = response;

        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const { metaobject, userErrors } = data.data.metaobjectCreate;

        if (userErrors && userErrors.length > 0) {
          const duplicateError = userErrors.find(err => err.message.includes('Value is already assigned to another metafield'));
          if (duplicateError) {
            logger.warn(`Article with UUID ${article._id} already exists in Shopify, marking as sent: ${article.link}`);
            await Article.updateOne({ _id: article._id }, { sentToShopify: true });
            continue;
          }
          throw new Error(`Shopify user errors: ${JSON.stringify(userErrors)}`);
        }

        if (!metaobject) {
          throw new Error('No metaobject returned from Shopify');
        }

        logger.info(`Successfully sent article to Shopify: ${article.link} (Shopify ID: ${metaobject.id})`);

        // Mark the article as sent
        await Article.updateOne({ _id: article._id }, { sentToShopify: true });

      } catch (error) {
        logger.error(`Failed to send article to Shopify (${article.link}): ${error.message}`);
        failedArticles.push({ link: article.link, error: error.message });
      }
    }

    if (failedArticles.length > 0) {
      logger.warn(`Failed to send ${failedArticles.length} articles to Shopify: ${JSON.stringify(failedArticles, null, 2)}`);
    } else {
      logger.info('All articles sent to Shopify successfully');
    }

  } catch (error) {
    logger.error(`Error in sendArticlesToShopify: ${error.message}`);
    throw error;
  }
}

module.exports = { sendArticlesToShopify };