import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Doc } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import {
  Circle,
  CloudSlash,
  HardDrives,
  Lightning,
  Plugs,
  PlugsConnected,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBotServer } from "@/hooks/use-bot-server";
import { useProviderData } from "@/hooks/use-provider-token";
import { authClient } from "@/lib/auth-client";

// Badge component helpers to reduce complexity
function ServerOfflineBadge() {
  return (
    <Badge className="gap-1.5 bg-red-500/10 text-red-500" variant="outline">
      <CloudSlash className="h-3.5 w-3.5" weight="fill" />
      Server Offline
    </Badge>
  );
}

function ErrorBadge({ label = "Error" }: { label?: string }) {
  return (
    <Badge className="gap-1.5 bg-red-500/10 text-red-500" variant="outline">
      <Warning className="h-3.5 w-3.5" weight="fill" />
      {label}
    </Badge>
  );
}

function DisabledBadge() {
  return (
    <Badge className="gap-1.5 bg-zinc-500/10 text-zinc-500" variant="outline">
      <Circle className="h-3.5 w-3.5" weight="fill" />
      Disabled
    </Badge>
  );
}

function LoadingBadge({ label }: { label: string }) {
  return (
    <Badge className="gap-1.5 bg-blue-500/10 text-blue-500" variant="outline">
      <SpinnerGap className="h-3.5 w-3.5 animate-spin" weight="bold" />
      {label}
    </Badge>
  );
}

function ActiveBadge() {
  return (
    <Badge className="gap-1.5 bg-green-500/10 text-green-500" variant="outline">
      <Lightning className="h-3.5 w-3.5" weight="fill" />
      Active
    </Badge>
  );
}

function ConnectingBadge() {
  return (
    <Badge
      className="gap-1.5 bg-yellow-500/10 text-yellow-500"
      variant="outline"
    >
      <PlugsConnected className="h-3.5 w-3.5" weight="fill" />
      Connecting...
    </Badge>
  );
}

function OfflineBadge() {
  return (
    <Badge
      className="gap-1.5 bg-yellow-500/10 text-yellow-500"
      variant="outline"
    >
      <Plugs className="h-3.5 w-3.5" weight="fill" />
      Offline
    </Badge>
  );
}

function getLoadingLabel(isStarting: boolean, isStopping: boolean): string {
  if (isStarting) {
    return "Starting...";
  }
  if (isStopping) {
    return "Stopping...";
  }
  return "Loading...";
}

// Helper to format commands for the bot API
function formatCommands(commands: Doc<"commands">[]) {
  return commands.map((cmd) => ({
    trigger: cmd.trigger,
    response: cmd.response,
    enabled: cmd.enabled,
    cooldown: cmd.cooldown,
  }));
}

// Token error type from provider hook
type TokenError = {
  code: string;
  message: string;
  status?: number;
};

// Determine which badge to show based on state
function StatusBadge({
  isServerOffline,
  tokenError,
  hasError,
  isRunning,
  isInLoadingState,
  isStarting,
  isStopping,
  isWaitingForChannel,
  isConnected,
}: {
  isServerOffline: boolean;
  tokenError: TokenError | null;
  hasError: boolean;
  isRunning: boolean;
  isInLoadingState: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isWaitingForChannel: boolean;
  isConnected: boolean;
}) {
  if (isServerOffline) {
    return <ServerOfflineBadge />;
  }
  if (tokenError) {
    return <ErrorBadge label="Token Error" />;
  }
  if (hasError) {
    return <ErrorBadge />;
  }
  if (!isRunning) {
    return <DisabledBadge />;
  }
  if (isInLoadingState) {
    const label = getLoadingLabel(isStarting, isStopping);
    return <LoadingBadge label={label} />;
  }
  if (isWaitingForChannel) {
    return <LoadingBadge label="Loading..." />;
  }
  if (isConnected) {
    return <ActiveBadge />;
  }
  if (isRunning) {
    return <ConnectingBadge />;
  }
  return <OfflineBadge />;
}

