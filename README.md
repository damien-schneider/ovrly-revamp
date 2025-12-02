# Ovrly

Stream overlay management platform for Twitch streamers.

## Tech Stack

- **Frontend**: React + Vite + TanStack Router
- **Backend**: Convex (Cloud)
- **Bot**: Hono server for Twitch chat integration
- **Auth**: Better-Auth with Twitch OAuth
- **Styling**: TailwindCSS + shadcn/ui

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.3+)
- [Convex](https://convex.dev) account
- [Twitch Developer](https://dev.twitch.tv) application

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Convex

```bash
bun run dev:backend
```

This will:
- Create a new Convex project (first time)
- Start watching for schema/function changes
- Output your deployment URL

### 3. Configure Environment

Copy `.env` and fill in your values:

```bash
# .env
VITE_TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
VITE_BOT_SERVER_URL=http://localhost:3002
BOT_API_SECRET=dev_secret_for_testing_only
```

### 4. Set Convex Environment Variables

```bash
cd packages/backend
bunx convex env set TWITCH_CLIENT_ID "your_twitch_client_id"
bunx convex env set TWITCH_CLIENT_SECRET "your_twitch_client_secret"
bunx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
bunx convex env set WEB_APP_ORIGIN "http://localhost:3001"
```

### 5. Run Development

In separate terminals:

```bash
# Terminal 1: Convex backend
bun run dev:backend

# Terminal 2: Web app
bun run dev:web

# Terminal 3: Bot server (optional, for chat features)
bun run dev:bot
```

Or run all at once:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Project Structure

```
ovrly/
├── apps/
│   └── web/              # React frontend (Vite)
├── packages/
│   ├── backend/          # Convex functions & schema
│   └── twitch-bot/       # Twitch chat bot server
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all services |
| `bun run dev:web` | Start web app only |
| `bun run dev:backend` | Start Convex dev server |
| `bun run dev:bot` | Start bot server |
| `bun run build` | Build all packages |
| `bun run deploy` | Deploy Convex to production |

## Deployment

See [COOLIFY.md](./COOLIFY.md) for Coolify deployment guide.
