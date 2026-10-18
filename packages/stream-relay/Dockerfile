# Stream Relay Server Dockerfile
# Bun image + FFmpeg for receiving browser media and relaying to Twitch RTMP

FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY packages/stream-relay/package.json ./packages/stream-relay/
RUN bun install

# Production image with FFmpeg
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy node_modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY packages/stream-relay ./packages/stream-relay

WORKDIR /app/packages/stream-relay

EXPOSE 3003

CMD ["bun", "run", "start"]
