beans-news/
├── .env
├── package.json
├── README.md
├── server/
│   ├── config/
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── sources.json
│   ├── controllers/
│   │   ├── article.controller.js
│   │   └── system.controller.js
│   ├── cron/
│   │   └── scheduler.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   │   └── Article.js
│   ├── routes/
│   │   └── index.js
│   ├── services/
│   │   ├── ai/
│   │   │   └── index.js
│   │   ├── scraper/
│   │   │   ├── index.js
│   │   │   └── rssScraper.js
│   │   ├── shopifyService.js
│   │   └── utils.js
│   ├── index.js
│   └── production-server.js (optional)
└── frontend/
    ├── package.json
    ├── public/
    └── src/
        ├── App.js
        ├── components/
        │   ├── ArticlesTable.js
        │   └── NavBar.js
        ├── pages/
        │   ├── AdminDashboard.js
        │   ├── ArticleEdit.js
        │   └── ScrapingPage.js
        ├── services/
        │   └── api.js
        └── index.js
