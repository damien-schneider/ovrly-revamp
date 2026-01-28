import type { ChatMessage, MessageProcessorContext } from "../types";
import {
  DEBUG_MODE,
  JOIN_REGEX,
  NOTICE_REGEX,
  PRIVMSG_REGEX,
  WELCOME_REGEX,
} from "./constants";

export function debugLog(...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.log("[TwitchChat]", ...args);
  }
}

export function isAuthFailureMessage(message: string): boolean {
  return (
    message.includes("Login authentication failed") ||
    message.includes("Invalid NICK") ||
    message.includes("Improperly formatted auth")
  );
}

export function isJoinConfirmation(
  line: string,
  username: string,
  channel: string
): boolean {
  const joinMatch = line.match(JOIN_REGEX);
  if (!joinMatch) {
    return false;
  }
  const [, joinUser, joinChannel] = joinMatch;
  return (
    joinUser.toLowerCase() === username.toLowerCase() &&
    joinChannel.toLowerCase() === channel.toLowerCase()
  );
}

export function parseTags(tagsStr: string | undefined): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!tagsStr) {
    return tags;
  }

  for (const tag of tagsStr.split(";")) {
    const [key, value] = tag.split("=");
    if (key) {
      tags[key] = value || "";
    }
  }
  return tags;
}

export function parsePrivateMessage(
  line: string,
  normalizedChannel: string
): ChatMessage | null {
  const privmsgMatch = line.match(PRIVMSG_REGEX);
  if (!privmsgMatch) {
    return null;
  }

  const [, tagsStr, msgUsername, msgChannel, msgText] = privmsgMatch;

  // Only process messages from the channel we're listening to
  if (msgChannel.toLowerCase() !== normalizedChannel) {
    return null;
  }

  const parsedTags = parseTags(tagsStr);
  const displayName = parsedTags["display-name"] || msgUsername;
  const messageColor = parsedTags.color || undefined;
  const msgId = parsedTags.id || `${Date.now()}-${Math.random()}`;

  return {
    id: msgId,
    username: msgUsername.toLowerCase(),
    displayName,
    message: msgText,
    timestamp: Number.parseInt(
      parsedTags["tmi-sent-ts"] || Date.now().toString(),
      10
    ),
    color: messageColor,
  };
}

export function processIrcLine(
  line: string,
  ctx: MessageProcessorContext
): void {
  debugLog("Received:", line);

  // Handle PING (keep-alive)
  if (line.startsWith("PING")) {
    ctx.ws.send("PONG :tmi.twitch.tv");
    debugLog("Sent PONG");
    return;
  }

  // Handle welcome message (001) - confirms auth success
  const welcomeMatch = line.match(WELCOME_REGEX);
  if (welcomeMatch) {
    debugLog("Auth successful, welcome received for:", welcomeMatch[1]);
    return;
  }

  // Handle authentication failure notices
  const noticeMatch = line.match(NOTICE_REGEX);
  if (noticeMatch) {
    debugLog("NOTICE received:", noticeMatch[1]);
    if (isAuthFailureMessage(noticeMatch[1])) {
      ctx.setError(`Authentication failed: ${noticeMatch[1]}`);
      ctx.clearConnectionTimeout();
      ctx.ws.close();
      return;
    }
  }

  // Handle JOIN confirmation
  if (isJoinConfirmation(line, ctx.username, ctx.normalizedChannel)) {
    debugLog("JOIN confirmed for channel:", ctx.normalizedChannel);
    ctx.clearConnectionTimeout();
    ctx.setIsConnected(true);
    // biome-ignore lint/style/noNonNullAssertion: ref is always defined
    ctx.isConnectingRef.current! = false;
    return;
  }

  // Parse PRIVMSG (chat messages)
  const chatMessage = parsePrivateMessage(line, ctx.normalizedChannel);
  if (chatMessage) {
    debugLog(
      "Chat message from",
      chatMessage.username,
      ":",
      chatMessage.message
    );
    ctx.addMessage(chatMessage);
  }
}
