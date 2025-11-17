import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { EmojiWallDisplay, type EmojiWallEffect, type GravityRemovalMode } from "@/features/wall-emote/components/emoji-wall-display";
import type { FireworkPosition } from "@/features/wall-emote/components/firework-position-selector";
import {
  extractEmojisFromMessage,
  generatePreviewEmoji,
  generateTestMessageWithEmojis,
  type EmojiData,
} from "@/lib/emoji-extractor";
import { useProviderData } from "@/hooks/use-provider-token";
import { useTwitchChat } from "@/hooks/use-twitch-chat";

interface WallEmoteOverlayProps {
  overlayId: Id<"overlays">;
}

const PREVIEW_INTERVAL_MS = 1000;
const CLEANUP_INTERVAL_MS = 1000;
const MILLISECONDS_MULTIPLIER = 1000;

export default function WallEmoteOverlay({ overlayId }: WallEmoteOverlayProps) {
  const overlayQuery = useQuery(
    convexQuery(api.overlays.getById, { id: overlayId })
  );
  const overlay = overlayQuery.data;
  const { providerToken, twitchUsername } = useProviderData();
  const [emojis, setEmojis] = useState<EmojiData[]>([]);
  
  // Extract emojis from real chat messages
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const testMessageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract settings and channel - use safe defaults
  const settings = overlay?.settings as {
    effect?: EmojiWallEffect;
    emojiSize?: number;
    maxEmojis?: number;
    minEmojiLifetime?: number;
    maxEmojiLifetime?: number;
    emojiLifetime?: number;
    gravityPower?: number;
    gravityInitialVelocity?: number;
    gravityRemovalMode?: GravityRemovalMode;
    minGravityBounceCount?: number;
    maxGravityBounceCount?: number;
    gravityBounceCount?: number;
    bouncingPower?: number;
    bouncingSpeed?: number;
    fireworkExplosionRadius?: number;
    fireworkRadius?: number;
    fireworkSpeed?: number;
    fireworkPosition?: FireworkPosition;
    previewEmojisEnabled?: boolean;
    emojisPerSecond?: number;
    previewBackgroundDark?: boolean;
    testMessagesEnabled?: boolean;
  } | undefined;

  const previewEmojisEnabled = settings?.previewEmojisEnabled ?? false;
  const testMessagesEnabled = settings?.testMessagesEnabled ?? false;
  const channel = overlay?.channel ?? null;

  // Extract computed values for use in effects (with safe defaults) - MUST be before hooks
  const effect = settings?.effect ?? "gravity";
  const emojiSize = settings?.emojiSize ?? 48;
  const maxEmojis = settings?.maxEmojis ?? 50;
  const minEmojiLifetime = settings?.minEmojiLifetime ?? 2;
  const maxEmojiLifetime = settings?.maxEmojiLifetime ?? 8;
  const emojiLifetime = settings?.emojiLifetime ?? 5;
  const gravityPower = settings?.gravityPower ?? 25;
  const gravityInitialVelocity = settings?.gravityInitialVelocity ?? 30;
  const gravityRemovalMode = settings?.gravityRemovalMode ?? "time";
  const minGravityBounceCount = settings?.minGravityBounceCount ?? 1;
  const maxGravityBounceCount = settings?.maxGravityBounceCount ?? 5;
  const gravityBounceCount = settings?.gravityBounceCount ?? 3;
  const bouncingPower = settings?.bouncingPower ?? 50;
  const bouncingSpeed = settings?.bouncingSpeed ?? 2;
  const fireworkRadius = settings?.fireworkExplosionRadius ?? settings?.fireworkRadius ?? 200;
  const fireworkSpeed = settings?.fireworkSpeed ?? 1;
  const fireworkPosition = settings?.fireworkPosition ?? "center-center";
  const emojisPerSecond = settings?.emojisPerSecond ?? 1;

  // Connect to Twitch chat - MUST be called before any early returns
  // Disable real chat when test messages or preview emojis are enabled
  const {
    messages: realMessages,
    isConnected: _isChatConnected,
    error: _chatError,
  } = useTwitchChat({
    channel,
    accessToken: providerToken || undefined,
    username: twitchUsername || undefined,
    enabled: Boolean(
      channel &&
        providerToken &&
        twitchUsername &&
        !previewEmojisEnabled &&
        !testMessagesEnabled
    ),
  });

  // Reset processed messages when switching modes
  useEffect(() => {
    processedMessageIdsRef.current.clear();
    if (previewEmojisEnabled || testMessagesEnabled) {
      setEmojis([]);
    }
  }, [previewEmojisEnabled, testMessagesEnabled]);
  
  useEffect(() => {
    if (previewEmojisEnabled || testMessagesEnabled || !channel) {
      return;
    }

    // Only process new messages
    for (const message of realMessages) {
      if (processedMessageIdsRef.current.has(message.id)) {
        continue;
      }
      processedMessageIdsRef.current.add(message.id);

      const messageEmojis = extractEmojisFromMessage(
        message.message,
        undefined, // Emotes not available from useTwitchChat currently
        {
          min: minEmojiLifetime,
          max: maxEmojiLifetime,
        },
        {
          min: minGravityBounceCount,
          max: maxGravityBounceCount,
        }
      );

      if (messageEmojis.length > 0) {
        setEmojis((prev) => [
          ...prev.slice(-(maxEmojis - messageEmojis.length)),
          ...messageEmojis,
        ]);
      }
    }
  }, [realMessages, previewEmojisEnabled, testMessagesEnabled, channel, minEmojiLifetime, maxEmojiLifetime, minGravityBounceCount, maxGravityBounceCount, maxEmojis]);

  // Clean up expired emojis based on lifetime (only for time-based mode)
  useEffect(() => {
    if (gravityRemovalMode === "bounce" && effect === "gravity") {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      setEmojis((prev) =>
        prev.filter((emoji) => {
          const lifetimeMs =
            emoji.lifetime || emojiLifetime * MILLISECONDS_MULTIPLIER;
          return now - emoji.timestamp < lifetimeMs;
        })
      );
    }, CLEANUP_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [gravityRemovalMode, effect, emojiLifetime]);

  // Handler for bounce-based emoji removal
  const handleEmojiRemove = (emojiId: string) => {
    setEmojis((prev) => prev.filter((emoji) => emoji.id !== emojiId));
  };

  // Preview mode - generate random emojis
  useEffect(() => {
    if (!previewEmojisEnabled) {
      return;
    }
    const intervalMs = PREVIEW_INTERVAL_MS / emojisPerSecond;

    const interval = setInterval(() => {
      const newEmoji = generatePreviewEmoji(
        {
          min: minEmojiLifetime,
          max: maxEmojiLifetime,
        },
        {
          min: minGravityBounceCount,
          max: maxGravityBounceCount,
        }
      );
      setEmojis((prev) => {
        const newEmojis = [...prev.slice(-(maxEmojis - 1)), newEmoji];
        return newEmojis;
      });
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [previewEmojisEnabled, emojisPerSecond, minEmojiLifetime, maxEmojiLifetime, minGravityBounceCount, maxGravityBounceCount, maxEmojis]);

  // Test messages mode - generate emoji-rich test messages
  useEffect(() => {
    if (!testMessagesEnabled) {
      // Clear interval if disabled
      if (testMessageIntervalRef.current) {
        clearInterval(testMessageIntervalRef.current);
        testMessageIntervalRef.current = null;
      }
      return;
    }

    const MIN_INTERVAL_MS = 2000;
    const MAX_INTERVAL_MS = 4000;

    const sendTestMessage = () => {
      const { message, emotes } = generateTestMessageWithEmojis();
      const messageEmojis = extractEmojisFromMessage(
        message,
        emotes,
        {
          min: minEmojiLifetime,
          max: maxEmojiLifetime,
        },
        {
          min: minGravityBounceCount,
          max: maxGravityBounceCount,
        }
      );

      if (messageEmojis.length > 0) {
        setEmojis((prev) => [
          ...prev.slice(-(maxEmojis - messageEmojis.length)),
          ...messageEmojis,
        ]);
      }
    };

    // Send initial message after a short delay
    const initialTimeout = setTimeout(() => {
      sendTestMessage();
    }, 500);

    // Set up interval to send messages every 2-4 seconds
    const interval = setInterval(() => {
      sendTestMessage();
    }, Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS) + MIN_INTERVAL_MS);

    testMessageIntervalRef.current = interval;

    return () => {
      clearTimeout(initialTimeout);
      if (testMessageIntervalRef.current) {
        clearInterval(testMessageIntervalRef.current);
        testMessageIntervalRef.current = null;
      }
    };
  }, [testMessagesEnabled, minEmojiLifetime, maxEmojiLifetime, minGravityBounceCount, maxGravityBounceCount, maxEmojis]);

  if (overlayQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!overlay) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Overlay not found</p>
      </div>
    );
  }

  if (overlay.type !== "emoji-wall") {
    return (
      <div className="flex h-full items-center justify-center">
        <p>This overlay is not a wall-emote overlay</p>
      </div>
    );
  }

  return (
    <div className="relative size-full overflow-hidden">
      <EmojiWallDisplay
        bouncingPower={bouncingPower}
        bouncingSpeed={bouncingSpeed}
        effect={effect}
        emojiLifetime={emojiLifetime}
        emojiSize={emojiSize}
        emojis={emojis.slice(-maxEmojis)}
        fireworkPosition={fireworkPosition}
        fireworkRadius={fireworkRadius}
        fireworkSpeed={fireworkSpeed}
        gravityBounceCount={gravityBounceCount}
        gravityInitialVelocity={gravityInitialVelocity}
        gravityPower={gravityPower}
        gravityRemovalMode={gravityRemovalMode}
        onEmojiRemove={handleEmojiRemove}
      />
    </div>
  );
}
