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

// Emoji-rich test messages for wall-emote overlay
const TEST_MESSAGES_WITH_EMOJIS = [
  "🎉🎉🎉 Amazing stream! 🔥💯❤️",
  "PogChamp Kappa LUL 🚀🚀",
  "🔥🔥🔥 This is so good! 💯⭐❤️",
  "🎮🎮🎮 Great gameplay! 👍💪🎊",
  "❤️❤️❤️ Love this! 🎉🔥💯",
  "🚀🚀🚀 Awesome! ⭐👍🎮",
  "💯💯💯 Perfect! 🔥❤️🎉",
  "🎊🎊🎊 Amazing! 🚀💪⭐",
  "🔥💯❤️ So good! 🎉🎮👍",
  "⭐❤️🔥 Perfect stream! 🚀💯🎊",
  "🎮👍💪 Great content! 🔥🎉❤️",
  "🚀💯⭐ Awesome gameplay! 🎊🔥❤️",
];

// Twitch emote names (common ones)
const TWITCH_EMOTES = ["PogChamp", "Kappa", "LUL", "OMEGALUL", "PepeHands", "monkaS", "FeelsGoodMan", "FeelsBadMan"];

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

/**
 * Generate a test message with lots of emojis and emotes for wall-emote overlay
 */
export function generateTestMessageWithEmojis(): {
  message: string;
  emotes?: EmoteMap;
} {
  const messageTemplate =
    TEST_MESSAGES_WITH_EMOJIS[
      Math.floor(Math.random() * TEST_MESSAGES_WITH_EMOJIS.length)
    ] || TEST_MESSAGES_WITH_EMOJIS[0];

  // Randomly add some Twitch emotes to the message
  const shouldAddEmotes = Math.random() > 0.5;
  let message = messageTemplate;
  const emotes: EmoteMap = {};

  if (shouldAddEmotes) {
    const numEmotes = Math.floor(Math.random() * 3) + 1; // 1-3 emotes
    const emoteNames: string[] = [];
    let currentMessageLength = message.length;
    
    for (let i = 0; i < numEmotes; i++) {
      const emoteName =
        TWITCH_EMOTES[Math.floor(Math.random() * TWITCH_EMOTES.length)];
      if (!emoteNames.includes(emoteName)) {
        emoteNames.push(emoteName);
        // Add emote to message with space
        message += ` ${emoteName}`;
        // Create fake emote ID and position (Twitch emote format: start-end)
        // Position is after the space we just added
        const start = currentMessageLength + 1;
        const end = start + emoteName.length - 1;
        // Use a fake but valid-looking emote ID format
        const emoteId = `305954156`; // Using a common emote ID format
        if (!emotes[emoteId]) {
          emotes[emoteId] = [];
        }
        emotes[emoteId].push(`${start}-${end}`);
        currentMessageLength = message.length;
      }
    }
  }

  return { message, emotes: Object.keys(emotes).length > 0 ? emotes : undefined };
}



