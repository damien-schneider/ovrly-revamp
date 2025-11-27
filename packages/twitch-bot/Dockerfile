# Twitch Bot Server Dockerfile
# Lightweight Bun image for the Hono server

FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY packages/twitch-bot/package.json ./packages/twitch-bot/
COPY packages/backend/package.json ./packages/backend/
RUN bun install --frozen-lockfile

# Production image
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY packages/twitch-bot ./packages/twitch-bot
COPY packages/backend ./packages/backend

WORKDIR /app/packages/twitch-bot

EXPOSE 3002

CMD ["bun", "run", "start"]
