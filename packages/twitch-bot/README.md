# Twitch Bot Server

A self-hosted Bun/Hono server that maintains persistent WebSocket connections to Twitch IRC for chat bot functionality.

## Setup

1. Create a `.env` file with the required environment variables:

```env
# Convex
CONVEX_URL=https://your-convex-deployment.convex.cloud

# Bot API Secret (generate a random string)
BOT_API_SECRET=your-secret-key-here

# Twitch OAuth (same as your main app)
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Optional
PORT=3002
```

2. Install dependencies:

```bash
bun install
```

3. Run the server:

```bash
bun run dev  # Development with hot reload
bun run start  # Production
```

## API Endpoints

All endpoints (except `/health`) require `Authorization: Bearer <BOT_API_SECRET>` header.

### Health Check

```
GET /health
```

### List All Bots

```
GET /bots
```

### Get Bot Status

```
GET /bots/:profileId
```

### Start Bot

```
POST /bots/:profileId/start
Body: {
  channel: string,
  accessToken: string,
  username: string,
  commands: Array<{ trigger: string, response: string, enabled: boolean, cooldown?: number }>
}
```

### Stop Bot

```
POST /bots/:profileId/stop
```

### Send Message

```
POST /bots/:profileId/message
Body: { message: string }
```

## Architecture

```
┌─────────────────┐
│  Frontend App   │
│ (TanStack Start)│
└────────┬────────┘
         │ HTTP API
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Twitch Bot     │◄────►│   Twitch IRC    │
│  Server (Bun)   │ WSS  │   (Persistent)  │
└────────┬────────┘      └─────────────────┘
         │
         │ HTTP API
         ▼
┌─────────────────┐
│     Convex      │
│   (Database)    │
└─────────────────┘
```

## Deployment

For production, you can deploy this to:

- **Railway** - Easy deployment with persistent processes
- **Fly.io** - Global edge deployment
- **Any VPS** - DigitalOcean, Linode, AWS EC2, etc.
- **Docker** - Containerized deployment

### Docker Example

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "run", "start"]
```
