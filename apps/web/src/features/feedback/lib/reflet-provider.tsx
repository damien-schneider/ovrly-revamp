import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { RefletProvider } from "reflet-sdk/react";
import { env } from "@/env";

interface RefletAuthProviderProps {
  children: ReactNode;
}

export function RefletAuthProvider({ children }: RefletAuthProviderProps) {
  const { isAuthenticated } = useConvexAuth();
  // Only query for user when authenticated to avoid throwing on login page
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");

  // Don't block rendering if Reflet key is not configured
  if (!env.VITE_REFLET_KEY) {
    return <>{children}</>;
  }

  return (
    <RefletProvider
      publicKey={env.VITE_REFLET_KEY}
      user={
        user
          ? {
              id: user._id,
              email: user.email ?? undefined,
              name: user.name ?? undefined,
              avatar: user.image ?? undefined,
            }
          : undefined
      }
    >
      {children}
    </RefletProvider>
  );
}
