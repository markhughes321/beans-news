const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");
const { scrapeSource } = require("../services/scraper");
const { sendArticlesToShopify } = require("../services/shopifyService");

function initCronJobs() {
  const configPath = path.join(__dirname, "../config/sources.json");
  if (!fs.existsSync(configPath)) {
    logger.warn("No sources.json found. No cron jobs will be scheduled.");
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const { sources = [], publishShopifySchedule } = config;

  sources.forEach((source) => {
    if (!source.cronSchedule) {
      logger.warn("No cronSchedule specified, skipping", { source: source.name });
      return;
    }
    logger.info("Scheduling cron job for source", { source: source.name, schedule: source.cronSchedule });
    cron.schedule(source.cronSchedule, async () => {
      logger.info("CRON: Starting scrape", { source: source.name });
      try {
        const newCount = await scrapeSource(source);
        logger.info("CRON: Scrape completed", { source: source.name, newArticles: newCount });
      } catch (err) {
        logger.error("CRON: Scrape error", { source: source.name, error: err.message });
      }
    });
  });

  if (publishShopifySchedule) {
    logger.info("Scheduling Shopify publish", { schedule: publishShopifySchedule });
    cron.schedule(publishShopifySchedule, async () => {
      logger.info("CRON: Starting Shopify publish");
      try {
        await sendArticlesToShopify();
        logger.info("CRON: Shopify publish completed");
      } catch (err) {
        logger.error("CRON: Shopify publish error", { error: err.message });
      }
    });
  } else {
    logger.warn("No publishShopifySchedule set in sources.json");
  }
}

module.exports = { initCronJobs };