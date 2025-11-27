// Environment configuration for the Twitch bot
// These are loaded from process.env

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  // Convex
  CONVEX_URL: requireEnv("CONVEX_URL"),

  // Bot server
  PORT: Number.parseInt(optionalEnv("PORT", "3002"), 10),
  BOT_API_SECRET: requireEnv("BOT_API_SECRET"), // Secret for authenticating requests from frontend

  // Twitch (for token refresh)
  TWITCH_CLIENT_ID: requireEnv("TWITCH_CLIENT_ID"),
  TWITCH_CLIENT_SECRET: requireEnv("TWITCH_CLIENT_SECRET"),
};
