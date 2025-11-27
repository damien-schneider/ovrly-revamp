# Web App Dockerfile
# Multi-stage build for TanStack Start / Vite app

FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/backend/package.json ./packages/backend/
COPY packages/twitch-bot/package.json ./packages/twitch-bot/
RUN bun install --frozen-lockfile

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

# Production image
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/package.json ./

# Install only production dependencies for serve
RUN bun install --production --frozen-lockfile || true

EXPOSE 3001

# Use vite preview to serve the built app
CMD ["bun", "run", "serve", "--", "--host", "0.0.0.0", "--port", "3001"]
