import { useCallback, useEffect, useRef, useState } from "react";

// Constants
const MAX_MESSAGES_IN_MEMORY = 100;
const AUTH_DELAY_MS = 100;
const CONNECTION_TIMEOUT_MS = 10_000;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_CONNECTION_DELAY_MS = 500;
const TWITCH_IRC_URL = "wss://irc-ws.chat.twitch.tv:443";

// Debug mode - set to true to enable console logging
const DEBUG_MODE = true;

// Regex patterns at module level for performance
const CHANNEL_PREFIX_REGEX = /^#/;
const PRIVMSG_REGEX = /^(?:@([^ ]+) )?:([^!]+)![^ ]+ PRIVMSG #([^ ]+) :(.+)$/;
const NOTICE_REGEX = /NOTICE \* :(.+)$/;
// Match JOIN messages: ":username!username@username.tmi.twitch.tv JOIN #channel"
const JOIN_REGEX = /:([^!]+)![^@]+@[^ ]+ JOIN #(\S+)/;
// Match welcome messages (001) which confirm successful auth
const WELCOME_REGEX = /:tmi\.twitch\.tv 001 (\S+) :Welcome/;

function debugLog(...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.log("[TwitchChat]", ...args);
  }
}

function isAuthFailureMessage(message: string): boolean {
  return (
    message.includes("Login authentication failed") ||
    message.includes("Invalid NICK") ||
    message.includes("Improperly formatted auth")
  );
}

function isJoinConfirmation(
  line: string,
  username: string,
  channel: string
): boolean {
  const joinMatch = line.match(JOIN_REGEX);
  if (!joinMatch) {
    return false;
  }
  const [, joinUser, joinChannel] = joinMatch;
  return (
    joinUser.toLowerCase() === username.toLowerCase() &&
    joinChannel.toLowerCase() === channel.toLowerCase()
  );
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  displayName?: string;
  color?: string;
}

interface UseTwitchChatOptions {
  channel: string | null | undefined;
  accessToken: string | null | undefined;
  username: string | null | undefined;
  enabled?: boolean;
  onMessage?: (message: ChatMessage) => void;
}

interface UseTwitchChatReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
  sendMessage: (message: string) => void;
}

function parseTags(tagsStr: string | undefined): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!tagsStr) {
    return tags;
  }

  for (const tag of tagsStr.split(";")) {
    const [key, value] = tag.split("=");
    if (key) {
      tags[key] = value || "";
    }
  }
  return tags;
}

function parsePrivateMessage(
  line: string,
  normalizedChannel: string
): ChatMessage | null {
  const privmsgMatch = line.match(PRIVMSG_REGEX);
  if (!privmsgMatch) {
    return null;
  }

  const [, tagsStr, msgUsername, msgChannel, msgText] = privmsgMatch;

  // Only process messages from the channel we're listening to
  if (msgChannel.toLowerCase() !== normalizedChannel) {
    return null;
  }

  const parsedTags = parseTags(tagsStr);
  const displayName = parsedTags["display-name"] || msgUsername;
  const messageColor = parsedTags.color || undefined;
  const msgId = parsedTags.id || `${Date.now()}-${Math.random()}`;

  return {
    id: msgId,
    username: msgUsername.toLowerCase(),
    displayName,
    message: msgText,
    timestamp: Number.parseInt(
      parsedTags["tmi-sent-ts"] || Date.now().toString(),
      10
    ),
    color: messageColor,
  };
}

interface MessageProcessorContext {
  ws: WebSocket;
  normalizedChannel: string;
  username: string;
  clearConnectionTimeout: () => void;
  setError: (error: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  isConnectingRef: React.RefObject<boolean>;
  addMessage: (message: ChatMessage) => void;
}

function processIrcLine(line: string, ctx: MessageProcessorContext): void {
  debugLog("Received:", line);

  // Handle PING (keep-alive)
  if (line.startsWith("PING")) {
    ctx.ws.send("PONG :tmi.twitch.tv");
    debugLog("Sent PONG");
    return;
  }

  // Handle welcome message (001) - confirms auth success
  const welcomeMatch = line.match(WELCOME_REGEX);
  if (welcomeMatch) {
    debugLog("Auth successful, welcome received for:", welcomeMatch[1]);
    return;
  }

  // Handle authentication failure notices
  const noticeMatch = line.match(NOTICE_REGEX);
  if (noticeMatch) {
    debugLog("NOTICE received:", noticeMatch[1]);
    if (isAuthFailureMessage(noticeMatch[1])) {
      ctx.setError(`Authentication failed: ${noticeMatch[1]}`);
      ctx.clearConnectionTimeout();
      ctx.ws.close();
      return;
    }
  }

  // Handle JOIN confirmation
  if (isJoinConfirmation(line, ctx.username, ctx.normalizedChannel)) {
    debugLog("JOIN confirmed for channel:", ctx.normalizedChannel);
    ctx.clearConnectionTimeout();
    ctx.setIsConnected(true);
    // biome-ignore lint/style/noNonNullAssertion: ref is always defined
    ctx.isConnectingRef.current! = false;
    return;
  }

  // Parse PRIVMSG (chat messages)
  const chatMessage = parsePrivateMessage(line, ctx.normalizedChannel);
  if (chatMessage) {
    debugLog(
      "Chat message from",
      chatMessage.username,
      ":",
      chatMessage.message
    );
    ctx.addMessage(chatMessage);
  }
}

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

export type { ChatMessage, UseTwitchChatOptions, UseTwitchChatReturn };
