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

  // For each source, schedule a cron job based on cronSchedule
  sources.forEach((source) => {
    if (!source.cronSchedule) {
      logger.warn(`No cronSchedule specified for source '${source.name}'. Skipping scheduling.`);
      return;
    }
    cron.schedule(source.cronSchedule, async () => {
      logger.info(`CRON: Starting scrape for source '${source.name}'...`);
      try {
        const newCount = await scrapeSource(source);
        logger.info(`CRON: Finished scraping '${source.name}'. Found ${newCount} new articles.`);
      } catch (err) {
        logger.error(`CRON: Scrape error for source '${source.name}'`, { error: err });
      }
    });
  });

  // Schedule Shopify publishing if configured
  if (publishShopifySchedule) {
    cron.schedule(publishShopifySchedule, async () => {
      logger.info("CRON: Starting daily publish to Shopify...");
      try {
        await sendArticlesToShopify();
      } catch (err) {
        logger.error("CRON: Shopify publish error", { error: err });
      }
    });
  } else {
    logger.warn("No publishShopifySchedule set in sources.json. Shopify publishing not scheduled automatically.");
  }
}

module.exports = { initCronJobs };
