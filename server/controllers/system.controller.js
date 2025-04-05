const logger = require("../config/logger");
const { scrapeSourceByName } = require("../services/scraper");
const { sendArticlesToShopify } = require("../services/shopifyService");

exports.triggerScrape = async (req, res, next) => {
  try {
    const sourceName = req.query.source || req.body.source; 
    if (!sourceName) {
      return res.status(400).json({ error: "Missing source parameter." });
    }

    const newCount = await scrapeSourceByName(sourceName);
    res.json({
      message: `Scrape triggered for ${sourceName}`,
      newArticles: newCount
    });
  } catch (err) {
    logger.error("Manual scrape error", { error: err });
    next(err);
  }
};

exports.triggerShopifyPublish = async (req, res, next) => {
  try {
    await sendArticlesToShopify();
    res.json({
      message: "Shopify publish process complete."
    });
  } catch (err) {
    logger.error("Manual shopify publish error", { error: err });
    next(err);
  }
};
