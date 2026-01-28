import {
  createRootRouteWithContext,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { forceLogout } from "@/lib/clear-auth-state";
import { cn } from "@/lib/utils";

const SESSION_TIMEOUT_MS = 5000;

export interface RouterAppContext {
  convexClient: ConvexReactClient;
  userId?: string;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    try {
      // Try to get the current session with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        SESSION_TIMEOUT_MS
      );

      const session = await authClient.getSession({
        fetchOptions: { signal: controller.signal },
      });

      clearTimeout(timeoutId);

      return {
        userId: session.data?.user?.id,
      };
    } catch {
      // If session fetch fails or times out, return no userId
      return { userId: undefined };
    }
  },
  component: RootDocument,
});

function RootDocument() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCanvasRoute = pathname.startsWith("/overlays");

  // Dev-only: Ctrl+Shift+K to clear auth state and reload
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "K") {
        e.preventDefault();
        toast.info("Clearing auth state...");
        forceLogout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Helmet>
          <title>Ovrly - Stream Overlays Made Simple</title>
          <meta
            content="Create beautiful, customizable stream overlays for Twitch. Chat widgets, emote walls, alerts and more."
            name="description"
          />
        </Helmet>
        <div
          className={cn(
            "min-h-screen",
            isCanvasRoute ? "bg-transparent" : "bg-background text-foreground"
          )}
        >
          <Outlet />
          <Toaster richColors />
          {import.meta.env.DEV && (
            <TanStackRouterDevtools position="bottom-right" />
          )}
        </div>
      </ThemeProvider>
    </HelmetProvider>
  );
}
