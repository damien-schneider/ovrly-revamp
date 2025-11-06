import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";

function useProviderToken() {
  const providerData = useQuery({
    ...convexQuery(api.provider.get, {}),
    retry: false,
    throwOnError: false,
  });

  return {
    providerToken: providerData?.data?.twitchToken ?? null,
    providerRefreshToken: providerData?.data?.twitchRefreshToken ?? null,
    isLoading: providerData.isLoading,
    error: providerData.error,
  };
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
    providerToken,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useProviderToken();

  const {
    data: twitchUsername,
    isLoading: isLoadingUsername,
    error: usernameError,
  } = useTwitchUsername(providerToken);

  return {
    providerToken,
    twitchUsername,
    isLoading: isLoadingToken || isLoadingUsername,
    error: tokenError || usernameError,
  };
}
