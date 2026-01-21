import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import {
  type BoxElement,
  type ChatElement,
  ElementType,
  type EmoteWallElement,
  type ImageElement,
  type OverlayContainerElement,
  type OverlayElement,
  type ProgressBarElement,
  type TextElement,
  type TimerElement,
  type WebcamElement,
} from "@/features/canvas/types";
import { useTwitchChat } from "@/hooks/use-twitch-chat";

interface ElementRendererProps {
  element: OverlayElement;
  isLiveView?: boolean;
  projectId?: string;
}

export function ElementRenderer({
  element,
  isLiveView = false,
  projectId,
}: ElementRendererProps) {
  if (!element.visible) {
    return null;
  }

  switch (element.type) {
    case ElementType.OVERLAY:
      return <OverlayWidget element={element} isLiveView={isLiveView} />;
    case ElementType.BOX:
      return <BoxWidget element={element} />;
    case ElementType.TEXT:
      return <TextWidget element={element} />;
    case ElementType.IMAGE:
      return <ImageWidget element={element} />;
    case ElementType.CHAT:
      return (
        <ChatWidget
          element={element}
          isLiveView={isLiveView}
          projectId={projectId}
        />
      );
    case ElementType.EMOTE_WALL:
      return (
        <EmoteWallWidget
          element={element}
          isLiveView={isLiveView}
          projectId={projectId}
        />
      );
    case ElementType.WEBCAM:
      return <WebcamWidget element={element} isLiveView={isLiveView} />;
    case ElementType.TIMER:
      return <TimerWidget element={element} />;
    case ElementType.PROGRESS:
      return <ProgressBarWidget element={element} />;
    default:
      return null;
  }
}

function OverlayWidget({
  element,
  isLiveView,
}: {
  element: OverlayContainerElement;
  isLiveView: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: element.backgroundColor || "transparent",
        position: "relative",
        border: isLiveView ? "none" : "2px solid rgba(37, 99, 235, 0.1)",
        borderRadius: isLiveView ? 0 : "4px",
        boxShadow: isLiveView ? "none" : "inset 0 0 10px rgba(0,0,0,0.02)",
      }}
    >
      {!isLiveView && (
        <div className="absolute top-2 left-2 rounded bg-blue-500 px-2 py-0.5 font-bold text-[10px] text-white uppercase tracking-wider opacity-60">
          {element.name}
        </div>
      )}
    </div>
  );
}

function BoxWidget({ element }: { element: BoxElement }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: element.gradient || element.backgroundColor,
        borderColor: element.borderColor,
        borderWidth: element.borderWidth,
        borderStyle: "solid",
        borderRadius: element.borderRadius,
        opacity: element.opacity,
        boxShadow: element.boxShadow || "none",
        background: element.gradient || element.backgroundColor,
      }}
    />
  );
}

function getTextAlignment(textAlign: string): string {
  if (textAlign === "center") {
    return "center";
  }
  if (textAlign === "right") {
    return "flex-end";
  }
  return "flex-start";
}

function TextWidget({ element }: { element: TextElement }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: getTextAlignment(element.textAlign),
        color: element.color,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        opacity: element.opacity,
        whiteSpace: "pre-wrap",
        overflow: "hidden",
        textShadow: element.textShadow || "none",
        letterSpacing: element.letterSpacing
          ? `${element.letterSpacing}px`
          : undefined,
        lineHeight: element.lineHeight ? element.lineHeight : undefined,
      }}
    >
      {element.content}
    </div>
  );
}

function ImageWidget({ element }: { element: ImageElement }) {
  return (
    <img
      alt="overlay"
      height={element.height}
      src={element.src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: element.objectFit,
        opacity: element.opacity,
        pointerEvents: "none",
        borderRadius: element.borderRadius ?? 0,
        borderWidth: element.borderWidth ?? 0,
        borderColor: element.borderColor ?? "transparent",
        borderStyle: element.borderWidth ? "solid" : "none",
      }}
      width={element.width}
    />
  );
}

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

