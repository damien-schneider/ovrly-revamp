import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatElement } from "@/features/canvas/types";
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
  avatarUrl?: string;
}

function UserAvatar({
  username,
  color,
  size = 24,
}: {
  username: string;
  color: string;
  size?: number;
}) {
  const initial = username.charAt(0).toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.5,
      }}
    >
      {initial}
    </div>
  );
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

  // Determine what messages to display - memoized to prevent infinite loops
  const displayMessages = useMemo<DisplayMessage[]>(() => {
    if (shouldConnectToTwitch && liveMessages.length > 0) {
      // Show real Twitch messages when connected and have messages
      return liveMessages.map((m) => ({
        user: m.displayName || m.username,
        text: m.message,
        color: m.color || "#a855f7",
        badges: [],
      }));
    }
    if (previewEnabled) {
      // Show preview animation when enabled
      return mockPreviewMessages;
    }
    // No preview mode - show empty
    return [];
  }, [shouldConnectToTwitch, liveMessages, previewEnabled]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Animation for preview messages
  const [visibleMessages, setVisibleMessages] = useState<DisplayMessage[]>([]);

  // Sync visible messages with display messages for live/static content
  useEffect(() => {
    // When connected to Twitch, always show live messages immediately
    if (shouldConnectToTwitch && liveMessages.length > 0) {
      setVisibleMessages(displayMessages);
      return;
    }

    // In live view with no messages yet, show empty
    if (isLiveView && shouldConnectToTwitch) {
      setVisibleMessages([]);
      return;
    }

    // In editor without preview mode - show empty
    if (!previewEnabled) {
      setVisibleMessages([]);
      return;
    }

    // Preview animation - cycle through mock messages
    setVisibleMessages([mockPreviewMessages[0]]);
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
    shouldConnectToTwitch,
    liveMessages.length,
    displayMessages,
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
            borderTopLeftRadius:
              style.messageBorderRadiusTL ?? style.messageBorderRadius,
            borderTopRightRadius:
              style.messageBorderRadiusTR ?? style.messageBorderRadius,
            borderBottomLeftRadius:
              style.messageBorderRadiusBL ?? style.messageBorderRadius,
            borderBottomRightRadius:
              style.messageBorderRadiusBR ?? style.messageBorderRadius,
            padding: style.messagePadding,
            textShadow: style.textShadow,
          }}
        >
          {style.showAvatar && (
            <UserAvatar
              color={msg.color}
              size={style.fontSize + 10}
              username={msg.user}
            />
          )}
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
                fontSize: style.fontSize,
              }}
            >
              {msg.user}:
            </span>
            <span style={{ fontSize: style.fontSize }}>{msg.text}</span>
          </div>
        </div>
      ))}
      {/* Status indicators - only show in preview/live view */}
      {isLiveView && (
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
