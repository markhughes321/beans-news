# Beans News Aggregator

A Node.js application to aggregate coffee-related news from RSS feeds, web scraping, and APIs.

## Setup

### Prerequisites
- Node.js v18+ (`sudo apt-get install -y nodejs npm`)
- Docker (`sudo apt-get install -y docker.io`)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/beans-news-aggregator.git
   cd beans-news-aggregator
Install dependencies:
bash

Collapse

Wrap

Copy
npm install
Configure environment:
bash

Collapse

Wrap

Copy
cp .env.example .env
nano .env
Example .env:
text

Collapse

Wrap

Copy
MONGO_URI="mongodb://127.0.0.1:27017/beansNews"
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
SCHEDULE_CRON="0 6 * * *"
ENABLE_RSS=true
ENABLE_SCRAPING=false
ENABLE_API=false
Run MongoDB:
bash

Collapse

Wrap

Copy
docker run -d -p 27017:27017 --name beansMongo mongo:latest
Running the Application
Start in Background (Recommended)
Use PM2 to run the server persistently:

bash

Collapse

Wrap

Copy
npm install pm2 -g
pm2 start src/server.js --name beans-news
pm2 save
pm2 startup  # Follow instructions to enable on reboot
Monitor Logs
bash

Collapse

Wrap

Copy
pm2 logs beans-news
Stop or Restart
bash

Collapse

Wrap

Copy
pm2 stop beans-news
pm2 restart beans-news
Test Locally
bash

Collapse

Wrap

Copy
curl http://localhost:3000/api/articles
API Endpoints
Get All Articles
bash

Collapse

Wrap

Copy
curl http://192.168.0.44:3000/api/articles?page=1&limit=20
Get Article by ID
bash

Collapse

Wrap

Copy
curl http://192.168.0.44:3000/api/articles/<article-id>
Trigger a Service Manually
RSS:
bash

Collapse

Wrap

Copy
curl http://192.168.0.44:3000/api/trigger/rss
Scraping:
bash

Collapse

Wrap

Copy
curl http://192.168.0.44:3000/api/trigger/scraping
API:
bash

Collapse

Wrap

Copy
curl http://192.168.0.44:3000/api/trigger/api
Configuration
Schedule: Edit SCHEDULE_CRON in .env (e.g., "0 6 * * *" for 6 AM daily).
Services: Toggle with ENABLE_RSS, ENABLE_SCRAPING, ENABLE_API (true/false).
Troubleshooting
Check MongoDB:
bash

Collapse

Wrap

Copy
docker ps
docker logs beansMongo
Verify server port:
bash

Collapse

Wrap

Copy
netstat -tuln | grep 3000
Reinstall dependencies:
bash

Collapse

Wrap

Copy
rm -rf node_modules package-lock.json
npm install
text

Collapse

Wrap

Copy

#### 2. Create `docs/commands.md`
For a more detailed reference, add this file:

```markdown
# Command Reference

## Setup Commands
- Install Node.js:
  ```bash
  sudo apt-get update
  sudo apt-get install -y nodejs npm
Install Docker:
bash

Collapse

Wrap

Copy
sudo apt-get install -y docker.io
Install dependencies:
bash

Collapse

Wrap

Copy
npm install
Run MongoDB:
bash

Collapse

Wrap

Copy
docker run -d -p 27017:27017 --name beansMongo mongo:latest
Runtime Commands
Start with PM2:
bash

Collapse

Wrap

Copy
pm2 start src/server.js --name beans-news
pm2 save
pm2 startup
Stop:
bash

Collapse

Wrap

Copy
pm2 stop beans-news
Restart:
bash

Collapse

Wrap

Copy
pm2 restart beans-news
View logs:
bash

Collapse

Wrap

Copy
pm2 logs beans-news
tail -f logs/combined.log
tail -f logs/error.log
Testing Commands
Test API locally:
bash

Collapse

Wrap

Copy
curl http://localhost:3000/api/articles
Check port:
bash

Collapse

Wrap

Copy
netstat -tuln | grep 3000
text

Collapse

Wrap

Copy

#### 3. Create `scripts/` Directory with Shell Scripts
Add these to automate common tasks:

- **`scripts/start.sh`**:
  ```bash
  #!/bin/bash
  npm install pm2 -g
  pm2 start src/server.js --name beans-news
  pm2 save
  pm2 startup
scripts/stop.sh:
bash

Collapse

Wrap

Copy
#!/bin/bash
pm2 stop beans-news
scripts/restart.sh:
bash

Collapse

Wrap

Copy
#!/bin/bash
pm2 restart beans-news
scripts/logs.sh:
bash

Collapse

Wrap

Copy
#!/bin/bash
pm2 logs beans-news
Make executable:
bash

Collapse

Wrap

Copy
mkdir scripts
chmod +x scripts/*.sh
4. Create requests.http for API Requests
Store this in the root or docs/:

http

Collapse

Wrap

Copy
### Get All Articles
GET http://192.168.0.44:3000/api/articles?page=1&limit=20

### Get Article by ID
GET http://192.168.0.44:3000/api/articles/<article-id>

### Trigger RSS Service
GET http://192.168.0.44:3000/api/trigger/rss

### Trigger Scraping Service
GET http://192.168.0.44:3000/api/trigger/scraping

### Trigger API Service
GET http://192.168.0.44:3000/api/trigger/api
Usage: Open in VS Code with the REST Client extension, or convert to curl commands manually.
Where to Store These Files
Project Root:
README.md
.env
.env.example
requests.http (optional)
New Directories:
docs/commands.md
scripts/start.sh, scripts/stop.sh, etc.
Updated Project Structure
text

Collapse

Wrap

Copy
beans-news/
├── .gitignore
├── .env
├── .env.example
├── package.json
├── README.md
├── requests.http
├── docs/
│   └── commands.md
├── scripts/
│   ├── start.sh
│   ├── stop.sh
│   ├── restart.sh
│   └── logs.sh
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── logger.js
│   ├── models/
│   │   └── Article.js
│   ├── routes/
│   │   ├── articleRoutes.js
│   │   └── triggerRoutes.js
│   ├── services/
│   │   ├── rssService.js
│   │   ├── scrapingService.js
│   │   └── apiService.js
│   ├── jobs/
│   │   └── scheduler.js
│   ├── controllers/
│   │   ├── articleController.js
│   │   └── triggerController.js
│   ├── app.js
│   └── server.js
How to Access in the Future
Local Access:
Open README.md in any text editor or Markdown viewer.
Run scripts from scripts/ (e.g., ./scripts/start.sh).
Use requests.http with a REST client.
Git Repository:
Push to GitHub/GitLab:
bash

Collapse

Wrap

Copy
git init
git add .
git commit -m "Initial commit with updated code and docs"
git remote add origin https://github.com/<your-username>/beans-news-aggregator.git
git push -u origin main
Access via the web interface or clone later.
Raspberry Pi:
SSH into mark@raspberrypi and navigate to ~/Repositories/beans-news/.
Final Steps Tonight
Create the files above on your Raspberry Pi:
bash

Collapse

Wrap

Copy
nano README.md  # Paste content
mkdir docs scripts
nano docs/commands.md  # Paste content
nano scripts/start.sh  # Paste content
# Repeat for other scripts
chmod +x scripts/*.sh
nano requests.http  # Paste content
Test a command:
bash

Collapse

Wrap

Copy
./scripts/start.sh
curl http://192.168.0.44:3000/api/trigger/rss
Commit to Git (optional):
bash

Collapse

Wrap

Copy
git add .
git commit -m "Added commands and requests documentation"
git push