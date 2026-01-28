import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import type { ChatElement } from "@/features/canvas/types";
import { useTwitchChat } from "@/features/twitch/hooks/use-twitch-chat";

// Mock messages for chat preview
const mockPreviewMessages = [
  {
    user: "StreamFan",
    text: "This looks amazing! 🔥",
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

interface ChatWidgetProps {
  element: ChatElement;
  isLiveView: boolean;
  projectId?: string;
}

export function ChatWidget({
  element,
  isLiveView,
  projectId,
}: ChatWidgetProps) {
  const { style, mockMessages, previewEnabled } = element;
  const project = useQuery(
    api.projects.getById,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );

  const { messages: liveMessages } = useTwitchChat({
    channel: project?.channel,
    accessToken: null,
    username: null,
    enabled: isLiveView && !!project?.channel,
  });

  let displayMessages = previewEnabled ? mockPreviewMessages : mockMessages;
  if (isLiveView && project?.channel) {
    displayMessages = liveMessages.map((m) => ({
      user: m.displayName || m.username,
      text: m.message,
      color: m.color || "#a855f7",
      badges: [],
    }));
  }

  const containerRef = useRef<HTMLDivElement>(null);

  // Animation for preview messages
  const [visibleMessages, setVisibleMessages] = useState(displayMessages);

  useEffect(() => {
    if (isLiveView && project?.channel) {
      setVisibleMessages(displayMessages);
      return;
    }

    if (!previewEnabled) {
      setVisibleMessages(mockMessages);
      return;
    }

    // Cycle through messages for preview
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
    mockMessages,
    style.maxMessages,
    isLiveView,
    project?.channel,
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
      {previewEnabled && !isLiveView && (
        <div className="absolute top-2 right-2 rounded bg-green-500 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest">
          Preview
        </div>
      )}
    </div>
  );
}
