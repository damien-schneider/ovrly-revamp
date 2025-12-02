# Coolify Deployment Guide for Ovrly

Deploy Ovrly on [Coolify](https://coolify.io/) using **Convex Cloud** for the database.

## Prerequisites

1. A Coolify instance
2. A [Convex Cloud](https://convex.dev) account and project
3. A Twitch Developer application at [dev.twitch.tv](https://dev.twitch.tv/console/apps)

## Quick Start

### 1. Setup Convex Cloud

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Create a new project
3. Copy your **Deployment URL** (looks like `https://xxx-xxx-xxx.convex.cloud`)

### 2. Create Twitch Application

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Set OAuth Redirect URL to: `https://app.yourdomain.com/api/auth/callback/twitch`
4. Copy **Client ID** and generate **Client Secret**

### 3. Deploy Convex Functions

From your local machine:

```bash
cd packages/backend
bunx convex deploy
```

Then set environment variables in Convex:

```bash
bunx convex env set SITE_URL "https://xxx-xxx-xxx.convex.cloud"
bunx convex env set WEB_APP_ORIGIN "https://app.yourdomain.com"
bunx convex env set TWITCH_CLIENT_ID "your_twitch_client_id"
bunx convex env set TWITCH_CLIENT_SECRET "your_twitch_client_secret"
bunx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

### 4. Deploy to Coolify

1. Create a new **Docker Compose** resource in Coolify
2. Connect your GitHub repository
3. Set docker-compose file path: `docker-compose.coolify.yml`
4. Add environment variables:

```env
CONVEX_URL=https://xxx-xxx-xxx.convex.cloud
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
BOT_URL=https://bot.yourdomain.com
```

5. Configure domains in Coolify UI:
   - **Web**: `app.yourdomain.com`
   - **Bot**: `bot.yourdomain.com`

6. Deploy!

## Architecture

```
┌─────────────────────────────────────────┐     ┌──────────────────┐
│            Coolify Server               │     │   Convex Cloud   │
├─────────────────────────────────────────┤     ├──────────────────┤
│  ┌─────────────┐    ┌─────────────┐    │     │                  │
│  │   Web App   │    │  Bot Server │────┼────▶│   Database &     │
│  │   :3001     │    │   :3002     │    │     │   Functions      │
│  └─────────────┘    └─────────────┘    │     │                  │
└─────────────────────────────────────────┘     └──────────────────┘
```

## Environment Variables

### Coolify UI

| Variable             | Required | Description                          |
|----------------------|----------|--------------------------------------|
| `CONVEX_URL`         | ✅       | Convex Cloud deployment URL          |
| `TWITCH_CLIENT_ID`   | ✅       | Twitch app client ID                 |
| `TWITCH_CLIENT_SECRET`| ✅      | Twitch app client secret             |
| `BOT_URL`            | ✅       | Public URL for bot server            |

### Convex Dashboard (via `bunx convex env set`)

| Variable              | Description                        |
|-----------------------|------------------------------------|
| `SITE_URL`            | Your Convex deployment URL         |
| `WEB_APP_ORIGIN`      | Web app URL for CORS               |
| `TWITCH_CLIENT_ID`    | Same as Coolify                    |
| `TWITCH_CLIENT_SECRET`| Same as Coolify                    |
| `BETTER_AUTH_SECRET`  | Session encryption (generate once) |

## Troubleshooting

### Auth not working
- Check Twitch redirect URL matches exactly: `https://app.yourdomain.com/api/auth/callback/twitch`
- Verify Convex env vars: `bunx convex env list`
- WEB_APP_ORIGIN must match your web app URL exactly

### Bot not connecting
- Verify BOT_URL is accessible publicly
- Check bot container logs in Coolify

### CORS errors
- Ensure WEB_APP_ORIGIN in Convex matches your web domain exactly (including https://)
