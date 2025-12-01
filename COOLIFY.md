# Coolify Deployment Guide for Ovrly

This guide explains how to deploy Ovrly on [Coolify](https://coolify.io/) with **fully self-hosted Convex**.

## Prerequisites

1. A Coolify instance (self-hosted or cloud) with a wildcard domain configured
2. A Twitch Developer application at [dev.twitch.tv](https://dev.twitch.tv/console/apps)

## Architecture (Fully Self-Hosted)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Coolify Server                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Web App   │    │  Bot Server │    │   Convex Backend    │ │
│  │  (nginx)    │    │   (Bun)     │───▶│   (API + Actions)   │ │
│  │   :3001     │    │   :3002     │    │  3210 API / 3211 HTTP│ │
│  └──────┬──────┘    └─────────────┘    └──────────┬──────────┘ │
│         │                                         │             │
│         │           ┌─────────────────────┐       │             │
│         └──────────▶│  Convex Dashboard   │◀──────┘             │
│                     │      :6791          │                     │
│                     └─────────────────────┘                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   convex-data volume                         │ │
│  │              (SQLite or Postgres/MySQL)                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
    ┌───────────┐
    │  Twitch   │
    │   IRC     │
    └───────────┘
```

## Coolify Magic Variables

Coolify auto-generates URLs for each service. The docker-compose.coolify.yml uses these magic variables:

| Magic Variable                      | Example Value                          | Purpose                     |
| ----------------------------------- | -------------------------------------- | --------------------------- |
| `$SERVICE_URL_WEB`                  | `https://ovrly.example.com`            | Web app public URL          |
| `$SERVICE_URL_CONVEX-BACKEND_3210`  | `https://convex-api.example.com`       | Convex API URL              |
| `$SERVICE_URL_CONVEX-BACKEND_3211`  | `https://convex-site.example.com`      | Convex HTTP/Auth URL        |
| `$SERVICE_URL_BOT`                  | `https://bot.example.com`              | Bot server URL              |
| `$SERVICE_FQDN_CONVEX-DASHBOARD`    | `dashboard.example.com`                | Dashboard domain            |

## Quick Start

### 1. Create Twitch Application

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Set OAuth Redirect URL to: `https://YOUR-CONVEX-SITE-DOMAIN/api/auth/callback/twitch`
   (You'll update this after deployment with the actual Coolify-generated URL)
4. Copy the **Client ID** and generate a **Client Secret**

### 2. Deploy to Coolify

1. In Coolify, create a new **Docker Compose** resource
2. Connect your GitHub repository
3. Set docker-compose file path: `docker-compose.coolify.yml`
4. Add the required environment variables (see below)
5. Deploy!

### 3. Required Environment Variables

Add these in Coolify UI under **Environment Variables**:

```env
# Required secrets (generate each with: openssl rand -hex 32)
INSTANCE_SECRET=<generate-32-char-hex>
BOT_API_SECRET=<generate-32-char-hex>

# Twitch credentials (from step 1)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

> **Tip**: Generate secrets with: `openssl rand -hex 32`

### 4. Generate Admin Key

After the first deployment, SSH into your Coolify server and run:

```bash
# Find your container
docker ps | grep convex-backend

# Generate admin key
docker exec <container_id> ./generate_admin_key.sh
```

Save this key securely - you'll need it to deploy Convex functions and set environment variables.

### 5. Deploy Convex Functions

From your local development machine:

```bash
cd packages/backend

# Set self-hosted environment variables
export CONVEX_SELF_HOSTED_URL=https://your-convex-api-url  # $SERVICE_URL_CONVEX-BACKEND_3210
export CONVEX_SELF_HOSTED_ADMIN_KEY=your_admin_key

# Temporarily move local env to avoid conflicts
mv .env.local .env.local.backup 2>/dev/null || true

# Deploy functions to self-hosted Convex
bunx convex deploy --cmd 'echo "skip"'

# Restore local env
mv .env.local.backup .env.local 2>/dev/null || true
```

### 6. Set Convex Environment Variables

After deploying functions, set the required environment variables in Convex:

```bash
export CONVEX_SELF_HOSTED_URL=https://your-convex-api-url
export CONVEX_SELF_HOSTED_ADMIN_KEY=your_admin_key

# SITE_URL = the Convex HTTP actions URL ($SERVICE_URL_CONVEX-BACKEND_3211)
bunx convex env set SITE_URL "https://your-convex-site-url"

# WEB_APP_ORIGIN = your web app URL ($SERVICE_URL_WEB)
bunx convex env set WEB_APP_ORIGIN "https://your-web-app-url"

# Twitch credentials (same as Coolify env vars)
bunx convex env set TWITCH_CLIENT_ID "your_twitch_client_id"
bunx convex env set TWITCH_CLIENT_SECRET "your_twitch_client_secret"

# Generate and set auth secret
bunx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

### 7. Update Twitch OAuth Redirect URL

Now that you have the actual Coolify URLs, update your Twitch app:

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Edit your application
3. Update OAuth Redirect URL to: `$SERVICE_URL_CONVEX-BACKEND_3211/api/auth/callback/twitch`
   (Replace with your actual Convex site URL from Coolify)

### 8. Verify Deployment

1. Visit your web app URL - you should see the Ovrly landing page
2. Click "Sign in with Twitch" - OAuth flow should work
3. Check the Convex dashboard at your dashboard URL

## Environment Variables Summary

### Coolify Environment Variables

| Variable               | Required | Description                              |
| ---------------------- | -------- | ---------------------------------------- |
| `INSTANCE_SECRET`      | ✅       | Convex instance secret (32+ hex chars)   |
| `BOT_API_SECRET`       | ✅       | Bot API authentication secret            |
| `TWITCH_CLIENT_ID`     | ✅       | Twitch app client ID                     |
| `TWITCH_CLIENT_SECRET` | ✅       | Twitch app client secret                 |
| `INSTANCE_NAME`        | ❌       | Convex instance name (default: "ovrly")  |
| `RUST_LOG`             | ❌       | Convex log level (default: "info")       |

### Convex Environment Variables (set via `bunx convex env set`)

| Variable              | Required | Description                                   |
| --------------------- | -------- | --------------------------------------------- |
| `SITE_URL`            | ✅       | Convex HTTP URL ($SERVICE_URL_CONVEX-BACKEND_3211) |
| `WEB_APP_ORIGIN`      | ✅       | Web app URL ($SERVICE_URL_WEB) for CORS       |
| `TWITCH_CLIENT_ID`    | ✅       | Same as Coolify env                           |
| `TWITCH_CLIENT_SECRET`| ✅       | Same as Coolify env                           |
| `BETTER_AUTH_SECRET`  | ✅       | Session encryption secret                     |

## Local Development with Docker

For local development, use the standard `docker-compose.yml`:

```bash
# Start all services locally
docker compose up -d

# Generate admin key
docker compose exec convex-backend ./generate_admin_key.sh

# Deploy functions locally
cd packages/backend
mv .env.local .env.local.backup
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY="your_key" \
bunx convex deploy --cmd 'echo "skip"'
mv .env.local.backup .env.local

# Set local environment variables
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY="your_key" \
bunx convex env set SITE_URL "http://localhost:3211"

CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY="your_key" \
bunx convex env set WEB_APP_ORIGIN "http://localhost:3001"
```

Access locally:
- Web App: http://localhost:3001
- Convex Dashboard: http://localhost:6791
- Convex API: http://localhost:3210
- Convex HTTP: http://localhost:3211
- Bot Server: http://localhost:3002

## Database Options

### SQLite (Default)

Data is stored in the `convex-data` Docker volume. Simple but not recommended for high-traffic production.

### PostgreSQL (Recommended for Production)

Add to your Coolify environment variables:

```env
POSTGRES_URL=postgresql://user:password@your-postgres-host:5432/ovrly
```

### MySQL

```env
MYSQL_URL=mysql://user:password@your-mysql-host:3306/ovrly
```

## Troubleshooting

### Convex backend won't start

- Check logs: `docker logs <container_id>`
- Verify `INSTANCE_SECRET` is set and is 32+ characters
- Ensure no port conflicts on 3210/3211

### Can't deploy Convex functions

- Verify `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` are set
- Make sure any `.env.local` with `CONVEX_DEPLOYMENT` is moved/renamed
- Check backend health: `curl https://your-convex-api-url/version`

### Auth not working / OAuth errors

1. **Check Twitch redirect URL**: Must exactly match `$SERVICE_URL_CONVEX-BACKEND_3211/api/auth/callback/twitch`
2. **Check Convex env vars**: Run `bunx convex env list` to verify SITE_URL and TWITCH_* are set
3. **Check CORS**: WEB_APP_ORIGIN must match your web app URL

### "state_mismatch" OAuth error

This usually means cookies aren't being set properly. Check:
- SITE_URL matches the Convex HTTP URL (port 3211)
- The Twitch redirect URL matches exactly
- Your browser isn't blocking cookies

### Bot can't connect to Twitch

- Check `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in Coolify env
- Ensure the Twitch app has required scopes: `chat:read`, `chat:edit`, `user:read:email`, `user:read:chat`

### Web app shows white screen

- Check browser console for errors
- Verify VITE_CONVEX_URL and VITE_CONVEX_SITE_URL were set during build
- Try rebuilding the web container

## Upgrading

### Export/Import (Simple, with downtime)

```bash
# Export data
CONVEX_SELF_HOSTED_URL=... CONVEX_SELF_HOSTED_ADMIN_KEY=... bunx convex export --path backup.zip

# Update images and restart in Coolify

# Import data
CONVEX_SELF_HOSTED_URL=... CONVEX_SELF_HOSTED_ADMIN_KEY=... bunx convex import --replace-all backup.zip
```

## Support

- **Convex Self-Hosted**: [Discord #self-hosted](https://discord.gg/convex)
- **Coolify**: [Coolify Discord](https://discord.gg/coolify)
- **Ovrly Issues**: GitHub Issues
