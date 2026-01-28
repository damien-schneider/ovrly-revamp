import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// CORS handling is required for client side frameworks (SPA)
authComponent.registerRoutes(http, createAuth, { cors: true });

// Fallback route for unmatched paths - redirect to frontend
// This handles edge cases after OAuth callback where the redirect might fail
const webAppOrigin = process.env.WEB_APP_ORIGIN || "http://localhost:3001";

http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async (_, request) => {
    await Promise.resolve();
    const url = new URL(request.url);
    // If there's a one-time token, preserve it in the redirect
    const ott = url.searchParams.get("ott");
    const redirectUrl = ott
      ? `${webAppOrigin}/overlays?ott=${ott}`
      : `${webAppOrigin}/overlays`;
    return Response.redirect(redirectUrl, 302);
  }),
});

export default http;
