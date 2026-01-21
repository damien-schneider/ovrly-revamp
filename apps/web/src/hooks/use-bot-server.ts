import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/env";

// Bot server API types
interface BotStatus {
  isRunning: boolean;
  isConnected: boolean;
  channel: string | null;
}

interface Command {
  trigger: string;
  response: string;
  enabled: boolean;
  cooldown?: number;
}

interface StartBotParams {
  profileId: string;
  channel: string;
  accessToken: string;
  username: string;
  commands: Command[];
}

const BOT_SERVER_URL = env.VITE_BOT_SERVER_URL ?? "http://localhost:3002";
const BOT_API_SECRET = env.VITE_BOT_API_SECRET ?? "";

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BOT_SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BOT_API_SECRET}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  return response.json();
}

// Check if the bot server is available
export function useBotServerHealth() {
  return useQuery({
    queryKey: ["bot-server-health"],
    queryFn: async () => {
      try {
        const response = await fetch(`${BOT_SERVER_URL}/health`);
        if (!response.ok) {
          return { available: false, bots: 0 };
        }
        const data = await response.json();
        return { available: true, bots: data.bots ?? 0 };
      } catch {
        return { available: false, bots: 0 };
      }
    },
    refetchInterval: 30_000, // Check every 30 seconds
    retry: false,
  });
}

// Get bot status for a specific profile
export function useBotStatus(profileId: string | null) {
  return useQuery({
    queryKey: ["bot-status", profileId],
    queryFn: () => fetchWithAuth<BotStatus>(`/bots/${profileId}`),
    enabled: Boolean(profileId) && Boolean(BOT_API_SECRET),
    refetchInterval: 5000, // Poll every 5 seconds for status updates
    retry: false,
  });
}

// Start the bot
export function useStartBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: StartBotParams) =>
      fetchWithAuth<{ success: boolean; message: string }>(
        `/bots/${params.profileId}/start`,
        {
          method: "POST",
          body: JSON.stringify({
            channel: params.channel,
            accessToken: params.accessToken,
            username: params.username,
            commands: params.commands,
          }),
        }
      ),
    onSuccess: (_data, variables) => {
      // Invalidate the bot status query to refresh
      queryClient.invalidateQueries({
        queryKey: ["bot-status", variables.profileId],
      });
    },
  });
}

// Stop the bot
export function useStopBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) =>
      fetchWithAuth<{ success: boolean; message: string }>(
        `/bots/${profileId}/stop`,
        { method: "POST" }
      ),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ["bot-status", profileId] });
    },
  });
}

// Send a message through the bot
export function useSendBotMessage() {
  return useMutation({
    mutationFn: ({
      profileId,
      message,
    }: {
      profileId: string;
      message: string;
    }) =>
      fetchWithAuth<{ success: boolean }>(`/bots/${profileId}/message`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
  });
}

// Combined hook for easier bot management
export function useBotServer(profileId: string | null) {
  const health = useBotServerHealth();
  const status = useBotStatus(profileId);
  const startBot = useStartBot();
  const stopBot = useStopBot();
  const sendMessage = useSendBotMessage();

  return {
    // Server status
    serverAvailable: health.data?.available ?? false,
    isCheckingServer: health.isLoading,

    // Bot status
    isRunning: status.data?.isRunning ?? false,
    isConnected: status.data?.isConnected ?? false,
    channel: status.data?.channel ?? null,
    isLoadingStatus: status.isLoading,
    statusError: status.error,

    // Actions
    start: startBot.mutateAsync,
    stop: stopBot.mutateAsync,
    sendMessage: sendMessage.mutateAsync,

    // Action states
    isStarting: startBot.isPending,
    isStopping: stopBot.isPending,
    startError: startBot.error,
    stopError: stopBot.error,
  };
}
