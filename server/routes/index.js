const express = require("express");
const router = express.Router();

const articleController = require("../controllers/article.controller");
const systemController = require("../controllers/system.controller");

// Articles
router.get("/articles", articleController.getAllArticles);
router.get("/articles/:uuid", articleController.getArticle);
router.put("/articles/:uuid", articleController.updateArticle);
router.delete("/articles/:uuid", articleController.deleteArticle);

// Manual scraping
router.post("/system/scrape", systemController.triggerScrape);

// Manual AI processing
router.post("/system/process-ai", systemController.triggerAIProcessing);

// Manually send new articles to Shopify
router.post("/system/publish-shopify", systemController.triggerShopifyPublish);

// Push a single article to Shopify
router.post("/system/push-to-shopify/:uuid", systemController.pushArticleToShopify);

module.exports = router;