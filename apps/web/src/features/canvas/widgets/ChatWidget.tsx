import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { ChatElement } from "@/features/canvas/types";
import { defaultChatStyle } from "@/features/canvas/types";
import { useTwitchChat } from "@/features/twitch/hooks/use-twitch-chat";

// Mock messages for chat preview
const mockPreviewMessages = [
  {
    user: "StreamFan",
    text: "This looks amazing!",
    color: "#ff5555",
    badges: ["subscriber"],
  },
  {
    user: "ModBot",
    text: "Enjoy the stream everyone.",
    color: "#55ff55",
    badges: ["moderator"],
  },
  { user: "Viewer123", text: "POG", color: "#5555ff", badges: [] },
  {
    user: "SuperChatter",
    text: "Love the new overlay!",
    color: "#ffaa00",
    badges: ["vip"],
  },
];

function getBadgeIcon(badge: string): string {
  switch (badge) {
    case "moderator":
      return "🛡️";
    case "subscriber":
      return "⭐";
    case "vip":
      return "💎";
    default:
      return "";
  }
}

interface DisplayMessage {
  user: string;
  text: string;
  color: string;
  badges?: string[];
}

interface ChatWidgetProps {
  element: ChatElement;
  isLiveView: boolean;
}

export function ChatWidget({ element, isLiveView }: ChatWidgetProps) {
  const { style, previewEnabled, channel } = element;

  // Connect to Twitch chat when channel is configured
  // In live view (OBS), always connect if channel is set
  // In editor, connect for preview purposes when channel is set
  const shouldConnectToTwitch = Boolean(channel);

  const {
    messages: liveMessages,
    isConnected,
    error: connectionError,
  } = useTwitchChat({
    channel: shouldConnectToTwitch ? channel : null,
    // Anonymous connection - we just want to read chat, not send messages
    accessToken: null,
    username: null,
    enabled: shouldConnectToTwitch,
  });

  // Determine what messages to display
  let displayMessages: DisplayMessage[];

  if (shouldConnectToTwitch && liveMessages.length > 0) {
    // Show real Twitch messages when connected and have messages
    displayMessages = liveMessages.map((m) => ({
      user: m.displayName || m.username,
      text: m.message,
      color: m.color || "#a855f7",
      badges: [],
    }));
  } else if (previewEnabled) {
    // Show preview animation when enabled
    displayMessages = mockPreviewMessages;
  } else {
    // No preview mode - show empty (no mock data when channel is set or preview is off)
    displayMessages = [];
  }

  const containerRef = useRef<HTMLDivElement>(null);

  // Animation for preview messages
  const [visibleMessages, setVisibleMessages] =
    useState<DisplayMessage[]>(displayMessages);

  useEffect(() => {
    // When connected to Twitch, always show live messages
    if (shouldConnectToTwitch && liveMessages.length > 0) {
      setVisibleMessages(displayMessages);
      return;
    }

    // In live view with no messages yet, show empty or waiting state
    if (isLiveView && shouldConnectToTwitch) {
      setVisibleMessages([]);
      return;
    }

    // In editor without preview mode - show empty (no mock data)
    if (!previewEnabled) {
      setVisibleMessages([]);
      return;
    }

    // Cycle through messages for preview animation
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % mockPreviewMessages.length;
      setVisibleMessages((prev) => {
        const newMessages = [...prev, mockPreviewMessages[index]];
        if (newMessages.length > style.maxMessages) {
          return newMessages.slice(-style.maxMessages);
        }
        return newMessages;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [
    previewEnabled,
    style.maxMessages,
    isLiveView,
    displayMessages,
    shouldConnectToTwitch,
    liveMessages.length,
  ]);

  const getAnimationClass = () => {
    switch (style.animation) {
      case "slide":
        return "animate-[slideIn_0.3s_ease-out]";
      case "fade":
        return "animate-[fadeIn_0.3s_ease-out]";
      default:
        return "";
    }
  };

  // Auto-position mask based on direction
  // bottom-up: mask at top (old messages fade out at top)
  // top-down: mask at bottom (old messages fade out at bottom)
  const getMaskStyle = (): React.CSSProperties | undefined => {
    const maskEnabled = style.maskEnabled ?? defaultChatStyle.maskEnabled;
    if (!maskEnabled) {
      return undefined;
    }

    const maskSize = style.maskSize ?? defaultChatStyle.maskSize;
    const isTopDown = style.messageDirection === "top-down";

    // Mask where old messages disappear
    const gradient = isTopDown
      ? `linear-gradient(to top, transparent 0%, black ${maskSize}px)`
      : `linear-gradient(to bottom, transparent 0%, black ${maskSize}px)`;

    return {
      maskImage: gradient,
      WebkitMaskImage: gradient,
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderWidth: style.borderWidth,
        borderColor: style.borderColor,
        borderStyle: style.borderWidth > 0 ? "solid" : "none",
        padding: "12px",
        display: "flex",
        flexDirection:
          style.messageDirection === "top-down" ? "column" : "column-reverse",
        justifyContent:
          style.messageDirection === "top-down" ? "flex-start" : "flex-end",
        overflow: "hidden",
        fontFamily: style.fontFamily,
        color: style.textColor,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        gap: style.messageSpacing,
        opacity: element.opacity ?? 1,
        ...getMaskStyle(),
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
      {visibleMessages.slice(-style.maxMessages).map((msg, idx) => (
        <div
          className={getAnimationClass()}
          key={`${msg.user}-${idx}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            backgroundColor: style.messageBgColor,
            borderRadius: style.messageBorderRadius,
            padding: style.messagePadding,
            textShadow: style.textShadow,
          }}
        >
          {style.showBadges && msg.badges && msg.badges.length > 0 && (
            <div className="flex shrink-0 gap-1">
              {msg.badges.map((badge) => (
                <span
                  className="rounded bg-purple-500 px-1 text-white text-xs"
                  key={badge}
                  style={{ fontSize: style.badgeSize * 0.6 }}
                >
                  {getBadgeIcon(badge)}
                </span>
              ))}
            </div>
          )}
          <div>
            <span
              style={{
                color: style.usernameColor || msg.color,
                fontWeight: "bold",
                marginRight: "4px",
              }}
            >
              {msg.user}:
            </span>
            <span style={{ fontSize: style.fontSize }}>{msg.text}</span>
          </div>
        </div>
      ))}
      {/* Status indicators - only show in editor, not in OBS live view */}
      {!isLiveView && (
        <>
          {shouldConnectToTwitch && isConnected && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-green-500 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </div>
          )}
          {shouldConnectToTwitch && !isConnected && !connectionError && (
            <div className="absolute top-2 right-2 rounded bg-yellow-500 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest">
              Connecting...
            </div>
          )}
          {shouldConnectToTwitch && connectionError && (
            <div className="absolute top-2 right-2 rounded bg-red-500 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest">
              Error
            </div>
          )}
          {!shouldConnectToTwitch && previewEnabled && (
            <div className="absolute top-2 right-2 rounded bg-purple-500 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest">
              Preview
            </div>
          )}
        </>
      )}
    </div>
  );
}
