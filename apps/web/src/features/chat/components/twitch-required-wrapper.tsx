import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { TwitchLogo, Warning } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProviderData } from "@/hooks/use-provider-token";
import { authClient } from "@/lib/auth-client";

type TwitchRequiredWrapperProps = {
  children: ReactNode;
  featureName?: string;
};

export function TwitchRequiredWrapper({
  children,
  featureName = "this feature",
}: TwitchRequiredWrapperProps) {
  const {
    twitchUsername,
    isLoading: isLoadingProvider,
    tokenError,
    needsReconnect,
  } = useProviderData();
  const provider = useQuery(api.auth.getCurrentProvider);

  const isLoading = isLoadingProvider || provider === undefined;
  const isConnected = provider === "twitch";

  const handleConnectTwitch = async () => {
    try {
      await authClient.signIn.social({
        provider: "twitch",
        callbackURL: window.location.pathname,
      });
    } catch {
      toast.error("Failed to connect Twitch account");
    }
  };

  // Re-link Twitch to get fresh tokens when existing connection has expired
  const handleReconnectTwitch = async () => {
    try {
      // Use linkSocial to refresh the OAuth tokens for an already-linked account
      await authClient.linkSocial({
        provider: "twitch",
        callbackURL: window.location.pathname,
      });
    } catch {
      toast.error("Failed to reconnect Twitch account");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border border-dashed p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
          <TwitchLogo className="h-8 w-8 text-purple-500" weight="fill" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-xl">Twitch Connection Required</h3>
          <p className="max-w-md text-muted-foreground">
            To use {featureName}, you need to connect your Twitch account. This
            allows the bot to read and respond to chat messages in your channel.
          </p>
        </div>
        <Button
          className="gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={handleConnectTwitch}
        >
          <TwitchLogo className="h-5 w-5" weight="fill" />
          Connect with Twitch
        </Button>
      </div>
    );
  }

  // Show error state if token is invalid and needs reconnection
  if (needsReconnect) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border border-red-500/30 bg-red-500/5 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <Warning className="h-8 w-8 text-red-500" weight="fill" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-xl">Twitch Connection Expired</h3>
          <p className="max-w-md text-muted-foreground">
            Your Twitch connection has expired or been revoked. Please reconnect
            your account to continue using {featureName}.
          </p>
          {tokenError && (
            <p className="text-red-500/80 text-sm">
              Error: {tokenError.message}
            </p>
          )}
        </div>
        <Button
          className="gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={handleReconnectTwitch}
        >
          <TwitchLogo className="h-5 w-5" weight="fill" />
          Reconnect with Twitch
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
        <TwitchLogo className="h-5 w-5 text-purple-500" weight="fill" />
        <span className="text-sm">
          Connected as{" "}
          <span className="font-medium">
            {twitchUsername || (
              <span className="text-purple-500/60 italic">loading...</span>
            )}
          </span>
        </span>
      </div>
      {children}
    </>
  );
}
