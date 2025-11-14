export type EmojiData = {
  id: string;
  emoji: string;
  type: "unicode" | "emote";
  url?: string;
  timestamp: number;
  lifetime?: number;
  bounceLimit?: number;
};

type EmoteMap = Record<string, string[]>;

type LifetimeRange = {
  min: number;
  max: number;
};

type BounceCountRange = {
  min: number;
  max: number;
};

const EMOJI_REGEX =
  /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/gu;

const BASE_36 = 36;
const RANDOM_ID_START = 2;
const RANDOM_ID_LENGTH = 9;

// Sample emojis for preview mode
const PREVIEW_EMOJIS = ["🎉", "🔥", "💯", "⭐", "❤️", "👍", "🎮", "🚀", "💪", "🎊"];

function generateId(): string {
  return `emoji-${Date.now()}-${Math.random().toString(BASE_36).substring(RANDOM_ID_START, RANDOM_ID_LENGTH)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function extractEmojisFromMessage(
  message: string,
  emotes: EmoteMap | undefined,
  lifetimeRange: LifetimeRange,
  bounceCountRange: BounceCountRange
): EmojiData[] {
  const emojis: EmojiData[] = [];
  const now = Date.now();

  // Extract Unicode emojis
  const unicodeMatches = message.matchAll(EMOJI_REGEX);
  for (const match of unicodeMatches) {
    if (match[0]) {
      emojis.push({
        id: generateId(),
        emoji: match[0],
        type: "unicode",
        timestamp: now,
        lifetime: lifetimeRange.min * 1000 + randomInRange(0, (lifetimeRange.max - lifetimeRange.min) * 1000),
        bounceLimit: Math.floor(randomInRange(bounceCountRange.min, bounceCountRange.max)),
      });
    }
  }

  // Extract Twitch emotes
  if (emotes) {
    for (const [emoteId, positions] of Object.entries(emotes)) {
      if (positions && positions.length > 0) {
        // Get emote URL - Twitch emote URL format
        const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/1.0`;
        
        emojis.push({
          id: generateId(),
          emoji: emoteId,
          type: "emote",
          url: emoteUrl,
          timestamp: now,
          lifetime: lifetimeRange.min * 1000 + randomInRange(0, (lifetimeRange.max - lifetimeRange.min) * 1000),
          bounceLimit: Math.floor(randomInRange(bounceCountRange.min, bounceCountRange.max)),
        });
      }
    }
  }

  return emojis;
}

export function generatePreviewEmoji(
  lifetimeRange: LifetimeRange,
  bounceCountRange: BounceCountRange
): EmojiData {
  const randomEmoji =
    PREVIEW_EMOJIS[Math.floor(Math.random() * PREVIEW_EMOJIS.length)] ||
    "🎉";

  return {
    id: generateId(),
    emoji: randomEmoji,
    type: "unicode",
    timestamp: Date.now(),
    lifetime: lifetimeRange.min * 1000 + randomInRange(0, (lifetimeRange.max - lifetimeRange.min) * 1000),
    bounceLimit: Math.floor(randomInRange(bounceCountRange.min, bounceCountRange.max)),
  };
}



