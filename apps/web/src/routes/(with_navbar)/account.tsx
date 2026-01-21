import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery as useConvexQuery } from "convex/react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/(with_navbar)/account")({
  beforeLoad: ({ context, location }) => {
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

interface LinkedAccount {
  id: string;
  providerId: string;
  accountId: string;
}

function RouteComponent() {
  const { twitchUsername, isLoading: isLoadingProvider } = useProviderData();
  const provider = useConvexQuery(api.auth.getCurrentProvider);

  // Fetch all linked accounts
  const { data: linkedAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ["linked-accounts"],
    queryFn: async () => {
      const response = await authClient.listAccounts();
      return (response.data ?? []) as LinkedAccount[];
    },
  });

  const handleConnectTwitch = async () => {
    try {
      await authClient.signIn.social({
        provider: "twitch",
        callbackURL: `${window.location.origin}/account`,
      });
    } catch {
      toast.error("Failed to connect Twitch account");
    }
  };

  const handleLinkTwitch = async () => {
    try {
      await authClient.linkSocial({
        provider: "twitch",
        callbackURL: `${window.location.origin}/account`,
      });
    } catch {
      toast.error("Failed to link Twitch account");
    }
  };

  const handleUnlinkAccount = async (providerId: string, accountId: string) => {
    try {
      const response = await authClient.unlinkAccount({
        providerId,
        accountId,
      });
      if (response.error) {
        toast.error(`Failed to unlink: ${response.error.message}`);
        return;
      }
      toast.success("Account unlinked successfully");
      await refetchAccounts();
    } catch {
      toast.error("Failed to unlink account");
    }
  };

  const renderTwitchConnection = () => {
    if (isLoadingProvider || provider === undefined) {
      return <p>Loading...</p>;
    }

    // Show connected if Better Auth has Twitch account (token is automatically available via getAccessToken)
    const isConnected = provider === "twitch";
    const twitchAccounts =
      linkedAccounts?.filter((acc) => acc.providerId === "twitch") ?? [];

    return (
      <div className="space-y-4">
        {twitchAccounts.length > 0 ? (
          <div className="space-y-3">
            <p className="font-medium text-sm">Linked Twitch Accounts:</p>
            {twitchAccounts.map((account) => (
              <div
                className="flex items-center justify-between rounded-lg border p-3"
                key={account.id}
              >
                <div>
                  <p className="font-medium">Twitch ID: {account.accountId}</p>
                  {twitchUsername && account === twitchAccounts[0] && (
                    <p className="text-muted-foreground text-sm">
                      @{twitchUsername}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() =>
                    handleUnlinkAccount(account.providerId, account.accountId)
                  }
                  size="sm"
                  variant="destructive"
                >
                  Unlink
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No Twitch account linked</p>
        )}

        <div className="flex gap-2">
          {isConnected ? (
            <Button onClick={handleLinkTwitch} variant="outline">
              Link Another Twitch Account
            </Button>
          ) : (
            <Button onClick={handleConnectTwitch}>Connect Twitch</Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl">Account</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Twitch Connection</CardTitle>
          <CardDescription>
            Connect your Twitch account to enable chat overlays
          </CardDescription>
        </CardHeader>
        <CardContent>{renderTwitchConnection()}</CardContent>
      </Card>
    </div>
  );
}
