console.log("Loading server/index.js...");

const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const { connectDB } = require("./config/database");
const routes = require("./routes");
const logger = require("./config/logger"); // Ensure logger is loaded early
const errorHandler = require("./middleware/errorHandler");
const { initCronJobs } = require("./cron/scheduler");

// Load .env
const envPath = path.join(__dirname, "..", ".env");
console.log("Attempting to load .env from:", envPath);
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error) {
  console.error("Failed to load .env:", dotenvResult.error.message);
  process.exit(1);
} else {
  logger.info(".env loaded successfully");
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  logger.info("Starting server...", {
    env: {
      PORT: process.env.PORT,
      MONGO_URI: process.env.MONGO_URI,
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN ? "[REDACTED]" : undefined,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "[REDACTED]" : undefined,
    },
  });

  await connectDB();

  const app = express();
  app.use(express.json());

  app.use("/api", routes);

  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });

  app.use(errorHandler);

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  initCronJobs();
}

startServer().catch((error) => {
  logger.error("Error starting server", { error });
  process.exit(1);
});

console.log("Finished loading server/index.js");