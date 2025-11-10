import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

function useProviderToken() {
  return useQuery({
    queryKey: ["twitch-access-token"],
    queryFn: async () => {
      const tokenResponse = await authClient.getAccessToken({
        providerId: "twitch",
      });

      if (tokenResponse.error || !tokenResponse.data) {
        return null;
      }

      return tokenResponse.data.accessToken ?? null;
    },
    retry: false,
    throwOnError: false,
  });
}

function useTwitchUsername(providerToken: string | null | undefined) {
  const twitchClientId = (import.meta as any).env.VITE_TWITCH_CLIENT_ID ?? "";

  return useQuery({
    queryKey: ["twitch-username", providerToken],
    queryFn: async () => {
      if (!(providerToken && twitchClientId)) {
        return null;
      }

      try {
        const response = await fetch("https://api.twitch.tv/helix/users", {
          headers: {
            Authorization: `Bearer ${providerToken}`,
            "Client-Id": twitchClientId,
          },
        });

        if (!response.ok) {
          return null;
        }

        const userData = await response.json();
        return userData.data?.[0]?.login || null;
      } catch (_error) {
        return null;
      }
    },
    enabled: Boolean(providerToken && twitchClientId),
  });
}

export function useProviderData() {
  const {
    data: providerToken,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useProviderToken();

  const {
    data: twitchUsername,
    isLoading: isLoadingUsername,
    error: usernameError,
  } = useTwitchUsername(providerToken ?? null);

  return {
    providerToken: providerToken ?? null,
    twitchUsername: twitchUsername ?? null,
    isLoading: isLoadingToken || isLoadingUsername,
    error: tokenError || usernameError,
  };
}
