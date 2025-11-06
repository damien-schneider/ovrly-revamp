import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import OverlayForm from "@/components/overlay-form";
import OverlayList from "@/components/overlay-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProviderData } from "@/hooks/use-provider-token";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/(with_navbar)/overlays")({
  beforeLoad: ({ context, location }) => {
    // Access userId from parent route context (set in __root.tsx beforeLoad)
    const userId = (context as any).userId;

    if (!userId) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [showForm, setShowForm] = useState(false);
  const {
    providerToken,
    twitchUsername,
    isLoading: isLoadingProvider,
  } = useProviderData();
  const upsertProvider = useMutation(api.provider.upsert);

  const syncTokensFromBetterAuth = useCallback(async () => {
    try {
      // Get access token from better-auth
      const tokenResponse = await authClient.getAccessToken({
        providerId: "twitch",
      });

      if (tokenResponse.error || !tokenResponse.data) {
        return {
          success: false,
          message: "No Twitch access token found",
        };
      }

      const accessToken = tokenResponse.data.accessToken;

      if (!accessToken) {
        return { success: false, message: "No Twitch access token found" };
      }

      // Get account info to retrieve refresh token
      const accountsResponse = await authClient.listAccounts();
      const twitchAccount = accountsResponse.data?.find(
        (account) => account.providerId === "twitch"
      );

      if (!twitchAccount) {
        return { success: false, message: "No Twitch account found" };
      }

      // Note: better-auth doesn't expose refreshToken directly in listAccounts
      // We'll use the access token for both, and better-auth handles refresh internally
      await upsertProvider({
        twitchToken: accessToken,
        twitchRefreshToken: accessToken, // better-auth handles refresh internally
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [upsertProvider]);

  // Attempt to sync tokens when component loads and no provider token exists
  useEffect(() => {
    if (isLoadingProvider || providerToken) {
      return;
    }

    syncTokensFromBetterAuth().catch(() => {
      // Silently fail - user may not have connected Twitch yet
    });
  }, [isLoadingProvider, providerToken, syncTokensFromBetterAuth]);

  const SYNC_DELAY_MS = 2000;

  const renderTwitchConnection = () => {
    if (isLoadingProvider) {
      return <p>Loading...</p>;
    }

    if (providerToken) {
      return (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Connected to Twitch</p>
            {twitchUsername && (
              <p className="text-muted-foreground text-sm">
                Username: {twitchUsername}
              </p>
            )}
          </div>
          <Button onClick={handleConnectTwitch} variant="outline">
            Reconnect
          </Button>
        </div>
      );
    }

    return <Button onClick={handleConnectTwitch}>Connect Twitch</Button>;
  };

  const handleConnectTwitch = async () => {
    try {
      await authClient.signIn.social({
        provider: "twitch",
        callbackURL: "/overlays",
      });
      // After successful sign-in, wait a bit then sync tokens
      setTimeout(async () => {
        const result = await syncTokensFromBetterAuth();
        if (result.success) {
          toast.success("Twitch account connected successfully!");
        } else {
          toast.error(result.message || "Failed to sync tokens");
        }
      }, SYNC_DELAY_MS);
    } catch {
      toast.error("Failed to connect Twitch account");
    }
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Overlays</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your chat overlays and emoji walls
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Create Overlay</Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <OverlayForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Twitch Connection</CardTitle>
          <CardDescription>
            Connect your Twitch account to enable chat overlays
          </CardDescription>
        </CardHeader>
        <CardContent>{renderTwitchConnection()}</CardContent>
      </Card>

      <OverlayList />
    </div>
  );
}
