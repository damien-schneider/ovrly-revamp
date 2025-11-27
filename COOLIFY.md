# Coolify Deployment Guide for Ovrly

This guide explains how to deploy Ovrly on [Coolify](https://coolify.io/).

## Prerequisites

1. A Coolify instance (self-hosted or cloud)
2. A Convex account at [convex.dev](https://convex.dev)
3. A Twitch Developer application at [dev.twitch.tv](https://dev.twitch.tv/console/apps)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Coolify Server                    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐         ┌─────────────┐           │
│  │   Web App   │ ──────▶ │  Bot Server │           │
│  │  (port 3001)│         │  (port 3002)│           │
│  └──────┬──────┘         └──────┬──────┘           │
│         │                       │                   │
└─────────┼───────────────────────┼───────────────────┘
          │                       │
          ▼                       ▼
    ┌───────────┐          ┌───────────┐
    │  Convex   │          │  Twitch   │
    │  (Cloud)  │          │   IRC     │
    └───────────┘          └───────────┘
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. In Coolify, create a new **Docker Compose** resource
2. Connect your GitHub repository
3. Set the docker-compose file path: `docker-compose.yml`
4. Add environment variables (see below)
5. Deploy!

### Option 2: Separate Services

Deploy each service individually:

#### Web App

- **Build Pack**: Dockerfile
- **Dockerfile Location**: `apps/web/Dockerfile`
- **Port**: 3001

#### Bot Server

- **Build Pack**: Dockerfile
- **Dockerfile Location**: `packages/twitch-bot/Dockerfile`
- **Port**: 3002

## Environment Variables

### Required for Web App

```
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CONVEX_SITE_URL=https://your-project.convex.site
VITE_TWITCH_CLIENT_ID=your_twitch_client_id
VITE_BOT_SERVER_URL=https://bot.yourdomain.com
VITE_BOT_API_SECRET=your_generated_secret
```

### Required for Bot Server

```
CONVEX_URL=https://your-project.convex.cloud
BOT_API_SECRET=your_generated_secret
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
PORT=3002
```

## Generating Secrets

Generate a secure `BOT_API_SECRET`:

```bash
openssl rand -hex 32
```

## Networking

### Internal Communication

When using Docker Compose, services communicate via the internal network:

- Bot server URL: `http://bot:3002`

### External Access

Configure Coolify to expose:

- Web App: `https://ovrly.yourdomain.com`
- Bot Server: `https://bot.ovrly.yourdomain.com` (or keep internal-only)

## Twitch OAuth Redirect

Update your Twitch app's OAuth redirect URL to:

```
https://your-convex-site.convex.site/api/auth/callback/twitch
```

## Health Checks

- Web App: `GET /` (returns HTML)
- Bot Server: `GET /health` (returns JSON)

## Troubleshooting

### Bot can't connect to Twitch

- Check `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are correct
- Ensure the Twitch app has the required scopes

### Web app can't reach bot server

- Verify `VITE_BOT_SERVER_URL` is accessible from the browser
- Check CORS is enabled (it is by default)
- Ensure `BOT_API_SECRET` matches on both services

### Convex connection issues

- Verify `CONVEX_URL` is your deployment URL, not the dashboard URL
- Check Convex dashboard for deployment status
