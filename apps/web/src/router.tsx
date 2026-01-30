import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { env } from "@/env";
import { AuthErrorBoundary } from "@/features/auth/components/auth-error-boundary";
import { RefletAuthProvider } from "@/features/feedback/lib/reflet-provider";
import Loader from "@/features/layout/components/loader";
import { authClient } from "@/lib/auth-client";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const convex = new ConvexReactClient(env.VITE_CONVEX_URL, {
    unsavedChangesWarning: false,
  });

  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    context: { convexClient: convex },
    Wrap: ({ children }) => (
      <AuthErrorBoundary>
        <ConvexBetterAuthProvider authClient={authClient} client={convex}>
          <RefletAuthProvider>{children}</RefletAuthProvider>
        </ConvexBetterAuthProvider>
      </AuthErrorBoundary>
    ),
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
