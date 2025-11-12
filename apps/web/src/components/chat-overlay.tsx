import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProviderData } from "@/hooks/use-provider-token";
import { useTwitchChat } from "@/hooks/use-twitch-chat";

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  displayName?: string;
  color?: string;
  isTest?: boolean;
};

type ChatOverlayProps = {
  overlayId: Id<"overlays">;
};

const TEST_USERNAMES = [
  "TestUser",
  "Viewer123",
  "ChatBot",
  "StreamFan",
  "GamerPro",
];

const TEST_MESSAGES = [
  "Hello chat!",
  "Great stream!",
  "This is a test message",
  "Love the overlay!",
  "Testing 1, 2, 3",
  "Awesome content!",
  "Keep it up!",
];

const DEFAULT_MAX_MESSAGES = 50;
const INITIAL_MESSAGE_DELAY_MS = 500;
const MIN_INTERVAL_MS = 3000;
const MAX_INTERVAL_MS = 5000;
const DEFAULT_FONT_SIZE = 16;

export default function ChatOverlay({ overlayId }: ChatOverlayProps) {
  const overlayQuery = useQuery(
    convexQuery(api.overlays.getById, { id: overlayId })
  );
  const overlay = overlayQuery.data;
  const { providerToken, twitchUsername } = useProviderData();
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const settings = overlay
    ? (overlay.settings as {
        fontSize?: number;
        fontFamily?: string;
        textColor?: string;
        backgroundColor?: string;
        maxMessages?: number;
        testMessagesEnabled?: boolean;
      })
    : null;

  const maxMessages = settings?.maxMessages || DEFAULT_MAX_MESSAGES;
  const testMessagesEnabled = settings?.testMessagesEnabled ?? false;
  const channel = overlay?.channel || null;

  // Connect to Twitch chat - must be called before any early returns
  const {
    messages: realMessages,
    isConnected: _isChatConnected,
    error: _chatError,
  } = useTwitchChat({
    channel,
    accessToken: providerToken || undefined,
    username: twitchUsername || undefined,
    enabled: Boolean(channel && providerToken && twitchUsername),
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Merge real and test messages, sorted by timestamp
  const allMessages = useMemo(() => {
    const merged = [
      ...realMessages.map((msg) => ({ ...msg, isTest: false })),
      ...testMessages,
    ].sort((a, b) => a.timestamp - b.timestamp);
    return merged.slice(-maxMessages);
  }, [realMessages, testMessages, maxMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length, scrollToBottom]);

  // Reset test messages when test mode is toggled off
  useEffect(() => {
    if (!testMessagesEnabled) {
      setTestMessages([]);
    }
  }, [testMessagesEnabled]);

  const sendTestMessage = useCallback(() => {
    const username =
      TEST_USERNAMES[Math.floor(Math.random() * TEST_USERNAMES.length)];
    const message =
      TEST_MESSAGES[Math.floor(Math.random() * TEST_MESSAGES.length)];

    const newMessage: ChatMessage = {
      id: `test-${Date.now()}-${Math.random()}`,
      username,
      message,
      timestamp: Date.now(),
      isTest: true,
    };

    setTestMessages((prev) => {
      const updated = [...prev, newMessage];
      return updated.slice(-maxMessages);
    });
  }, [maxMessages]);

  // Auto-send test messages when enabled
  useEffect(() => {
    if (testMessagesEnabled) {
      // Send initial message after a short delay
      const initialTimeout = setTimeout(() => {
        sendTestMessage();
      }, INITIAL_MESSAGE_DELAY_MS);

      // Set up interval to send messages every 3-5 seconds
      const intervalId = setInterval(
        () => {
          sendTestMessage();
        },
        Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS) + MIN_INTERVAL_MS
      );

      intervalRef.current = intervalId;

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    // Clear interval when disabled
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [testMessagesEnabled, sendTestMessage]);

  if (overlayQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!overlay) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Overlay not found</p>
      </div>
    );
  }

  if (overlay.type !== "chat") {
    return (
      <div className="flex h-full items-center justify-center">
        <p>This overlay is not a chat overlay</p>
      </div>
    );
  }

  return (
    <div
      className="size-full overflow-hidden"
      style={{
        backgroundColor: settings?.backgroundColor || "transparent",
        color: settings?.textColor || "#ffffff",
        fontFamily: settings?.fontFamily || "Inter, sans-serif",
        fontSize: `${settings?.fontSize || DEFAULT_FONT_SIZE}px`,
      }}
    >
      <div className="flex h-full flex-col justify-end p-4">
        <div className="space-y-2">
          {allMessages.length === 0 ? (
            <>
              {/* Initial placeholder messages */}
              <div className="rounded-lg bg-black/20 px-3 py-2 backdrop-blur-sm">
                <span className="font-semibold">username:</span> Hello chat!
              </div>
              <div className="rounded-lg bg-black/20 px-3 py-2 backdrop-blur-sm">
                <span className="font-semibold">viewer:</span> Great stream!
              </div>
            </>
          ) : (
            allMessages.map((msg) => (
              <div
                className="fade-in slide-in-from-bottom-2 animate-in rounded-lg bg-black/20 px-3 py-2 backdrop-blur-sm"
                key={msg.id}
                style={
                  msg.color && !msg.isTest
                    ? {
                        borderLeft: `3px solid ${msg.color}`,
                      }
                    : undefined
                }
              >
                <span
                  className="font-semibold"
                  style={
                    msg.color && !msg.isTest ? { color: msg.color } : undefined
                  }
                >
                  {msg.displayName || msg.username}:
                </span>{" "}
                {msg.message}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