function ChatWidget({
  element,
  isLiveView,
  projectId,
}: {
  element: ChatElement;
  isLiveView: boolean;
  projectId?: string;
}) {
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

// Floating emote for emote wall
interface FloatingEmote {
  id: string;
  emote: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  velocityY: number;
  velocityX: number;
  createdAt: number;
}

function EmoteWallWidget({
  element,
  isLiveView,
  projectId,
}: {
  element: EmoteWallElement;
  isLiveView: boolean;
  projectId?: string;
}) {
  const defaultEmotes = ["🔥", "❤️", "😂", "👍", "🎉", "💯", "⭐", "🚀"];
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    style = {
      gravity: "up",
      spawnMode: "bottom",
      fadeOut: true,
      fadeOutDuration: 1000,
      emoteSize: 48,
      emoteSizeVariation: 16,
      rotationEnabled: true,
      maxRotation: 30,
      bounceEnabled: false,
      trailEnabled: false,
      trailOpacity: 0.3,
    },
    previewEnabled = false,
  } = element;

  const project = useQuery(
    api.projects.getById,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );

  const getSpawnX = () => {
    if (style.spawnMode === "center") {
      return 50;
    }
    if (style.spawnMode === "sides") {
      return Math.random() > 0.5 ? Math.random() * 20 : 80 + Math.random() * 20;
    }
    return Math.random() * 100;
  };

  const getSpawnY = () => {
    if (style.gravity === "up" || style.spawnMode === "bottom") {
      return 100;
    }
    if (style.gravity === "down") {
      return 0;
    }
    return 50;
  };

  const getVelocityY = () => {
    if (style.gravity === "up") {
      return -element.speed * 2;
    }
    if (style.gravity === "down") {
      return element.speed * 2;
    }
    return (Math.random() - 0.5) * element.speed;
  };

  const getVelocityX = () => {
    if (style.gravity === "left") {
      return -element.speed;
    }
    if (style.gravity === "right") {
      return element.speed;
    }
    return (Math.random() - 0.5) * element.speed;
  };

  const spawnEmote = (specificEmote?: string) => {
    const emote =
      specificEmote ||
      defaultEmotes[Math.floor(Math.random() * defaultEmotes.length)];

    const newEmote: FloatingEmote = {
      id: `${Date.now()}-${Math.random()}`,
      emote,
      x: getSpawnX(),
      y: getSpawnY(),
      size: style.emoteSize + (Math.random() - 0.5) * style.emoteSizeVariation,
      rotation: style.rotationEnabled
        ? (Math.random() - 0.5) * style.maxRotation * 2
        : 0,
      opacity: 1,
      velocityY: getVelocityY(),
      velocityX: getVelocityX(),
      createdAt: Date.now(),
    };

    setFloatingEmotes((prev) => {
      const maxEmotes = element.density * 10;
      const newEmotes = [...prev, newEmote];
      if (newEmotes.length > maxEmotes) {
        return newEmotes.slice(-maxEmotes);
      }
      return newEmotes;
    });
  };

  useTwitchChat({
    channel: project?.channel,
    accessToken: null,
    username: null,
    enabled: isLiveView && !!project?.channel,
    onMessage: (msg) => {
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const matches = msg.message.match(emojiRegex);
      if (matches) {
        for (const emote of matches) {
          spawnEmote(emote);
        }
      }
    },
  });

  useEffect(() => {
    if (isLiveView) {
      // In live view, we only spawn from events (handled by useTwitchChat)
      // but we still need the animation frame below
      return;
    }

    if (!previewEnabled) {
      // Show static preview
      const staticEmotes = defaultEmotes
        .slice(0, Math.min(10, element.density * 2))
        .map((emote, i) => ({
          id: `static-${i}`,
          emote,
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          size:
            style.emoteSize + (Math.random() - 0.5) * style.emoteSizeVariation,
          rotation: style.rotationEnabled
            ? (Math.random() - 0.5) * style.maxRotation * 2
            : 0,
          opacity: 0.6,
          velocityY: 0,
          velocityX: 0,
          createdAt: Date.now(),
        }));
      setFloatingEmotes(staticEmotes);
      return;
    }

    // Animated preview spawn
    const spawnInterval = setInterval(spawnEmote, 1000 / element.density);
    return () => clearInterval(spawnInterval);
  }, [element.density, previewEnabled, isLiveView, style, spawnEmote]);

  useEffect(() => {
    // Animation loop (runs for both preview and live)
    const animate = () => {
      setFloatingEmotes((prev) =>
        prev
          .map((e) => {
            const age = Date.now() - e.createdAt;
            const fadeProgress = style.fadeOut
              ? Math.max(0, 1 - age / (style.fadeOutDuration * 3))
              : 1;

            return {
              ...e,
              y: e.y + e.velocityY * 0.1,
              x: e.x + e.velocityX * 0.1,
              rotation: style.rotationEnabled
                ? e.rotation + e.velocityY * 0.5
                : e.rotation,
              opacity: fadeProgress,
              velocityY:
                style.bounceEnabled && (e.y <= 0 || e.y >= 100)
                  ? -e.velocityY * 0.8
                  : e.velocityY,
            };
          })
          .filter(
            (e) =>
              e.opacity > 0 && e.y > -20 && e.y < 120 && e.x > -20 && e.x < 120
          )
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [style]);

  return (
    <div
      className={
        isLiveView
          ? "relative overflow-hidden"
          : "relative overflow-hidden rounded-xl border-2 border-gray-200 border-dashed bg-gray-50/50"
      }
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: isLiveView ? "transparent" : undefined,
      }}
    >
      {!isLiveView && (
        <span className="absolute top-2 left-2 font-bold font-mono text-[10px] text-gray-400 uppercase">
          Emote Wall
        </span>
      )}
      {previewEnabled && !isLiveView && (
        <div className="absolute top-2 right-2 rounded bg-green-500 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest">
          Preview
        </div>
      )}
      {floatingEmotes.map((item) => (
        <div
          key={item.id}
          style={{
            position: "absolute",
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: item.size,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
            opacity: item.opacity,
            transition: previewEnabled ? "none" : "all 0.3s ease-out",
            pointerEvents: "none",
          }}
        >
          {item.emote}
        </div>
      ))}
    </div>
  );
}

function WebcamWidget({
  element,
  isLiveView,
}: {
  element: WebcamElement;
  isLiveView: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // Camera not available or permission denied - silent fail for preview
      }
    };

    startCamera();
    return () => {
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  return (
    <div
      className={
        isLiveView
          ? "relative flex h-full w-full items-center justify-center overflow-hidden"
          : "relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 text-gray-500"
      }
      style={{
        borderRadius: element.shape === "circle" ? "50%" : element.borderRadius,
        border: `${element.borderWidth}px solid ${element.borderColor}`,
        boxShadow: `0 4px ${element.shadowBlur}px ${element.shadowColor}`,
      }}
    >
      <video
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        ref={videoRef}
        style={{ transform: "scaleX(-1)" }}
      />
      {!isLiveView && (
        <div className="absolute top-2 left-2 rounded bg-black/40 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest backdrop-blur-sm">
          Live Feed
        </div>
      )}
    </div>
  );
}

function TimerWidget({ element }: { element: TimerElement }) {
  const [timeDisplay, setTimeDisplay] = useState("00:00:00");
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(element.elapsedMs || 0);

  const {
    style = {
      showDays: false,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      separator: ":",
      padNumbers: true,
      completedText: "00:00",
      backgroundColor: "transparent",
      borderRadius: 0,
      padding: 0,
    },
  } = element;

  useEffect(() => {
    const formatNumber = (n: number) =>
      style.padNumbers
        ? String(Math.floor(n)).padStart(2, "0")
        : String(Math.floor(n));

    const updateTimer = () => {
      let totalSeconds: number;

      if (element.mode === "stopwatch") {
        if (element.isRunning) {
          const elapsed =
            Date.now() - startTimeRef.current + elapsedRef.current;
          totalSeconds = Math.floor(elapsed / 1000);
        } else {
          totalSeconds = Math.floor(elapsedRef.current / 1000);
        }
      } else if (element.mode === "countdown") {
        const target = new Date(element.targetDate).getTime();
        const diff = target - Date.now();
        totalSeconds = Math.max(0, Math.floor(diff / 1000));
      } else {
        // countup
        const start = new Date(element.targetDate).getTime();
        totalSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
      }

      const days = Math.floor(totalSeconds / 86_400);
      const hours = Math.floor((totalSeconds % 86_400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const parts: string[] = [];
      if (style.showDays && days > 0) {
        parts.push(formatNumber(days));
      }
      if (style.showHours) {
        parts.push(formatNumber(hours));
      }
      if (style.showMinutes) {
        parts.push(formatNumber(minutes));
      }
      if (style.showSeconds) {
        parts.push(formatNumber(seconds));
      }

      const display = parts.join(style.separator);
      setTimeDisplay(
        totalSeconds === 0 && element.mode === "countdown"
          ? style.completedText
          : display
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [element, style]);

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        color: element.color,
        fontWeight: "bold",
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: style.padding,
      }}
    >
      {timeDisplay}
    </div>
  );
}

function ProgressBarWidget({ element }: { element: ProgressBarElement }) {
  const {
    showLabel = false,
    labelColor = "#ffffff",
    labelPosition = "inside",
    animated = false,
    stripes = false,
  } = element;

  return (
    <div className="relative flex h-full w-full flex-col">
      {showLabel && labelPosition === "above" && (
        <span className="mb-1 font-bold text-xs" style={{ color: labelColor }}>
          {Math.round(element.progress)}%
        </span>
      )}
      <div
        className="relative flex flex-1 items-center"
        style={{
          backgroundColor: element.backgroundColor,
          borderRadius: element.borderRadius,
          overflow: "hidden",
          padding: "4px",
        }}
      >
        <div
          className={animated ? "animate-pulse" : ""}
          style={{
            width: `${element.progress}%`,
            height: "100%",
            backgroundColor: element.barColor,
            borderRadius: element.borderRadius / 2,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            backgroundImage: stripes
              ? "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)"
              : "none",
            backgroundSize: stripes ? "1rem 1rem" : "auto",
          }}
        >
          {showLabel && labelPosition === "inside" && (
            <span
              className="absolute inset-0 flex items-center justify-center font-bold text-xs"
              style={{ color: labelColor }}
            >
              {Math.round(element.progress)}%
            </span>
          )}
        </div>
      </div>
      {showLabel && labelPosition === "outside" && (
        <span className="mt-1 font-bold text-xs" style={{ color: labelColor }}>
          {Math.round(element.progress)}%
        </span>
      )}
    </div>
  );
}
