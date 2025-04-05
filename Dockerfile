# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json .
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/
RUN npm install
COPY server/ ./server/
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install && npm run build
WORKDIR /app/server
RUN npm install

# Runtime stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/server /app/server
COPY --from=build /app/frontend/build /app/frontend/build
COPY --from=build /app/package.json /app/
COPY .env /app/
EXPOSE 3000
CMD ["node", "/app/server/index.js"]