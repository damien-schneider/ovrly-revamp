import { useCallback, useEffect, useRef, useState } from "react";
import type { EmoteWallElement } from "@/features/canvas/types";
import { useTwitchChat } from "@/features/twitch/hooks/use-twitch-chat";

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

interface EmoteWallWidgetProps {
  element: EmoteWallElement;
  isLiveView: boolean;
}

const DEFAULT_EMOTES = ["🔥", "❤️", "😂", "👍", "🎉", "💯", "⭐", "🚀"];

export function EmoteWallWidget({ element, isLiveView }: EmoteWallWidgetProps) {
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

  const getSpawnX = useCallback(() => {
    if (style.spawnMode === "center") {
      return 50;
    }
    if (style.spawnMode === "sides") {
      return Math.random() > 0.5 ? Math.random() * 20 : 80 + Math.random() * 20;
    }
    return Math.random() * 100;
  }, [style.spawnMode]);

  const getSpawnY = useCallback(() => {
    if (style.gravity === "up" || style.spawnMode === "bottom") {
      return 100;
    }
    if (style.gravity === "down") {
      return 0;
    }
    return 50;
  }, [style.gravity, style.spawnMode]);

  const getVelocityY = useCallback(() => {
    if (style.gravity === "up") {
      return -element.speed * 2;
    }
    if (style.gravity === "down") {
      return element.speed * 2;
    }
    return (Math.random() - 0.5) * element.speed;
  }, [style.gravity, element.speed]);

  const getVelocityX = useCallback(() => {
    if (style.gravity === "left") {
      return -element.speed;
    }
    if (style.gravity === "right") {
      return element.speed;
    }
    return (Math.random() - 0.5) * element.speed;
  }, [style.gravity, element.speed]);

  const spawnEmote = useCallback(
    (specificEmote?: string) => {
      const emote =
        specificEmote ||
        DEFAULT_EMOTES[Math.floor(Math.random() * DEFAULT_EMOTES.length)];

      const newEmote: FloatingEmote = {
        id: `${Date.now()}-${Math.random()}`,
        emote,
        x: getSpawnX(),
        y: getSpawnY(),
        size:
          style.emoteSize + (Math.random() - 0.5) * style.emoteSizeVariation,
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
    },
    [
      getSpawnX,
      getSpawnY,
      style.emoteSize,
      style.emoteSizeVariation,
      style.rotationEnabled,
      style.maxRotation,
      getVelocityY,
      getVelocityX,
      element.density,
    ]
  );

  useTwitchChat({
    channel: undefined,
    accessToken: null,
    username: null,
    enabled: false,
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
      const staticEmotes = DEFAULT_EMOTES.slice(
        0,
        Math.min(10, element.density * 2)
      ).map((emote: string, i: number) => ({
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
