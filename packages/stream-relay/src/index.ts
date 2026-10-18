import { Hono } from "hono";
import { cors } from "hono/cors";
import { FfmpegPipe } from "./ffmpeg-pipe";

// biome-ignore lint/correctness/noUndeclaredVariables: Bun is the runtime global
const serve = Bun.serve;

const PORT = Number(process.env.PORT) || 3003;
const API_SECRET = process.env.BOT_API_SECRET || "";

const WS_PATH_REGEX = /^\/streams\/([^/]+)\/ws$/;

// Active streams indexed by profileId
const streams = new Map<
  string,
  {
    ffmpeg: FfmpegPipe;
    startedAt: number;
    bytesReceived: number;
  }
>();

const app = new Hono();

// CORS for frontend access
app.use("*", cors());

// Health check (no auth)
app.get("/health", (c) =>
  c.json({ status: "ok", activeStreams: streams.size })
);

// Auth middleware for all /streams routes
app.use("/streams/*", (c, next) => {
  if (!API_SECRET) {
    return next();
  }

  const auth = c.req.header("Authorization");
  if (!auth || auth !== `Bearer ${API_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

// Get stream status
app.get("/streams/:profileId", (c) => {
  const { profileId } = c.req.param();
  const stream = streams.get(profileId);

  if (!stream) {
    return c.json({ active: false });
  }

  return c.json({
    active: stream.ffmpeg.isRunning,
    duration: stream.ffmpeg.duration,
    bytesReceived: stream.bytesReceived,
    stats: stream.ffmpeg.currentStats,
  });
});

// Start streaming (spawns FFmpeg)
app.post("/streams/:profileId/start", async (c) => {
  const { profileId } = c.req.param();

  // Stop existing stream if any
  const existing = streams.get(profileId);
  if (existing?.ffmpeg.isRunning) {
    await existing.ffmpeg.stop();
    streams.delete(profileId);
  }

  const body = await c.req.json<{
    streamKey: string;
    resolution?: "1080p" | "720p";
    framerate?: 30 | 60;
    bitrate?: number;
  }>();

  if (!body.streamKey) {
    return c.json({ error: "streamKey is required" }, 400);
  }

  const ffmpeg = new FfmpegPipe();

  try {
    ffmpeg.start({
      streamKey: body.streamKey,
      resolution: body.resolution ?? "1080p",
      framerate: body.framerate ?? 30,
      bitrate: body.bitrate ?? 4500,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: message }, 500);
  }

  streams.set(profileId, {
    ffmpeg,
    startedAt: Date.now(),
    bytesReceived: 0,
  });

  return c.json({ status: "started" });
});

// Stop streaming
app.post("/streams/:profileId/stop", async (c) => {
  const { profileId } = c.req.param();
  const stream = streams.get(profileId);

  if (!stream) {
    return c.json({ error: "No active stream" }, 404);
  }

  await stream.ffmpeg.stop();
  streams.delete(profileId);

  return c.json({ status: "stopped" });
});

// WebSocket endpoint for receiving media chunks from browser
const server = serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade for /streams/:profileId/ws
    const wsMatch = WS_PATH_REGEX.exec(url.pathname);
    if (wsMatch && req.headers.get("upgrade") === "websocket") {
      const profileId = wsMatch[1];

      // Check auth via query param for WebSocket
      const token = url.searchParams.get("token");
      if (API_SECRET && token !== API_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      const success = server.upgrade(req, { data: { profileId } });
      if (success) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    // Delegate to Hono for REST endpoints
    return app.fetch(req, { ip: server.requestIP(req) });
  },
  websocket: {
    message(ws, message) {
      const { profileId } = ws.data as { profileId: string };
      const stream = streams.get(profileId);

      if (!stream?.ffmpeg.isRunning) {
        return;
      }

      // Write binary chunk to FFmpeg stdin
      const chunk =
        message instanceof ArrayBuffer
          ? Buffer.from(message)
          : Buffer.from(message);
      stream.ffmpeg.write(chunk);
      stream.bytesReceived += chunk.length;
    },
    open(ws) {
      const { profileId } = ws.data as { profileId: string };
      console.log(`[WS] Client connected for stream ${profileId}`);
    },
    close(ws) {
      const { profileId } = ws.data as { profileId: string };
      console.log(`[WS] Client disconnected for stream ${profileId}`);
    },
  },
});

console.log(`[StreamRelay] Server running on port ${server.port}`);
