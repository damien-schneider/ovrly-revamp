import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /**
   * Client-side environment variables.
   * These are exposed to the browser and must be prefixed with VITE_.
   */
  clientPrefix: "VITE_",

  client: {
    VITE_CONVEX_URL: z.string().url(),
    VITE_CONVEX_SITE_URL: z.string().url(),
    VITE_TWITCH_CLIENT_ID: z.string().min(1, "Twitch Client ID is required"),
    VITE_BOT_SERVER_URL: z.string().url().optional(),
    VITE_BOT_API_SECRET: z.string().optional(),
    VITE_REFLET_KEY: z.string().min(1).optional(),
  },

  /**
   * Runtime environment - for Vite, we use import.meta.env
   */
  runtimeEnv: import.meta.env,

  /**
   * Treat empty strings as undefined for better default value handling
   */
  emptyStringAsUndefined: true,

  /**
   * Skip validation during build to allow for CI/CD pipelines
   * that don't have all env vars set during build
   */
  skipValidation: !!import.meta.env.SKIP_ENV_VALIDATION,
});
