import { useCallback, useEffect, useState } from "react";
import { env } from "@/env";
import { authClient } from "@/lib/auth-client";

const TWITCH_API_URL = "https://api.twitch.tv/helix/users";
const CLIENT_ID_PREFIX_LENGTH = 8;
const JWT_PARTS_COUNT = 3;
const DEBUG_MODE = true;

// HTTP status codes that indicate the token is invalid and needs reconnection
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_UNAUTHORIZED = 401;

function debugLog(...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.log("[ProviderToken]", ...args);
  }
}

type ProviderTokenData = {
  accessToken: string;
  idToken?: string;
} | null;

export type TokenError = {
  code: string;
  message: string;
  status?: number;
} | null;

interface TokenQueryResult {
  data: ProviderTokenData;
  tokenError: TokenError;
}

interface Account {
  id: string;
  providerId: string; // "twitch", "google", etc.
  accountId: string; // The provider's user ID (e.g., Twitch user ID)
  scopes?: string[];
  createdAt?: Date | number;
  updatedAt?: Date | number;
}

async function fetchTwitchToken(): Promise<TokenQueryResult> {
  // First, get the current session to understand the user context
  debugLog("Getting current session...");
  const sessionResponse = await authClient.getSession();
  debugLog("Session response:", {
    hasError: Boolean(sessionResponse.error),
    hasData: Boolean(sessionResponse.data),
    userId: sessionResponse.data?.user?.id,
    userEmail: sessionResponse.data?.user?.email,
    error: sessionResponse.error,
  });

  debugLog("Listing accounts to check for Twitch...");

  const accountsResponse = await authClient.listAccounts();
  debugLog("Accounts response:", accountsResponse);

  if (accountsResponse.error || !accountsResponse.data) {
    debugLog("Failed to list accounts:", accountsResponse.error);
    return {
      data: null,
      tokenError: {
        code: "FAILED_TO_LIST_ACCOUNTS",
        message: "Failed to list linked accounts",
      },
    };
  }

  // Debug: show account IDs to compare with session user ID
  const twitchAccounts: Account[] = [];
  for (const acc of accountsResponse.data) {
    debugLog("Account details:", {
      id: acc.id,
      providerId: acc.providerId,
      accountId: acc.accountId,
    });
    if (acc.providerId === "twitch") {
      twitchAccounts.push(acc as Account);
    }
  }

  if (twitchAccounts.length === 0) {
    return {
      data: null,
      tokenError: {
        code: "NO_TWITCH_ACCOUNT",
        message: "No Twitch account linked",
      },
    };
  }

  const twitchAccount = twitchAccounts[0];
  debugLog("Using Twitch account:", {
    id: twitchAccount.id,
    accountId: twitchAccount.accountId,
    providerId: twitchAccount.providerId,
  });

  debugLog("Twitch account found, fetching access token...");

  // Pass the internal account ID (acc.id) - this is what Better Auth uses for lookup
  const tokenResponse = await authClient.getAccessToken({
    providerId: "twitch",
    accountId: twitchAccount.id, // Internal Better Auth account ID, NOT Twitch user ID
  });

  debugLog("Token response:", {
    hasError: Boolean(tokenResponse.error),
    hasData: Boolean(tokenResponse.data),
    error: tokenResponse.error,
  });

  if (tokenResponse.error || !tokenResponse.data) {
    const error = tokenResponse.error as
      | {
          code?: string;
          message?: string;
          status?: number;
        }
      | undefined;

    debugLog("Token fetch failed:", error);

    // Specific error handling
    const errorCode = error?.code ?? "UNKNOWN_ERROR";
    const errorMessage = error?.message ?? "Failed to get access token";
    const errorStatus = error?.status;

    // If the error indicates the account exists but token refresh failed,
    // this means the user needs to re-authorize on Twitch
    return {
      data: null,
      tokenError: {
        code: errorCode,
        message: errorMessage,
        status: errorStatus,
      },
    };
  }

  debugLog("Token fetched successfully");
  return {
    data: {
      accessToken: tokenResponse.data.accessToken ?? "",
      idToken: tokenResponse.data.idToken,
    },
    tokenError: null,
  };
}

