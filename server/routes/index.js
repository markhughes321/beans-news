const express = require("express");
const router = express.Router();

const articleController = require("../controllers/article.controller");
const systemController = require("../controllers/system.controller");

// Articles
router.get("/articles", articleController.getAllArticles);
router.get("/articles/:uuid", articleController.getArticle);
router.put("/articles/:uuid", articleController.updateArticle);
router.delete("/articles/:uuid", articleController.deleteArticle);

// Manual scraping: specify source name via request body or query param
// e.g. POST /api/system/scrape?source=dailyCoffeeNews
router.post("/system/scrape", systemController.triggerScrape);

// Manually send new articles to Shopify
router.post("/system/publish-shopify", systemController.triggerShopifyPublish);

module.exports = router;
