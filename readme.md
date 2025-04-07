Below is an example README.md you can place in the root of your repository (beans-news/README.md) to guide others on how to run and develop the project with Docker.

markdown
Copy
Edit
# BEANS News

**BEANS News** is an AI-powered platform for curating and summarizing specialty coffee–related articles. It uses a Node.js/Express backend, a React frontend, and MongoDB. This version runs entirely through **Docker Compose**, so you don’t need to install Node or MongoDB locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Project Structure](#project-structure)  
3. [Setup & Configuration](#setup--configuration)  
4. [Running the Project](#running-the-project)  
5. [Stopping the Project](#stopping-the-project)  
6. [Development Notes](#development-notes)  

---

## Prerequisites

- **Docker**: Install Docker Desktop on macOS/Windows or Docker Engine on Linux.  
- **Docker Compose**: Often included with Docker Desktop. If not, install separately.

---

## Project Structure

beans-news/ ├── Dockerfile # Multi-stage Docker build for Node/React ├── docker-compose.yml # Defines services for the app + MongoDB ├── package.json # Only Docker-based scripts ├── .gitignore # Excludes env files, node_modules, etc. ├── README.md # This file ├── server/ │ ├── index.js # Express entry point │ ├── ... # Controllers, routes, models, etc. └── frontend/ ├── public/ │ └── index.html ├── src/ │ └── ... └── package.json

markdown
Copy
Edit

---

## Setup & Configuration

1. **Environment Variables**  
   - You can store environment variables (like `SHOPIFY_ACCESS_TOKEN`, `OPENAI_API_KEY`, etc.) in **`docker-compose.yml`** under the `environment` section for the `beansnews` service.  
   - Or load them from a `.env` file using Docker Compose [env_file](https://docs.docker.com/compose/environment-variables/) if you prefer not to commit them.  
2. **Mongo URI**  
   - In `docker-compose.yml`, the service `mongo` is accessible at `mongodb://mongo:27017/beansnews`.  
   - The Node.js container automatically uses that via `MONGO_URI=mongodb://mongo:27017/beansnews`.

---

## Running the Project

1. **Build and Start**:

   ```bash
   npm run docker:up
This command:

Builds your images (Node app + MongoDB).

Starts the containers.

Runs the server on port 3000 (mapped to your localhost:3000).

Open the App:

In your browser, go to http://localhost:3000.

The React admin UI should appear. If you have scraping endpoints, you can test them at http://localhost:3000/api/....

You’ll see container logs in your terminal. Press Ctrl+C to stop the logs (and also stop the containers when running in the foreground).

Stopping the Project
To stop and remove the containers, networks, etc.:

bash
Copy
Edit
npm run docker:down
This removes everything created by docker-compose up.

Development Notes
Editing Code
Server Code: server/ folder.

Frontend Code: frontend/ folder (React).

When you make changes, re-run:

bash
Copy
Edit
npm run docker:up
to rebuild and see your changes. If you’re iterating frequently, you might prefer a local dev setup, but Docker Compose is simpler for guaranteeing consistent environments.

Additional Tools
docker-compose logs -f beansnews to follow logs for the app container.

docker-compose logs -f mongo for the MongoDB logs.

Production Deployments
This approach can also be used in production with environment variables and volumes for data persistence.

How the Code Works: From Scraping to Shopify Visibility
1. Scraping Articles
The process begins with scraping articles from external sources, such as dailycoffeenews.com, using RSS feeds.

Cron Scheduling (./server/cron/scheduler.js):
The initCronJobs function reads a sources.json file (not provided but referenced) to schedule scraping tasks using the node-cron library.
Each source has a cronSchedule (e.g., 0 0 * * * for daily at midnight), which triggers the scrapeSource function for that source.
A separate publishShopifySchedule can be defined to schedule automatic publishing to Shopify.
Scraping Logic (./server/services/scraper/):
RSS Feed Parsing (rssScraper.js):
Uses the rss-parser library to fetch and parse RSS feeds (e.g., https://dailycoffeenews.com/feed/).
Extracts basic article data like title, link, pubDate, description, and the first image URL using cheerio to parse HTML content in the feed.
Domain-Specific Scraper (dailyCoffeeNewsScraper.js):
Extends the generic RSS scraper by adding logic to extract image dimensions (width, height) if available.
Maps the feed data into a structured format with fields like title, link, source, domain, publishedAt, description, imageUrl, imageWidth, and imageHeight.
Main Scraper (index.js):
The scrapeSource function determines which scraper to use based on the source name (e.g., dailyCoffeeNews).
The scrapeSourceByName function allows manual triggering of scraping for a specific source via an API endpoint.
AI Processing (./server/services/ai/index.js):
After scraping, each article is processed by OpenAI’s GPT-4 model to enrich the data.
The processArticleAI function sends the article’s title, description, and imageUrl to OpenAI with a prompt to return:
category: One of the predefined categories (e.g., "Sustainability", "Market").
geotag: A country name if mentioned, otherwise null.
tags: Up to two relevant tags (e.g., "cafe", "roastery").
improvedDescription: A refined summary (up to 300 words).
The response is parsed as JSON, with fallback values if parsing fails or the response is invalid (e.g., default category to "Market").
Saving to Database:
The scrapeSource function checks for duplicates by link to avoid saving the same article twice.
A new Article document is created in MongoDB with the scraped and AI-processed data, including fields like uuid, title, link, source, domain, publishedAt, description, improvedDescription, imageUrl, imageWidth, imageHeight, category, geotag, tags, and sentToShopify (initially false).
2. Managing Articles in the Frontend
The frontend, built with React and Material-UI, provides an interface to view, edit, and manage articles.

Routing and Navigation (./frontend/src/App.js, NavBar.js):
The app uses react-router-dom for client-side routing.
The NavBar component provides navigation to three main pages: Articles (/), Home (/home), and Scraping (/scraping).
Article Management (useArticles.js, AdminDashboard.js, HomePage.js):
Fetching Articles:
The useArticles hook fetches articles from the backend via the /api/articles endpoint and manages state for loading, errors, and article data.
Admin Dashboard (AdminDashboard.js):
Displays a table (ArticlesTable.js) of all articles with columns for title, category, geotag, sentToShopify, and actions (Edit, Delete).
Users can delete articles, which triggers the deleteArticleById function to remove the article from the database.
Home Page (HomePage.js):
Displays articles as cards (ArticleCard.js) in a grid layout.
Includes a CategoryBar for filtering articles by category (e.g., "Sustainability", "Innovation").
Each card shows the article’s image, title, category, geotag, tags, description, source, domain, publication date, and Shopify status.
Editing Articles (ArticleEdit.js):
Allows users to edit article details like title, description, improvedDescription, imageUrl, category, geotag, and tags.
The useArticles hook provides fetchArticleById to load the article and updateArticleById to save changes.
A "Push to Shopify" button triggers the pushToShopify function to send the article to Shopify (more on this later).
3. Publishing to Shopify
Articles are published to Shopify as metaobjects, which can then be displayed on a Shopify storefront.

Manual Scraping and Publishing (ScrapingPage.js, useScraper.js):
The Scraping page allows users to manually trigger scraping for a specific source by entering its name (e.g., dailyCoffeeNews).
The useScraper hook calls the /api/system/scrape endpoint to scrape articles and the /api/system/publish-shopify endpoint to publish all unsent articles to Shopify.
Feedback messages are displayed for both actions (e.g., "Scrape Complete: Found 5 new articles").
Shopify Service (./server/services/shopifyService.js):
Creating Metaobjects (sendArticlesToShopify):
Queries the database for articles where sentToShopify is false or shopifyMetaobjectId is not null (for updates).
For new articles, constructs a Shopify metaobject with fields like uuid, publishdate, title, description, url, attribution, domain, image, and tags.
Uses the Shopify GraphQL API (metaobjectCreate mutation) to create the metaobject.
Stores the returned metaobject.id in the article’s shopifyMetaobjectId field and sets sentToShopify to true.
Updating Metaobjects (updateArticleInShopify):
If an article has a shopifyMetaobjectId, uses the metaobjectUpdate mutation to update the existing metaobject with the latest data.
Single Article Push (system.controller.js):
The /system/push-to-shopify/:uuid endpoint allows pushing a single article to Shopify, either creating a new metaobject or updating an existing one.
Making Articles Visible on Shopify:
The metaobjects are created with a type of news_articles and a publishable capability set to ACTIVE.
On the Shopify side, you would need to:
Define a metaobject definition for news_articles in the Shopify admin with fields matching those sent (e.g., uuid, title, url, etc.).
Create a storefront page or section that queries these metaobjects using Shopify’s Storefront API or Liquid templates.
For example, a Liquid template might loop through news_articles metaobjects and display them as a news feed.
4. Backend Infrastructure
Server Setup (./server/index.js):
Uses Express.js to set up the backend server.
Connects to MongoDB using Mongoose (database.js) with retry logic.
Serves the React frontend build from ../frontend/build.
Routes API requests to /api endpoints defined in routes/index.js.
Database (Article.js):
Defines the Article schema with fields for article data, metadata, and Shopify status (sentToShopify, shopifyMetaobjectId).
Logging (logger.js):
Uses Winston to log to both the console and a file (beans-news.log).
Error Handling (errorHandler.js):
Catches unhandled errors and returns a JSON response with the error message and status code.
The Solution: Overview
This application is a full-stack system for scraping coffee news articles, enriching them with AI, storing them in a database, managing them via a React frontend, and publishing them to Shopify as metaobjects. Key components include:

Scraping: Automated and manual scraping of RSS feeds with domain-specific logic.
AI Enrichment: Uses OpenAI to categorize articles, extract geotags, generate tags, and improve descriptions.
Frontend Management: A user-friendly interface to view, filter, edit, and publish articles.
Shopify Integration: Publishes articles as metaobjects, with support for both creating and updating.
Advantages
Automation:
Cron jobs automate scraping and Shopify publishing, reducing manual effort.
The useScraper hook allows manual triggering for flexibility.
AI-Powered Enrichment:
OpenAI’s GPT-4 enhances article metadata (category, geotag, tags, description), making the content more structured and useful for display.
User-Friendly Interface:
The React frontend with Material-UI provides a clean, responsive UI.
Features like category filtering, article cards, and an edit form make it easy to manage articles.
Shopify Integration:
Uses Shopify’s metaobjects, which are flexible and can be queried in the storefront.
Supports both creating new metaobjects and updating existing ones, avoiding duplicates.
Error Handling and Logging:
Comprehensive logging with Winston helps debug issues.
Error handling in both frontend and backend ensures the app doesn’t crash unexpectedly.
Scalability:
The scraper architecture supports adding new sources by creating new scraper modules.
MongoDB provides a scalable database for storing articles.
Weak Points
Limited Scraper Flexibility:
The scraper only supports RSS feeds and has hardcoded logic for dailyCoffeeNews. Adding new sources with different structures (e.g., web scraping instead of RSS) requires significant changes.
No retry mechanism for failed scrapes (e.g., network issues).
AI Dependency:
Relies on OpenAI’s GPT-4, which can be costly and may fail if the API is down or the key is invalid.
The AI response parsing is brittle; if OpenAI returns invalid JSON, the fallback values may not always be appropriate.
Shopify Integration Limitations:
The Shopify API version (2023-04) is hardcoded and may become deprecated.
No rate limiting or retry logic for Shopify API calls, which could lead to failures if the API rate limit is exceeded.
The metaobject creation/update logic assumes the news_articles metaobject definition exists in Shopify; there’s no validation or setup assistance.
Frontend Usability:
No confirmation dialogs for critical actions like deleting articles or pushing to Shopify.
The "Push to Shopify" button is available even for articles that haven’t been saved, which could lead to pushing outdated data.
No pagination or infinite scroll for large numbers of articles, which could impact performance.
Security and Authentication:
No user authentication or role-based access control, meaning anyone with access to the app can edit or delete articles.
API endpoints are not protected, making them vulnerable to unauthorized access.
Error Feedback:
Error messages in the frontend are generic (e.g., "Failed to push article to Shopify") and don’t provide detailed information to the user.
No retry mechanism for failed Shopify publishes or scrapes.
Possible Improvements
Enhanced Scraping:
Support More Sources:
Create a more generic scraper framework that supports different types of sources (RSS, web scraping, APIs) using a plugin-like system.
Add configuration options in sources.json for scraper type, selectors, and retry policies.
Retry Logic:
Implement retry logic for failed scrapes using a library like axios-retry.
Error Notifications:
Notify admins (e.g., via email or Slack) if scraping fails repeatedly.
AI Processing:
Cost Optimization:
Use a cheaper model (e.g., GPT-3.5) for initial testing or less critical tasks.
Cache AI responses for similar articles to reduce API calls.
Fallback Mechanism:
Implement a more robust fallback if OpenAI fails, such as using a rule-based system to assign categories and tags.
Validation:
Add stricter validation for AI responses (e.g., ensure geotag is a valid country name using a library like countries-list).
Shopify Integration:
Dynamic API Version:
Make the Shopify API version configurable via environment variables or automatically fetch the latest stable version.
Rate Limiting:
Implement rate limiting and retry logic for Shopify API calls using a library like p-queue or Shopify’s graphql-client with built-in throttling.
Validation:
Add a setup script to validate or create the news_articles metaobject definition in Shopify.
Bulk Operations:
Add support for bulk creating/updating metaobjects to reduce API calls.
Shopify Storefront:
Provide a sample Liquid template or Storefront API query to display the metaobjects on the Shopify storefront.
Frontend Enhancements:
Usability:
Add confirmation dialogs for delete and Shopify push actions.
Disable the "Push to Shopify" button until changes are saved.
Add pagination or infinite scroll to the HomePage and AdminDashboard for better performance with large datasets.
Feedback:
Show more detailed error messages (e.g., "Shopify API rate limit exceeded, please try again later").
Add a "Last Pushed to Shopify" timestamp to the article edit page.
Search and Filtering:
Add search functionality to filter articles by title, source, or tags.
Allow sorting articles by date, category, or Shopify status.
Security:
Authentication:
Add user authentication using a library like passport.js with JWT or OAuth.
Implement role-based access control (e.g., admin vs. editor roles).
API Security:
Protect API endpoints with middleware to check for authentication tokens.
Validate and sanitize user inputs to prevent injection attacks.
Monitoring and Alerts:
Monitoring:
Integrate a monitoring tool like Prometheus or New Relic to track app performance, API response times, and error rates.
Alerts:
Set up alerts for critical failures (e.g., MongoDB connection issues, Shopify API failures) using a service like Sentry or PagerDuty.
Testing:
Unit Tests:
Add unit tests for the scraper, AI processing, and Shopify service using a framework like Jest.
End-to-End Tests:
Write end-to-end tests for the frontend using Cypress to simulate user interactions (e.g., scraping, editing, publishing).
Mocking:
Mock external APIs (OpenAI, Shopify) during testing to avoid hitting real endpoints.
Performance:
Database Indexing:
Add indexes on frequently queried fields like link, uuid, and sentToShopify to improve query performance.
Caching:
Cache article data in the frontend using a library like react-query to reduce API calls.
Cache Shopify metaobject IDs in Redis to avoid repeated database queries.
Documentation:
Add a README.md with setup instructions, environment variable requirements, and a guide for adding new scrapers.
Document the Shopify metaobject setup process and how to display articles on the storefront.
Conclusion
This application provides a solid foundation for scraping, managing, and publishing coffee news articles to Shopify. Its strengths lie in automation, AI enrichment, and a user-friendly interface, but it has weaknesses in scraper flexibility, Shopify integration robustness, and security. By implementing the suggested improvements, the app can become more scalable, secure, and user-friendly, makin