interface UseProviderTokenResult {
  data: TokenQueryResult | undefined;
  isLoading: boolean;
  error: Error | null;
}

function useProviderToken(): UseProviderTokenResult {
  const [data, setData] = useState<TokenQueryResult | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const result = await fetchTwitchToken();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== JWT_PARTS_COUNT) {
      return null;
    }
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

interface UseTwitchUsernameResult {
  data: string | null | undefined;
  isLoading: boolean;
  error: Error | null;
}

function useTwitchUsername(
  tokenData: ProviderTokenData
): UseTwitchUsernameResult {
  const twitchClientId = env.VITE_TWITCH_CLIENT_ID;
  const [data, setData] = useState<string | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsername = useCallback(async (): Promise<string | null> => {
    if (!tokenData?.accessToken) {
      debugLog("No access token available");
      return null;
    }

    // First, try to extract username from ID token (no API call needed)
    if (tokenData.idToken) {
      debugLog("Attempting to extract username from ID token...");
      const payload = decodeJwtPayload(tokenData.idToken);
      debugLog("ID token payload:", payload);
      if (payload?.preferred_username) {
        const username = String(payload.preferred_username).toLowerCase();
        debugLog("Username extracted from ID token:", username);
        return username;
      }
    }

    // Fall back to Twitch API if ID token doesn't have username
    if (!twitchClientId) {
      debugLog("VITE_TWITCH_CLIENT_ID not set and no username in ID token.");
      return null;
    }

    debugLog(
      "Twitch Client ID available:",
      `${twitchClientId.slice(0, CLIENT_ID_PREFIX_LENGTH)}...`
    );
    debugLog("Fetching username from Twitch API...");

    try {
      const response = await fetch(TWITCH_API_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
          "Client-Id": twitchClientId,
        },
      });

      debugLog("Twitch API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        debugLog("Twitch API error:", errorText);
        return null;
      }

      const userData = await response.json();
      debugLog("Twitch user data:", userData);
      const username = userData.data?.[0]?.login || null;
      debugLog("Extracted username:", username);
      return username;
    } catch (err) {
      debugLog("Twitch API exception:", err);
      return null;
    }
  }, [tokenData?.accessToken, tokenData?.idToken, twitchClientId]);

  useEffect(() => {
    if (!tokenData?.accessToken) {
      setData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const result = await fetchUsername();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenData?.accessToken, fetchUsername]);

  return { data, isLoading, error };
}

export function useProviderData() {
  const {
    data: tokenResult,
    isLoading: isLoadingToken,
    error: queryError,
  } = useProviderToken();

  const tokenData = tokenResult?.data ?? null;
  const tokenError = tokenResult?.tokenError ?? null;

  const {
    data: twitchUsername,
    isLoading: isLoadingUsername,
    error: usernameError,
  } = useTwitchUsername(tokenData);

  // Determine if we need to reconnect (token is expired/invalid or refresh failed)
  // These error codes indicate the user needs to re-authorize on Twitch
  const needsReconnect =
    Boolean(tokenError) &&
    (tokenError?.code === "FAILED_TO_GET_A_VALID_ACCESS_TOKEN" ||
      tokenError?.message?.includes("Account not found") ||
      tokenError?.message?.includes("Failed to get a valid access token") ||
      tokenError?.status === HTTP_STATUS_BAD_REQUEST ||
      tokenError?.status === HTTP_STATUS_UNAUTHORIZED);

  return {
    providerToken: tokenData?.accessToken ?? null,
    twitchUsername: twitchUsername ?? null,
    isLoading: isLoadingToken || isLoadingUsername,
    error: queryError ?? usernameError,
    tokenError,
    needsReconnect,
  };
}
