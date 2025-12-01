import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

const AUTH_TIMEOUT_MS = 30_000; // 30 seconds

export const authClient = createAuthClient({
  baseURL: env.VITE_CONVEX_SITE_URL,
  plugins: [convexClient()],
  fetchOptions: {
    // Add timeout to prevent infinite hanging requests
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  },
});
