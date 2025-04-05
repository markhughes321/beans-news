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

