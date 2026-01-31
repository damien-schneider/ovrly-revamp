import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  id: string;
  user: string;
  text: string;
  color: string;
  badges?: string[];
  avatarUrl?: string;
}

let messageIdCounter = 0;
function generateMessageId(): string {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}-${Date.now()}`;
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
      return liveMessages.map((m, idx) => ({
        id: m.id || `live-${idx}-${m.username}`,
        user: m.displayName || m.username,
        text: m.message,
        color: m.color || "#a855f7",
        badges: [],
      }));
    }
    // No preview mode or no messages - return empty (preview handled separately)
    return [];
  }, [shouldConnectToTwitch, liveMessages]);

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

    // Preview animation - cycle through mock messages with unique IDs
    const createPreviewMessage = (
      mockMsg: (typeof mockPreviewMessages)[0]
    ): DisplayMessage => ({
      ...mockMsg,
      id: generateMessageId(),
    });

    setVisibleMessages([createPreviewMessage(mockPreviewMessages[0])]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % mockPreviewMessages.length;
      setVisibleMessages((prev) => {
        const newMessages = [
          ...prev,
          createPreviewMessage(mockPreviewMessages[index]),
        ];
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

  // Animation variants for messages
  const messageVariants = {
    initial: {
      opacity: 0,
      x: style.animation === "slide" ? -20 : 0,
      scale: style.animation === "none" ? 1 : 0.95,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      x: style.animation === "slide" ? 20 : 0,
      scale: 0.95,
    },
  };

  // Gradient mask styles
  const maskTop = style.maskTop ?? defaultChatStyle.maskTop;
  const maskBottom = style.maskBottom ?? defaultChatStyle.maskBottom;
  const maskSize = style.maskSize ?? defaultChatStyle.maskSize;

  const getMaskStyle = () => {
    if (!(maskTop || maskBottom)) {
      return undefined;
    }

    const gradients: string[] = [];

    if (maskTop) {
      gradients.push(
        `linear-gradient(to bottom, transparent 0%, black ${maskSize}px)`
      );
    }
    if (maskBottom) {
      gradients.push(
        `linear-gradient(to top, transparent 0%, black ${maskSize}px)`
      );
    }

    return {
      maskImage: gradients.join(", "),
      WebkitMaskImage: gradients.join(", "),
      maskComposite: maskTop && maskBottom ? "intersect" : undefined,
      WebkitMaskComposite: maskTop && maskBottom ? "source-in" : undefined,
    } as React.CSSProperties;
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
        position: "relative",
        ...getMaskStyle(),
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {visibleMessages.slice(-style.maxMessages).map((msg) => (
          <motion.div
            animate="animate"
            exit="exit"
            initial="initial"
            key={msg.id}
            layout
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
            transition={{
              layout: { type: "spring", stiffness: 500, damping: 40 },
              opacity: { duration: 0.2 },
              x: { duration: 0.2 },
            }}
            variants={messageVariants}
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
          </motion.div>
        ))}
      </AnimatePresence>
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
