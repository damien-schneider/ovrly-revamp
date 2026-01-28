import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTH_DELAY_MS,
  BASE_RECONNECT_DELAY_MS,
  CHANNEL_PREFIX_REGEX,
  CONNECTION_TIMEOUT_MS,
  INITIAL_CONNECTION_DELAY_MS,
  MAX_MESSAGES_IN_MEMORY,
  MAX_RECONNECT_ATTEMPTS,
  MAX_RECONNECT_DELAY_MS,
  TWITCH_IRC_URL,
} from "../lib/constants";
import { debugLog, processIrcLine } from "../lib/irc-parser";
import type {
  ChatMessage,
  MessageProcessorContext,
  UseTwitchChatOptions,
  UseTwitchChatReturn,
} from "../types";

export function useTwitchChat({
  channel,
  accessToken,
  username,
  enabled = true,
  onMessage,
}: UseTwitchChatOptions): UseTwitchChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid recreating callbacks and causing reconnects
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialConnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const normalizedChannelRef = useRef<string | null>(null);
  const onMessageRef = useRef(onMessage);
  const isConnectingRef = useRef(false);

  // Keep onMessage ref up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const updated = [...prev, message];
      return updated.slice(-MAX_MESSAGES_IN_MEMORY);
    });
    onMessageRef.current?.(message);
  }, []);

  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    debugLog("Disconnecting...");
    isConnectingRef.current = false;

    if (initialConnectionTimeoutRef.current) {
      clearTimeout(initialConnectionTimeoutRef.current);
      initialConnectionTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (wsRef.current) {
      // Remove all handlers before closing to prevent reconnect attempts
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
    normalizedChannelRef.current = null;
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      debugLog("Already connecting, skipping...");
      return;
    }

    if (!(channel && enabled)) {
      debugLog("Cannot connect - missing channel or disabled");
      return;
    }

    const isAnonymous = !(accessToken && username);
    const effectiveUsername = isAnonymous
      ? `justinfan${Math.floor(Math.random() * 1_000_000)}`
      : username;
    const effectiveToken = isAnonymous
      ? "oauth:anonymous"
      : `oauth:${accessToken}`;

    isConnectingRef.current = true;

    // Normalize channel name (remove # if present, convert to lowercase)
    const normalizedChannel = channel
      .replace(CHANNEL_PREFIX_REGEX, "")
      .toLowerCase();
    normalizedChannelRef.current = normalizedChannel;

    debugLog(
      isAnonymous ? "Connecting anonymously" : "Connecting with auth",
      "to channel:",
      normalizedChannel,
      "as user:",
      effectiveUsername
    );

    // Close existing connection if any (without triggering reconnect)
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    // Connect to Twitch IRC WebSocket
    const ws = new WebSocket(TWITCH_IRC_URL);
    wsRef.current = ws;

    const processorContext: MessageProcessorContext = {
      ws,
      normalizedChannel,
      username: effectiveUsername,
      clearConnectionTimeout,
      setError,
      setIsConnected,
      isConnectingRef,
      addMessage,
    };

    ws.onopen = () => {
      debugLog("WebSocket opened, authenticating...");
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Set a timeout for connection - if we don't get JOIN confirmation, fail
      connectionTimeoutRef.current = setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }
        debugLog("Connection timeout - no JOIN confirmation received");
        setError("Connection timeout - failed to join channel");
        ws.close();
      }, CONNECTION_TIMEOUT_MS);

      // Send authentication
      debugLog("Sending PASS and NICK...");
      ws.send(`PASS ${effectiveToken}`);
      ws.send(`NICK ${effectiveUsername.toLowerCase()}`);

      // Request capabilities
      debugLog("Requesting capabilities...");
      ws.send(
        "CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands"
      );

      // Join channel after a short delay to ensure auth is processed
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          debugLog("Sending JOIN for:", normalizedChannel);
          ws.send(`JOIN #${normalizedChannel}`);
        }
      }, AUTH_DELAY_MS);
    };

    ws.onmessage = (event) => {
      const lines = event.data
        .split("\r\n")
        .filter((line: string) => line.trim());

      for (const line of lines) {
        processIrcLine(line, processorContext);
      }
    };

    ws.onerror = (event) => {
      debugLog("WebSocket error:", event);
      setError("Connection error");
      setIsConnected(false);
      isConnectingRef.current = false;
    };

    ws.onclose = (event) => {
      debugLog("WebSocket closed:", { code: event.code, reason: event.reason });
      setIsConnected(false);
      isConnectingRef.current = false;

      // Only reconnect if this wasn't an intentional disconnect
      if (
        enabled &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS &&
        channel &&
        accessToken &&
        username
      ) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(
          BASE_RECONNECT_DELAY_MS * 2 ** (reconnectAttemptsRef.current - 1),
          MAX_RECONNECT_DELAY_MS
        );
        debugLog(
          `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setError("Failed to reconnect after multiple attempts");
      }
    };
  }, [
    channel,
    accessToken,
    username,
    enabled,
    addMessage,
    clearConnectionTimeout,
  ]);

  const sendMessage = useCallback((message: string) => {
    const ws = wsRef.current;
    const normalizedChannel = normalizedChannelRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN || !normalizedChannel) {
      return;
    }

    ws.send(`PRIVMSG #${normalizedChannel} :${message}`);
  }, []);

  // Main effect - only depends on the key connection parameters
  // biome-ignore lint/correctness/useExhaustiveDependencies: connect/disconnect use refs and are stable, adding them would cause infinite reconnect loops
  useEffect(() => {
    if (enabled && channel) {
      // Small delay to ensure React state is stable before connecting
      initialConnectionTimeoutRef.current = setTimeout(() => {
        connect();
      }, INITIAL_CONNECTION_DELAY_MS);

      return () => {
        disconnect();
      };
    }

    disconnect();
    return;
  }, [enabled, channel, accessToken, username]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isConnected,
    error,
    connect,
    disconnect,
    clearMessages,
    sendMessage,
  };
}
