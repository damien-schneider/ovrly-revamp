import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { forceLogout } from "@/lib/clear-auth-state";

export interface RouterAppContext {
  convexClient: ConvexReactClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  // Auth state is managed reactively by ConvexBetterAuthProvider
  // Don't check session in beforeLoad as it can cause issues during HMR
  // and create race conditions with the Convex auth state
  component: RootDocument,
});

function RootDocument() {
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
        <Outlet />
        <Toaster richColors />
        {import.meta.env.DEV && (
          <TanStackRouterDevtools position="bottom-right" />
        )}
      </ThemeProvider>
    </HelmetProvider>
  );
}
