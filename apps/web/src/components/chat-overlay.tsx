import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ChatSettingsData,
  getChatSettingsAtom,
  isChatSettingsInitialized,
  setChatSettingsInitialized,
} from "@/atoms/chat-settings-atoms";
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
  useEditMode?: boolean; // If true, uses atoms for instant updates. If false, uses Convex query directly.
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
const DEFAULT_CONTAINER_GAP = 4;
const DEFAULT_MESSAGE_BORDER_RADIUS = 8;
const DEFAULT_MESSAGE_PADDING_X = 8;
const DEFAULT_MESSAGE_PADDING_Y = 4;
const DEFAULT_GRADIENT_MASK_HEIGHT = 100;

type CSSVars = CSSProperties & Record<string, string>;

function px(value: number | undefined, fallback: number): string {
  return `${value ?? fallback}px`;
}

function transparentOr(
  isTransparent?: boolean,
  color?: string,
  fallback = "transparent"
): string {
  return isTransparent ? "transparent" : (color ?? fallback);
}

function buildStyleVars(config: ChatSettingsData | null): CSSVars {
  if (!config) {
    return {} as CSSVars;
  }

  return {
    "--gap-chat-container": px(config.containerGap, DEFAULT_CONTAINER_GAP),
    "--font-size-chat-message": px(config.messageFontSize, DEFAULT_FONT_SIZE),
    "--padding-x-chat-container": px(config.containerPaddingX, 0),
    "--padding-y-chat-container": px(config.containerPaddingY, 0),
    "--border-width-chat-container": px(config.containerBorderWidth, 0),
    "--border-radius-chat-container": px(config.containerBorderRadius, 0),
    "--background-color-chat-container": transparentOr(
      config.containerBackgroundTransparent,
      config.containerBackgroundColor,
      "#000000"
    ),
    "--border-color-chat-container": transparentOr(
      config.containerBorderTransparent,
      config.containerBorderColor,
      "#000000"
    ),
    "--background-color-chat-message": transparentOr(
      config.messageBackgroundTransparent,
      config.messageBackgroundColor,
      "#000000"
    ),
    "--border-color-chat-message": transparentOr(
      config.messageBorderTransparent,
      config.messageBorderColor
    ),
    "--border-width-chat-message": px(config.messageBorderWidth, 0),
    "--border-radius-chat-message": px(
      config.messageBorderRadius,
      DEFAULT_MESSAGE_BORDER_RADIUS
    ),
    "--padding-x-chat-message": px(
      config.messagePaddingX,
      DEFAULT_MESSAGE_PADDING_X
    ),
    "--padding-y-chat-message": px(
      config.messagePaddingY,
      DEFAULT_MESSAGE_PADDING_Y
    ),
    "--color-chat-message": config.messageColor ?? "#ffffff",
  } as CSSVars;
}

