import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { EmojiData } from "@/lib/emoji-extractor";

type EmojiBouncingDisplayProps = {
  emojis: EmojiData[];
  emojiSize: number;
  bouncingSpeed: number;
};

type EmojiState = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
};

export function EmojiBouncingDisplay({
  emojis,
  emojiSize,
  bouncingSpeed,
}: EmojiBouncingDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [emojiStates, setEmojiStates] = useState<Map<string, EmojiState>>(
    new Map()
  );
  const animationFrameRef = useRef<number | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

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

  // Initialize emoji states with random positions and velocities
  useEffect(() => {
    if (!(bounds.width && bounds.height)) {
      return;
    }

    setEmojiStates((prev) => {
      const next = new Map(prev);
      const emojiIds = new Set(emojis.map((e) => e.id));

      // Remove emojis that no longer exist
      for (const id of next.keys()) {
        if (!emojiIds.has(id)) {
          next.delete(id);
        }
      }

      // Helper to create initial emoji state
      const createInitialState = (emoji: EmojiData): EmojiState => {
        const x = Math.random() * (bounds.width - emojiSize);
        const y = Math.random() * (bounds.height - emojiSize);
        const vx = (Math.random() - 0.5) * bouncingSpeed * 2;
        const vy = (Math.random() - 0.5) * bouncingSpeed * 2;

        return {
          id: emoji.id,
          x,
          y,
          vx,
          vy,
          rotation: 0,
        };
      };

      // Add new emojis with initial state
      for (const emoji of emojis) {
        if (!next.has(emoji.id)) {
          next.set(emoji.id, createInitialState(emoji));
        }
      }

      return next;
    });
  }, [emojis, bounds.width, bounds.height, emojiSize, bouncingSpeed]);

  // Physics animation loop
  useEffect(() => {
    if (!(bounds.width && bounds.height)) {
      return;
    }

    // Helper to handle wall collision
    const handleWallCollision = (
      pos: number,
      vel: number,
      maxBound: number
    ): { pos: number; vel: number } => {
      if (pos <= 0) {
        return { pos: 0, vel: -vel };
      }
      if (pos >= maxBound) {
        return { pos: maxBound, vel: -vel };
      }
      return { pos, vel };
    };

    // Helper function to apply bouncing DVD physics
    const applyBouncingPhysics = (state: EmojiState) => {
      const { x: prevX, y: prevY, vx: prevVx, vy: prevVy, rotation } = state;

      // Apply velocity
      let x = prevX + prevVx * bouncingSpeed;
      let y = prevY + prevVy * bouncingSpeed;

      // Handle horizontal bounce
      const horizontalResult = handleWallCollision(
        x,
        prevVx,
        bounds.width - emojiSize
      );
      x = horizontalResult.pos;
      const vx = horizontalResult.vel;

      // Handle vertical bounce
      const verticalResult = handleWallCollision(
        y,
        prevVy,
        bounds.height - emojiSize
      );
      y = verticalResult.pos;
      const vy = verticalResult.vel;

      return { ...state, x, y, vx, vy, rotation: rotation + 1 };
    };

    const animate = () => {
      setEmojiStates((prev) => {
        const next = new Map(prev);

        for (const [id, state] of next.entries()) {
          const updatedState = applyBouncingPhysics(state);
          next.set(id, { ...updatedState, id });
        }

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [bounds.width, bounds.height, emojiSize, bouncingSpeed]);

  const renderEmoji = (emoji: EmojiData) => {
    const state = emojiStates.get(emoji.id);
    if (!state) {
      return null;
    }

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
          x: state.x,
          y: state.y,
          rotate: state.rotation,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
        }}
        className="absolute flex items-center justify-center"
        exit={{
          opacity: 0,
          scale: 0.5,
          filter: "blur(4px)",
          transition: { duration: 0.3, ease: "easeOut" },
        }}
        initial={{
          opacity: 0,
          scale: 0,
          filter: "blur(8px)",
        }}
        key={emoji.id}
        style={{
          width: emojiSize,
          height: emojiSize,
          transformOrigin: "center center",
        }}
        transition={{
          x: { type: "tween", ease: "linear", duration: 0 },
          y: { type: "tween", ease: "linear", duration: 0 },
          rotate: { type: "tween", ease: "linear", duration: 0 },
          opacity: { duration: 0.4, ease: "easeOut" },
          scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
          filter: { duration: 0.4, ease: "easeOut" },
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
      <AnimatePresence mode="popLayout">
        {emojis.map(renderEmoji)}
      </AnimatePresence>
    </div>
  );
}



