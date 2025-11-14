import type { EmojiData } from "@/lib/emoji-extractor";
import { EmojiBouncingDisplay } from "@/components/emoji-bouncing-display";
import { EmojiFireworkDisplay } from "@/components/emoji-firework-display";
import { EmojiGravityDisplay } from "@/components/emoji-gravity-display";
import type { FireworkPosition } from "@/components/firework-position-selector";

export type EmojiWallEffect = "gravity" | "bouncing-dvd" | "firework";
export type GravityRemovalMode = "time" | "bounce";

type EmojiWallDisplayProps = {
  emojis: EmojiData[];
  effect: EmojiWallEffect;
  emojiSize: number;
  emojiLifetime: number;
  gravityPower: number;
  gravityInitialVelocity: number;
  gravityRemovalMode: GravityRemovalMode;
  gravityBounceCount: number;
  bouncingPower: number;
  bouncingSpeed: number;
  fireworkRadius: number;
  fireworkSpeed: number;
  fireworkPosition: FireworkPosition;
  onEmojiRemove?: (emojiId: string) => void;
};

export function EmojiWallDisplay({
  emojis,
  effect,
  emojiSize,
  emojiLifetime,
  gravityPower,
  gravityInitialVelocity,
  gravityRemovalMode,
  gravityBounceCount,
  bouncingPower,
  bouncingSpeed,
  fireworkRadius,
  fireworkSpeed,
  fireworkPosition,
  onEmojiRemove,
}: EmojiWallDisplayProps) {
  if (effect === "firework") {
    return (
      <EmojiFireworkDisplay
        emojiLifetime={emojiLifetime}
        emojiSize={emojiSize}
        emojis={emojis}
        fireworkPosition={fireworkPosition}
        fireworkRadius={fireworkRadius}
        fireworkSpeed={fireworkSpeed}
      />
    );
  }

  if (effect === "bouncing-dvd") {
    return (
      <EmojiBouncingDisplay
        bouncingSpeed={bouncingSpeed}
        emojiSize={emojiSize}
        emojis={emojis}
      />
    );
  }

  return (
    <EmojiGravityDisplay
      bouncingPower={bouncingPower}
      bouncingSpeed={bouncingSpeed}
      effect={effect}
      emojiSize={emojiSize}
      emojis={emojis}
      gravityBounceCount={gravityBounceCount}
      gravityInitialVelocity={gravityInitialVelocity}
      gravityPower={gravityPower}
      gravityRemovalMode={gravityRemovalMode}
      onEmojiRemove={onEmojiRemove}
    />
  );
}



