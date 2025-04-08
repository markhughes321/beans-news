// File: ./server/routes/index.js
const express = require("express");
const router = express.Router();

const articleController = require("../controllers/article.controller");
const systemController = require("../controllers/system.controller");

router.get("/articles", articleController.getAllArticles);
router.get("/articles/:uuid", articleController.getArticle);
router.put("/articles/:uuid", articleController.updateArticle);
router.delete("/articles/:uuid", articleController.deleteArticle);
router.post("/articles/bulk-delete", articleController.bulkDeleteArticles);
router.post("/articles/bulk-edit", articleController.bulkEditArticles);

router.post("/system/scrape", systemController.triggerScrape);
router.post("/system/process-ai", systemController.triggerAIProcessing);
router.post("/system/publish-shopify", systemController.triggerShopifyPublish);
router.post("/system/push-to-shopify/:uuid", systemController.pushArticleToShopify);
router.put("/system/edit-on-shopify/:uuid", systemController.editArticleOnShopify);
router.post("/system/process-single-ai/:uuid", systemController.processSingleArticleWithAI);

module.exports = router;