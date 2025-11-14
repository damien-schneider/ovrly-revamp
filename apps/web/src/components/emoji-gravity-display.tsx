import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { EmojiData } from "@/lib/emoji-extractor";
import type { EmojiWallEffect, GravityRemovalMode } from "@/components/emoji-wall-display";

type EmojiGravityDisplayProps = {
  emojis: EmojiData[];
  effect: EmojiWallEffect;
  emojiSize: number;
  gravityPower: number;
  gravityInitialVelocity: number;
  gravityRemovalMode: GravityRemovalMode;
  gravityBounceCount: number;
  bouncingPower: number;
  bouncingSpeed: number;
  onEmojiRemove?: (emojiId: string) => void;
};

type EmojiState = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  bounceCount: number;
  bounceLimit: number;
  maxBouncesReached: boolean;
};

export function EmojiGravityDisplay({
  emojis,
  effect,
  emojiSize,
  gravityPower,
  gravityInitialVelocity,
  gravityRemovalMode,
  gravityBounceCount,
  bouncingPower,
  bouncingSpeed,
  onEmojiRemove,
}: EmojiGravityDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [emojiStates, setEmojiStates] = useState<Map<string, EmojiState>>(
    new Map()
  );
  const animationFrameRef = useRef<number | null>(null);
  const emojisToRemoveRef = useRef<Set<string>>(new Set());
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
        const initialVy =
          effect === "gravity"
            ? -(gravityInitialVelocity / 10)
            : (Math.random() - 0.5) * bouncingSpeed * 2;

        return {
          id: emoji.id,
          x,
          y,
          vx,
          vy: initialVy,
          rotation: 0,
          bounceCount: 0,
          bounceLimit: emoji.bounceLimit ?? gravityBounceCount,
          maxBouncesReached: false,
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
  }, [
    emojis,
    bounds.width,
    bounds.height,
    emojiSize,
    bouncingSpeed,
    effect,
    gravityInitialVelocity,
    gravityBounceCount,
  ]);

  // Physics animation loop
  useEffect(() => {
    if (!(bounds.width && bounds.height)) {
      return;
    }

    // Helper to calculate wall bounce
    const handleWallBounce = (
      x: number,
      vx: number,
      wallBounce: number
    ): { x: number; vx: number } => {
      if (x <= 0) {
        return { x: 0, vx: -vx * wallBounce };
      }
      if (x >= bounds.width - emojiSize) {
        return { x: bounds.width - emojiSize, vx: -vx * wallBounce };
      }
      return { x, vx };
    };

    // Helper to calculate floor bounce
    const handleFloorBounce = (params: {
      y: number;
      vy: number;
      vx: number;
      bounceCount: number;
      bounceLimit: number;
      floorBounce: number;
      friction: number;
    }): {
      y: number;
      vy: number;
      vx: number;
      bounceCount: number;
      maxBouncesReached: boolean;
    } => {
      const newBounceCount = params.bounceCount + 1;

      if (
        gravityRemovalMode === "bounce" &&
        newBounceCount >= params.bounceLimit
      ) {
        return {
          y: params.y,
          vy: params.vy,
          vx: params.vx,
          bounceCount: newBounceCount,
          maxBouncesReached: true,
        };
      }

      return {
        y: bounds.height - emojiSize,
        vy: -params.vy * params.floorBounce,
        vx: params.vx * params.friction,
        bounceCount: newBounceCount,
        maxBouncesReached: false,
      };
    };

    // Helper function to apply gravity physics
    const applyGravityPhysics = (state: EmojiState) => {
      let {
        x,
        y,
        vx,
        vy,
        rotation,
        bounceCount,
        bounceLimit,
        maxBouncesReached,
      } = state;

      // Apply gravity
      vy += (gravityPower * 0.3) / 100;
      x += vx * 0.6;
      y += vy * 0.6;

      // Check if emoji has moved out of view (for bounce mode removal)
      if (
        gravityRemovalMode === "bounce" &&
        maxBouncesReached &&
        y > bounds.height + emojiSize
      ) {
        emojisToRemoveRef.current.add(state.id);
      }

      // Only apply bouncing physics if max bounces not reached
      if (!maxBouncesReached) {
        const wallBounce = 0.3 + (bouncingPower / 100) * 0.65;
        const floorBounce = 0.2 + (bouncingPower / 100) * 0.75;
        const friction = 0.98 - (bouncingPower / 100) * 0.08;

        // Bounce off walls
        const wallResult = handleWallBounce(x, vx, wallBounce);
        x = wallResult.x;
        vx = wallResult.vx;

        // Bounce off floor/ceiling
        if (y >= bounds.height - emojiSize) {
          const bounceResult = handleFloorBounce({
            y,
            vy,
            vx,
            bounceCount,
            bounceLimit,
            floorBounce,
            friction,
          });
          y = bounceResult.y;
          vy = bounceResult.vy;
          vx = bounceResult.vx;
          bounceCount = bounceResult.bounceCount;
          maxBouncesReached = bounceResult.maxBouncesReached;
        } else if (y <= 0) {
          vy = -vy * (floorBounce * 0.7);
          y = 0;
        }
      }

      rotation += vx * 1.5;

      return {
        x,
        y,
        vx,
        vy,
        rotation,
        bounceCount,
        bounceLimit,
        maxBouncesReached,
      };
    };

    const animate = () => {
      setEmojiStates((prev) => {
        const next = new Map(prev);

        for (const [id, state] of next.entries()) {
          const updatedState = applyGravityPhysics(state);
          next.set(id, { id, ...updatedState });
        }

        return next;
      });

      // Process emoji removals after state update
      if (emojisToRemoveRef.current.size > 0 && onEmojiRemove) {
        for (const id of emojisToRemoveRef.current) {
          onEmojiRemove(id);
        }
        emojisToRemoveRef.current.clear();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    effect,
    bounds.width,
    bounds.height,
    emojiSize,
    gravityPower,
    gravityRemovalMode,
    bouncingPower,
    bouncingSpeed,
    onEmojiRemove,
  ]);

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



