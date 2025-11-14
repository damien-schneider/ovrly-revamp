import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { EmojiData } from "@/lib/emoji-extractor";
import type { FireworkPosition } from "@/components/firework-position-selector";

type EmojiFireworkDisplayProps = {
  emojis: EmojiData[];
  emojiSize: number;
  emojiLifetime: number;
  fireworkRadius: number;
  fireworkSpeed: number;
  fireworkPosition: FireworkPosition;
};

type FireworkTarget = {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  duration: number;
};

export function EmojiFireworkDisplay({
  emojis,
  emojiSize,
  emojiLifetime,
  fireworkRadius,
  fireworkPosition,
}: EmojiFireworkDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const fireworkTargetsRef = useRef<Map<string, FireworkTarget>>(new Map());

  // Update bounds when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateBounds = () => {
      if (containerRef.current) {
        setBounds({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateBounds();
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const getStartPosition = (
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): { x: number; y: number } => {
    switch (fireworkPosition) {
      case "top-left":
        return { x: 0, y: 0 };
      case "top-center":
        return { x: centerX, y: 0 };
      case "top-right":
        return { x: width, y: 0 };
      case "center-left":
        return { x: 0, y: centerY };
      case "center-center":
        return { x: centerX, y: centerY };
      case "center-right":
        return { x: width, y: centerY };
      case "bottom-left":
        return { x: 0, y: height };
      case "bottom-center":
        return { x: centerX, y: height };
      case "bottom-right":
        return { x: width, y: height };
      default:
        return { x: centerX, y: centerY };
    }
  };

  const calculateDirectionComponent = (
    start: number,
    center: number,
    max: number
  ): number => {
    if (start === 0) {
      return 1;
    }
    if (start === max) {
      return -1;
    }
    if (start === center) {
      return Math.random() > 0.5 ? 1 : -1;
    }
    return 0;
  };

  const calculateBaseDirection = (
    startPos: { x: number; y: number },
    centerPos: { x: number; y: number },
    size: { width: number; height: number }
  ): { x: number; y: number } => ({
    x: calculateDirectionComponent(startPos.x, centerPos.x, size.width),
    y: calculateDirectionComponent(startPos.y, centerPos.y, size.height),
  });

  const calculateTarget = (emojiId: string): FireworkTarget | null => {
    if (!(bounds.width && bounds.height)) {
      return null;
    }

    // Check if already calculated
    const existing = fireworkTargetsRef.current.get(emojiId);
    if (existing) {
      return existing;
    }

    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const { x: startX, y: startY } = getStartPosition(
      centerX,
      centerY,
      bounds.width,
      bounds.height
    );

    const { x: baseDirectionX, y: baseDirectionY } = calculateBaseDirection(
      { x: startX, y: startY },
      { x: centerX, y: centerY },
      { width: bounds.width, height: bounds.height }
    );

    // Apply 90-degree cone randomness (±45 degrees)
    const angle = ((Math.random() - 0.5) * Math.PI) / 2;
    const directionX =
      baseDirectionX * Math.cos(angle) - baseDirectionY * Math.sin(angle);
    const directionY =
      baseDirectionX * Math.sin(angle) + baseDirectionY * Math.cos(angle);

    // Random distance within firework radius
    const distance = fireworkRadius * (0.5 + Math.random() * 0.5);

    const targetX = startX + directionX * distance;
    const targetY = startY + directionY * distance;

    // Duration should be exactly the emoji lifetime in seconds
    const duration = emojiLifetime;

    const target = {
      startX,
      startY,
      targetX,
      targetY,
      duration,
    };

    fireworkTargetsRef.current.set(emojiId, target);
    return target;
  };

  const renderEmoji = (emoji: EmojiData) => {
    const target = calculateTarget(emoji.id);
    if (!target) {
      return null;
    }

    // Use emoji's individual lifetime if available (in ms), otherwise use default (in seconds)
    const emojiDuration = emoji.lifetime
      ? emoji.lifetime / 1000
      : target.duration;

    const emojiContent =
      emoji.type === "unicode" ? (
        <span style={{ fontSize: emojiSize }}>{emoji.emoji}</span>
      ) : (
        <img
          alt="emote"
          className="size-full object-contain"
          height={emojiSize}
          src={emoji.url || ""}
          width={emojiSize}
        />
      );

    return (
      <motion.div
        animate={{
          x: target.targetX,
          y: target.targetY,
        }}
        className="absolute top-0 left-0"
        exit={{
          opacity: 0,
          transition: { duration: 0.2 },
        }}
        initial={{ x: target.startX, y: target.startY }}
        key={emoji.id}
        style={{ width: emojiSize, height: emojiSize }}
        transition={{
          duration: emojiDuration,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {emojiContent}
      </motion.div>
    );
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      ref={containerRef}
    >
      <AnimatePresence>{emojis.map(renderEmoji)}</AnimatePresence>
    </div>
  );
}

