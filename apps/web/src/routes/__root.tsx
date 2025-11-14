import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  fetchSession,
  getCookieName,
} from "@convex-dev/better-auth/react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { createAuth } from "@ovrly-revamp/backend/convex/auth";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequest } from "@tanstack/react-start/server";
import type { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import appCss from "../index.css?url";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { session } = await fetchSession(getRequest());
  const sessionCookieName = getCookieName(createAuth);
  const token = getCookie(sessionCookieName);
  return {
    userId: session?.user.id,
    token,
  };
});

export type RouterAppContext = {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  userId?: string;
  token?: string;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "My App",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
  beforeLoad: async (ctx) => {
    const { userId, token } = await fetchAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return { userId, token };
  },
});

function RootDocument() {
  const context = useRouteContext({ from: Route.id });
  return (
    <ConvexBetterAuthProvider
      authClient={authClient}
      client={context.convexClient}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <html lang="en" suppressHydrationWarning>
          <head>
            <HeadContent />
            {import.meta.env.DEV && (
              <script
                crossOrigin="anonymous"
                data-enabled="true"
                src="//unpkg.com/react-grab/dist/index.global.js"
              />
            )}
          </head>
          <body>
            <Outlet />
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-right" />
            <Scripts />
          </body>
        </html>
      </ThemeProvider>
    </ConvexBetterAuthProvider>
  );
}