export default function ChatOverlay({
  overlayId,
  useEditMode = false,
}: ChatOverlayProps) {
  const overlayQuery = useQuery(
    convexQuery(api.overlays.getById, { id: overlayId })
  );
  const overlay = overlayQuery.data;
  const { providerToken, twitchUsername } = useProviderData();
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get settings from atom for instant updates (edit mode) or directly from Convex (public view)
  const settingsAtom = getChatSettingsAtom(overlayId);
  const atomSettings = useAtomValue(settingsAtom);
  const setAtomSettings = useSetAtom(settingsAtom);

  // Initialize atom from Convex data on first load (only in edit mode)
  useEffect(() => {
    if (
      useEditMode &&
      overlay?.settings &&
      !isChatSettingsInitialized(overlayId)
    ) {
      const loadedSettings = overlay.settings as ChatSettingsData;
      setAtomSettings(loadedSettings);
      setChatSettingsInitialized(overlayId, true);
    }
  }, [useEditMode, overlay, overlayId, setAtomSettings]);

  // Use atom settings in edit mode, otherwise use Convex query settings directly
  const settings = useEditMode
    ? atomSettings
    : ((overlay?.settings as ChatSettingsData | undefined) ??
      ({} as ChatSettingsData));

  // Get other settings from overlay (not in atom)
  const overlaySettings = overlay?.settings as
    | {
        maxMessages?: number;
        testMessagesEnabled?: boolean;
      }
    | undefined;

  const maxMessages = overlaySettings?.maxMessages || DEFAULT_MAX_MESSAGES;
  const testMessagesEnabled = overlaySettings?.testMessagesEnabled ?? false;
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
    if (allMessages.length > 0) {
      scrollToBottom();
    }
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

  const styleVars = buildStyleVars(settings);

  // Apply gradient mask if enabled
  const gradientMaskStyle = settings?.containerGradientMaskEnabled
    ? {
        maskImage: `linear-gradient(to bottom, transparent 0%, black ${settings.containerGradientMaskHeight ?? DEFAULT_GRADIENT_MASK_HEIGHT}px)`,
        WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black ${settings.containerGradientMaskHeight ?? DEFAULT_GRADIENT_MASK_HEIGHT}px)`,
      }
    : {};

  return (
    <div
      className="size-full overflow-hidden"
      style={{
        ...styleVars,
        ...gradientMaskStyle,
        backgroundColor: "var(--background-color-chat-container)",
        padding:
          "var(--padding-y-chat-container) var(--padding-x-chat-container)",
        borderWidth: "var(--border-width-chat-container)",
        borderStyle: "solid",
        borderColor: "var(--border-color-chat-container)",
        borderRadius: "var(--border-radius-chat-container)",
        gap: "var(--gap-chat-container)",
      }}
    >
      <div className="flex h-full flex-col justify-end">
        {allMessages.length === 0 ? (
          <>
            {/* Initial placeholder messages */}
            <div
              className="fade-in slide-in-from-bottom-2 animate-in"
              style={{
                backgroundColor: "var(--background-color-chat-message)",
                borderWidth: "var(--border-width-chat-message)",
                borderStyle: "solid",
                borderColor: "var(--border-color-chat-message)",
                borderRadius: "var(--border-radius-chat-message)",
                padding:
                  "var(--padding-y-chat-message) var(--padding-x-chat-message)",
                color: "var(--color-chat-message)",
                fontSize: "var(--font-size-chat-message)",
                marginBottom: "var(--gap-chat-container)",
              }}
            >
              <span className="font-semibold">username:</span> Hello chat!
            </div>
            <div
              className="fade-in slide-in-from-bottom-2 animate-in"
              style={{
                backgroundColor: "var(--background-color-chat-message)",
                borderWidth: "var(--border-width-chat-message)",
                borderStyle: "solid",
                borderColor: "var(--border-color-chat-message)",
                borderRadius: "var(--border-radius-chat-message)",
                padding:
                  "var(--padding-y-chat-message) var(--padding-x-chat-message)",
                color: "var(--color-chat-message)",
                fontSize: "var(--font-size-chat-message)",
              }}
            >
              <span className="font-semibold">viewer:</span> Great stream!
            </div>
          </>
        ) : (
          allMessages.map((msg, index) => (
            <div
              className="fade-in slide-in-from-bottom-2 animate-in"
              key={msg.id}
              style={{
                backgroundColor: "var(--background-color-chat-message)",
                borderWidth: "var(--border-width-chat-message)",
                borderStyle: "solid",
                borderColor: "var(--border-color-chat-message)",
                borderRadius: "var(--border-radius-chat-message)",
                padding:
                  "var(--padding-y-chat-message) var(--padding-x-chat-message)",
                color: "var(--color-chat-message)",
                fontSize: "var(--font-size-chat-message)",
                marginBottom:
                  index < allMessages.length - 1
                    ? "var(--gap-chat-container)"
                    : undefined,
                ...(msg.color && !msg.isTest
                  ? {
                      borderLeft: `3px solid ${msg.color}`,
                    }
                  : {}),
              }}
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
  );
}
