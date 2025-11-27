import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import {
  getAllBots,
  getBotStatus,
  sendMessage,
  startBot,
  stopBot,
} from "./twitch-connection";

// HTTP Status codes
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

const app = new Hono();

// Enable CORS for frontend communication
app.use("*", cors());

// Simple auth middleware - check for API secret
function validateApiSecret(authorization: string | undefined): boolean {
  if (!authorization) {
    return false;
  }
  const token = authorization.replace("Bearer ", "");
  return token === env.BOT_API_SECRET;
}

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", bots: getAllBots().length }, HTTP_OK)
);

// List all running bots
app.get("/bots", (c) => {
  if (!validateApiSecret(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
  }
  return c.json({ bots: getAllBots() }, HTTP_OK);
});

// Get bot status for a specific profile
app.get("/bots/:profileId", (c) => {
  if (!validateApiSecret(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
  }
  const profileId = c.req.param("profileId");
  const status = getBotStatus(profileId);
  return c.json(status, HTTP_OK);
});

// Start a bot
app.post("/bots/:profileId/start", async (c) => {
  if (!validateApiSecret(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
  }

  const profileId = c.req.param("profileId");

  try {
    const body = await c.req.json<{
      channel: string;
      accessToken: string;
      username: string;
      commands: Array<{
        trigger: string;
        response: string;
        enabled: boolean;
        cooldown?: number;
      }>;
    }>();

    if (!body.channel) {
      return c.json({ error: "Missing channel" }, HTTP_BAD_REQUEST);
    }
    if (!body.accessToken) {
      return c.json({ error: "Missing access token" }, HTTP_BAD_REQUEST);
    }
    if (!body.username) {
      return c.json({ error: "Missing username" }, HTTP_BAD_REQUEST);
    }

    // Store commands in memory for this bot
    const cachedCommands = body.commands ?? [];

    const success = startBot({
      channel: body.channel,
      accessToken: body.accessToken,
      username: body.username,
      profileId,
      getCommands: async () => cachedCommands,
      onMessage: (message) => {
        // biome-ignore lint/suspicious/noConsole: logging
        console.log(
          `[${profileId}] Message from ${message.displayName}: ${message.message}`
        );
      },
      onCommand: (message, command) => {
        // biome-ignore lint/suspicious/noConsole: logging
        console.log(
          `[${profileId}] Command ${command.trigger} triggered by ${message.displayName}`
        );
      },
    });

    if (success) {
      return c.json({ success: true, message: "Bot started" }, HTTP_OK);
    }
    return c.json({ error: "Failed to start bot" }, HTTP_SERVER_ERROR);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("Failed to start bot:", error);
    return c.json({ error: "Invalid request body" }, HTTP_BAD_REQUEST);
  }
});

// Stop a bot
app.post("/bots/:profileId/stop", (c) => {
  if (!validateApiSecret(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
  }

  const profileId = c.req.param("profileId");
  const success = stopBot(profileId);

  if (success) {
    return c.json({ success: true, message: "Bot stopped" }, HTTP_OK);
  }
  return c.json({ error: "Bot not found or already stopped" }, HTTP_NOT_FOUND);
});

// Update commands for a running bot
app.post("/bots/:profileId/commands", async (c) => {
  if (!validateApiSecret(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
  }

  const profileId = c.req.param("profileId");
  const status = getBotStatus(profileId);

  if (!status.isRunning) {
    return c.json({ error: "Bot not running" }, HTTP_NOT_FOUND);
  }

  try {
    // Parse the body to validate it's proper JSON
    await c.req.json();
    // Commands will be fetched fresh on next message via getCommands callback
    // For now, we'd need to restart the bot to update commands
    return c.json(
      {
        success: true,
        message: "Commands update requires bot restart for now",
      },
      HTTP_OK
    );
  } catch {
    return c.json({ error: "Invalid request body" }, HTTP_BAD_REQUEST);
  }
});

// Send a message to chat
app.post("/bots/:profileId/message", async (c) => {
  if (!validateApiSecret(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
  }

  const profileId = c.req.param("profileId");

  try {
    const body = await c.req.json<{ message: string }>();

    if (!body.message) {
      return c.json({ error: "Missing message" }, HTTP_BAD_REQUEST);
    }

    const success = sendMessage(profileId, body.message);
    if (success) {
      return c.json({ success: true }, HTTP_OK);
    }
    return c.json({ error: "Bot not connected" }, HTTP_BAD_REQUEST);
  } catch {
    return c.json({ error: "Invalid request body" }, HTTP_BAD_REQUEST);
  }
});

// Start server
// biome-ignore lint/suspicious/noConsole: startup logging
console.log(`🤖 Twitch Bot Server starting on port ${env.PORT}...`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
