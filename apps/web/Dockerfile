# Web App Dockerfile
# Multi-stage build for Vite SPA with nginx

FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/backend/package.json ./packages/backend/
COPY packages/twitch-bot/package.json ./packages/twitch-bot/
RUN bun install

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables needed at build time
ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL
ARG VITE_TWITCH_CLIENT_ID
ARG VITE_BOT_SERVER_URL
ARG VITE_BOT_API_SECRET

ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CONVEX_SITE_URL=$VITE_CONVEX_SITE_URL
ENV VITE_TWITCH_CLIENT_ID=$VITE_TWITCH_CLIENT_ID
ENV VITE_BOT_SERVER_URL=$VITE_BOT_SERVER_URL
ENV VITE_BOT_API_SECRET=$VITE_BOT_API_SECRET

# Build the web app
RUN bun run --filter web build

# Production - use nginx for static file serving
FROM nginx:alpine AS runner

# Copy built assets to nginx html directory
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA fallback configuration - redirect all routes to index.html
RUN echo 'server { \
    listen 3001; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
