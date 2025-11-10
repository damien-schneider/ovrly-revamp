import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
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
    const userId = (context as { userId?: string }).userId;

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
  const { twitchUsername, isLoading: isLoadingProvider } = useProviderData();
  const provider = useQuery(api.auth.getCurrentProvider);

  const renderTwitchConnection = () => {
    if (isLoadingProvider || provider === undefined) {
      return <p>Loading...</p>;
    }

    // Show connected if Better Auth has Twitch account (token is automatically available via getAccessToken)
    const isConnected = provider === "twitch";

    if (isConnected) {
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
