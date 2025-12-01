import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexReactClient } from "convex/react";
import { AuthErrorBoundary } from "@/components/auth-error-boundary";
import { env } from "@/env";
import Loader from "@/features/layout/components/loader";
import { authClient } from "@/lib/auth-client";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const convex = new ConvexReactClient(env.VITE_CONVEX_URL, {
    unsavedChangesWarning: false,
  });

  const convexQueryClient = new ConvexQueryClient(convex);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: "intent",
      defaultPendingComponent: () => <Loader />,
      defaultNotFoundComponent: () => <div>Not Found</div>,
      context: { queryClient, convexClient: convex, convexQueryClient },
      Wrap: ({ children }) => (
        <AuthErrorBoundary>
          <ConvexBetterAuthProvider
            authClient={authClient}
            client={convexQueryClient.convexClient}
          >
            {children}
          </ConvexBetterAuthProvider>
        </AuthErrorBoundary>
      ),
    }),
    queryClient
  );
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
