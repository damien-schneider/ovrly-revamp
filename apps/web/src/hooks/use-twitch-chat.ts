import { useCallback, useEffect, useRef, useState } from "react";

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

export function useTwitchChat({
  channel,
  accessToken,
  username,
  enabled = true,
  onMessage,
}: UseTwitchChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const addMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, message];
        // Keep only the last 100 messages in memory
        return updated.slice(-100);
      });
      onMessage?.(message);
    },
    [onMessage]
  );

  const connect = useCallback(() => {
    if (!(channel && accessToken && username && enabled)) {
      return;
    }

    // Normalize channel name (remove # if present, convert to lowercase)
    const normalizedChannel = channel.replace(/^#/, "").toLowerCase();

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Connect to Twitch IRC WebSocket
      const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

      ws.onopen = () => {
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send authentication
        ws.send(`PASS oauth:${accessToken}`);
        ws.send(`NICK ${username.toLowerCase()}`);

        // Request capabilities
        ws.send(
          "CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands"
        );

        // Join channel after a short delay to ensure auth is processed
        setTimeout(() => {
          ws.send(`JOIN #${normalizedChannel}`);
          setIsConnected(true);
        }, 100);
      };

      ws.onmessage = (event) => {
        const lines = event.data.split("\r\n").filter((line) => line.trim());

        for (const line of lines) {
          // Handle PING (keep-alive)
          if (line.startsWith("PING")) {
            ws.send("PONG :tmi.twitch.tv");
            continue;
          }

          // Handle JOIN confirmation
          if (
            line.includes(
              `:${username.toLowerCase()}!${username.toLowerCase()}@${username.toLowerCase()}.tmi.twitch.tv JOIN #${normalizedChannel}`
            )
          ) {
            setIsConnected(true);
            continue;
          }

          // Parse PRIVMSG (chat messages)
          // Format: @tags :username!username@username.tmi.twitch.tv PRIVMSG #channel :message
          // Or without tags: :username!username@username.tmi.twitch.tv PRIVMSG #channel :message
          const privmsgMatch = line.match(
            /^(?:@([^ ]+) )?:([^!]+)![^ ]+ PRIVMSG #([^ ]+) :(.+)$/
          );

          if (privmsgMatch) {
            const [, tagsStr, msgUsername, msgChannel, message] = privmsgMatch;

            // Only process messages from the channel we're listening to
            if (msgChannel.toLowerCase() !== normalizedChannel) {
              continue;
            }

            // Parse tags if present
            const tags: Record<string, string> = {};
            if (tagsStr) {
              tagsStr.split(";").forEach((tag) => {
                const [key, value] = tag.split("=");
                if (key) {
                  tags[key] = value || "";
                }
              });
            }

            const displayName = tags["display-name"] || msgUsername;
            const color = tags["color"] || undefined;
            const msgId = tags["id"] || `${Date.now()}-${Math.random()}`;

            const chatMessage: ChatMessage = {
              id: msgId,
              username: msgUsername.toLowerCase(),
              displayName,
              message,
              timestamp: Number.parseInt(
                tags["tmi-sent-ts"] || Date.now().toString(),
                10
              ),
              color,
            };

            addMessage(chatMessage);
          }
        }
      };

      ws.onerror = (err) => {
        console.error("Twitch chat WebSocket error:", err);
        setError("Connection error");
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);

        // Attempt to reconnect if enabled and not exceeded max attempts
        if (
          enabled &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          channel &&
          accessToken &&
          username
        ) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            1000 * 2 ** (reconnectAttemptsRef.current - 1),
            30_000
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Failed to reconnect after multiple attempts");
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect to Twitch chat:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnected(false);
    }
  }, [channel, accessToken, username, enabled, addMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (enabled && channel && accessToken && username) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, channel, accessToken, username, connect, disconnect]);

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
  };
}