export function ChatBotStatus() {
  const { data: session } = authClient.useSession();
  const profileId = session?.user?.id ?? null;

  const {
    providerToken,
    twitchUsername,
    isLoading: isLoadingProvider,
    tokenError,
  } = useProviderData();

  const commands = useQuery(api.commands.list);

  const {
    serverAvailable,
    isCheckingServer,
    isRunning,
    isConnected,
    isLoadingStatus,
    start,
    stop,
    isStarting,
    isStopping,
    startError,
    stopError,
  } = useBotServer(profileId);

  const channel = twitchUsername;

  const displayError =
    tokenError?.message || startError?.message || stopError?.message || null;

  // Check if we have all required data to start bot
  const canStartBot =
    Boolean(channel) && Boolean(providerToken) && Boolean(twitchUsername);

  const handleToggle = async (enabled: boolean) => {
    if (!profileId) {
      return;
    }
    if (!enabled) {
      await stop(profileId);
      return;
    }
    if (!canStartBot) {
      return;
    }
    // Type narrowing via canStartBot
    await start({
      profileId,
      channel: channel as string,
      accessToken: providerToken as string,
      username: twitchUsername as string,
      commands: commands ? formatCommands(commands) : [],
    });
  };

  const prevCommandsRef = useRef<string | null>(null);

  // Check if we should sync commands
  const shouldSyncCommands =
    isRunning &&
    isConnected &&
    canStartBot &&
    Boolean(commands) &&
    Boolean(profileId);

  // Sync commands when they change
  useEffect(() => {
    const commandsJson = commands ? JSON.stringify(commands) : null;
    const commandsChanged = commandsJson !== prevCommandsRef.current;
    prevCommandsRef.current = commandsJson;

    if (!commandsChanged) {
      return;
    }
    if (!shouldSyncCommands) {
      return;
    }
    if (!commands) {
      return;
    }
    if (!profileId) {
      return;
    }

    start({
      profileId,
      channel: channel as string,
      accessToken: providerToken as string,
      username: twitchUsername as string,
      commands: formatCommands(commands),
    });
  }, [
    commands,
    shouldSyncCommands,
    profileId,
    channel,
    providerToken,
    twitchUsername,
    start,
  ]);

  // Pre-compute state booleans
  const notCheckingServer = !isCheckingServer;
  const serverNotAvailable = !serverAvailable;
  const isServerOffline = notCheckingServer && serverNotAvailable;
  const hasError = Boolean(startError) || Boolean(stopError);
  const isInLoadingState = isStarting || isStopping || isLoadingStatus;
  const isWaitingForChannel = isLoadingProvider || !channel;

  const canToggle =
    serverAvailable &&
    !tokenError &&
    Boolean(channel) &&
    Boolean(providerToken) &&
    !isStarting &&
    !isStopping;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
            <Lightning className="h-5 w-5 text-purple-500" weight="fill" />
          </div>
          <div>
            <h3 className="font-medium">Chat Bot</h3>
            <p className="text-muted-foreground text-sm">
              Responds to commands in #{channel || "your channel"}
            </p>
          </div>
        </div>
        <StatusBadge
          hasError={hasError}
          isConnected={isConnected}
          isInLoadingState={isInLoadingState}
          isRunning={isRunning}
          isServerOffline={isServerOffline}
          isStarting={isStarting}
          isStopping={isStopping}
          isWaitingForChannel={isWaitingForChannel}
          tokenError={tokenError}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <Label className="font-medium" htmlFor="bot-enabled">
            Enable Bot
          </Label>
        </div>
        <Switch
          checked={isRunning}
          disabled={!canToggle}
          id="bot-enabled"
          onCheckedChange={handleToggle}
        />
      </div>

      {displayError && (
        <div className="rounded-lg bg-red-500/10 p-3 text-red-500 text-sm">
          <p className="font-medium">
            {tokenError ? "Token Error" : "Connection Error"}
          </p>
          <p className="text-red-500/80">{displayError}</p>
        </div>
      )}

      {isConnected && (
        <div className="rounded-lg bg-green-500/10 p-3 text-green-600 text-sm dark:text-green-400">
          <p className="font-medium">Bot is active!</p>
          <p className="text-green-600/80 dark:text-green-400/80">
            Listening for commands in #{channel}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <HardDrives className="h-3.5 w-3.5" weight="fill" />
        <span>
          {serverAvailable
            ? "Bot runs on the server — works even when you close this page"
            : "Bot server offline — start with `bun run dev:bot`"}
        </span>
      </div>
    </div>
  );
}
