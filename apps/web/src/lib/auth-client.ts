import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: env.VITE_CONVEX_SITE_URL,
  // crossDomainClient is REQUIRED for SPAs where frontend and backend are on different origins
  // @ts-expect-error - Better Auth and Convex plugins have slight type mismatches in current versions
  plugins: [convexClient(), crossDomainClient()],
  fetchOptions: {
    // Ensure cookies are sent cross-origin for session persistence
    credentials: "include",
  },
});
